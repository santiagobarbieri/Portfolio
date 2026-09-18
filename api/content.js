import {readJSONBin} from '../server/jsonbin.js';
import {HttpError} from '../server/validation.js';

export default async function handler(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  if(req.method!=='GET') {
    res.setHeader('Allow','GET');
    return send(405,{error:'This endpoint is read-only.'});
  }
  const params=new URL(req.url,'http://local').searchParams;
  const kind=params.get('kind');
  if(!['posters','shop'].includes(kind)||[...params.keys()].some(key=>key!=='kind')||params.getAll('kind').length!==1) return send(400,{error:'Unknown catalog.'});
  try {
    const catalog=await readJSONBin(kind);
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');
    send(200,catalog);
  } catch(error) {
    send(error instanceof HttpError?error.status:502,{error:error instanceof HttpError?error.message:'The remote catalog could not be reached.'});
  }
}
