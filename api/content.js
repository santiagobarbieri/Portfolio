import {randomUUID} from 'node:crypto';
import {config, supabase, requireAdmin, rows} from '../server/supabase.js';
import {HttpError,check,text,validateRecord,validateImage} from '../server/validation.js';

function json(res,status,data) {res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
function sameOrigin(req) {
  const expected = process.env.SITE_ORIGIN;
  check(expected && req.headers.origin===expected.replace(/\/$/,''), 'This origin is not allowed.',403);
  check((req.headers['content-type'] || '').split(';')[0]==='application/json','Use JSON requests.',415);
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  try {
    const url = new URL(req.url,'http://local');
    const mode = url.searchParams.get('mode') || 'public';
    if (req.method==='GET' && mode==='public') {
      if (process.env.CONTENT_BACKEND_ENABLED!=='true') return json(res,503,{error:'CONTENT_NOT_CONFIGURED'});
      const kind=url.searchParams.get('kind');
      check(['posters','shop'].includes(kind),'Unknown catalog.');
      const all=await rows(undefined,kind==='shop'?'product':undefined);
      res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
      if (kind==='shop') return json(res,200,{version:1,id:'shop',title:'Shop',kind:'shop',backgroundColor:'#f1f0e5',textColor:'#232323',items:all.filter(r=>r.kind==='product').map(r=>r.payload)});
      const items=all.filter(r=>r.kind==='poster').map(r=>r.payload);
      return json(res,200,{version:1,collections:all.filter(r=>r.kind==='collection').map(r=>r.payload),tags:[...new Set(items.flatMap(p=>p.tags||[]))],items});
    }
    if (req.method==='GET' && mode==='admin') {
      const token=await requireAdmin(req);
      return json(res,200,{items:await rows(token)});
    }
    check(req.method==='POST','Method not allowed.',405);
    sameOrigin(req);
    const raw=typeof req.body==='string' ? req.body : JSON.stringify(req.body || {});
    check(Buffer.byteLength(raw)<=3000000,'Request too large.',413);
    let body;
    try {body=JSON.parse(raw);} catch {throw new HttpError(400,'Invalid JSON.');}
    check(body && typeof body==='object' && !Array.isArray(body),'Invalid request.');
    if (body.action==='login') {
      const email=text(body.email,254,true),password=text(body.password,1024,true);
      const auth=await supabase('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
      await requireAdmin({headers:{authorization:`Bearer ${auth.access_token}`}});
      // No refresh token or privileged key is exposed or persisted by the UI.
      return json(res,200,{access_token:auth.access_token,expires_in:auth.expires_in});
    }
    const token=await requireAdmin(req);
    if (body.action==='logout') {
      await supabase('/auth/v1/logout?scope=local',{token,method:'POST'});
      return json(res,200,{ok:true});
    }
    if (body.action==='save') {
      const record=validateRecord(body.record);
      const query=`kind=eq.${record.kind}&id=eq.${record.id}`;
      if (body.expectedUpdatedAt) {
        check(/^\d{4}-\d{2}-\d{2}T[0-9:.+Z-]+$/.test(body.expectedUpdatedAt),'Invalid revision.');
        const saved=await supabase(`/rest/v1/content_items?${query}&updated_at=eq.${encodeURIComponent(body.expectedUpdatedAt)}`,{token,method:'PATCH',body:record,headers:{Prefer:'return=representation'}});
        check(saved.length===1,'This item changed. Reload the catalog before saving.',409);
        return json(res,200,{item:saved[0]});
      }
      const saved=await supabase('/rest/v1/content_items',{token,method:'POST',body:record,headers:{Prefer:'return=representation'}});
      return json(res,201,{item:saved[0]});
    }
    if (body.action==='upload') {
      const bytes=validateImage(body.mime,body.base64);
      const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[body.mime];
      const path=`${new Date().toISOString().slice(0,10)}/${randomUUID()}.${ext}`;
      await supabase(`/storage/v1/object/portfolio-media/${path}`,{token,method:'POST',body:bytes,headers:{'Content-Type':body.mime,'Cache-Control':'max-age=31536000','x-upsert':'false'}});
      return json(res,201,{url:`${config().url}/storage/v1/object/public/portfolio-media/${path}`});
    }
    throw new HttpError(400,'Unknown action.');
  } catch(error) {
    json(res,error instanceof HttpError?error.status:500,{error:error instanceof HttpError?error.message:'The request could not be completed.'});
  }
}
