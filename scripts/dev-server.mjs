import http from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import handler from '../api/content.js';
try {process.loadEnvFile('.env');} catch(error) {if(error.code!=='ENOENT') throw error;}
const root=await realpath('.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.otf':'font/otf'};
const config=JSON.parse(await readFile('vercel.json','utf8'));
http.createServer(async(req,res)=>{
  for(const {key,value} of config.headers[0].headers) res.setHeader(key,value);
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/content') return handler(req,res);
  try {
    if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405).end();return;}
    const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
    if(pathname.split('/').some(part=>part.startsWith('.')) || !/^\/(?:[a-z-]+\.html|(?:assets|js|style|data)\/[^\0]+)$/.test(pathname)) throw Error();
    const path=await realpath(resolve(root,'.'+pathname));
    if(!path.startsWith(root+sep) || !/^\/(?:[a-z-]+\.html|(?:assets|js|style|data)\/[^\0]+)$/.test(path.slice(root.length))) throw Error();
    const data=await readFile(path);
    res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT||8004),'127.0.0.1',()=>console.log(`Portfolio: http://localhost:${process.env.PORT||8004}`));
