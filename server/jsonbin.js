import {HttpError,check,validateRecord} from './validation.js';

export function validateCatalog(kind, data) {
  check(data && typeof data==='object' && !Array.isArray(data),'Invalid catalog.');
  check(Array.isArray(data.items) && data.items.length<=2000,'Invalid catalog items.');
  const map=(items,type)=>{
    const seen=new Set();
    return items.map((payload,index)=>{
      const record=validateRecord({kind:type,id:payload?.id,payload,published:true,sort_order:index});
      check(!seen.has(record.id),'Duplicate catalog ID.');
      seen.add(record.id);
      return record.payload;
    });
  };
  if(kind==='shop') return {version:1,id:'shop',title:'Shop',kind:'shop',backgroundColor:'#f1f0e5',textColor:'#232323',items:map(data.items,'product')};
  check(Array.isArray(data.collections) && data.collections.length<=500,'Invalid collections.');
  const collections=map(data.collections,'collection');
  const items=map(data.items,'poster');
  const ids=new Set(collections.map(c=>c.id));
  check(items.every(item=>!item.collection||ids.has(item.collection)),'Unknown poster collection.');
  check(data.tags==null || (Array.isArray(data.tags)&&data.tags.length<=200&&data.tags.every(t=>typeof t==='string'&&t.length<=80)),'Invalid tags.');
  return {version:1,collections,tags:data.tags || [],items};
}
async function boundedJSON(response) {
  const limit=1024*1024;
  check(Number(response.headers.get('content-length')||0)<=limit,'Catalog too large.',502);
  const reader=response.body.getReader();
  const chunks=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();
      if(done) break;
      size+=value.byteLength;
      check(size<=limit,'Catalog too large.',502);
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(()=>{}); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function readJSONBin(kind) {
  const id=process.env[kind==='posters'?'JSONBIN_POSTERS_BIN_ID':'JSONBIN_SHOP_BIN_ID'];
  const key=process.env.JSONBIN_ACCESS_KEY;
  if(!id) throw new HttpError(503,'CONTENT_NOT_CONFIGURED');
  check(/^[a-f0-9]{24}$/i.test(id) && typeof key==='string' && key.length>0,'Invalid server catalog configuration.',503);
  const response=await fetch(`https://api.jsonbin.io/v3/b/${id}/latest`,{
    headers:{'X-Access-Key':key,'X-Bin-Meta':'false'},
    signal:AbortSignal.timeout(10000),redirect:'error'
  });
  check(response.ok,'The remote catalog is unavailable.',502);
  try {return validateCatalog(kind,await boundedJSON(response));}
  catch {throw new HttpError(502,'The remote catalog has invalid content.');}
}
