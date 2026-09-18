import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/content.js';
import {validateCatalog} from '../server/jsonbin.js';
const originalFetch=globalThis.fetch;
const saved={...process.env};
afterEach(()=>{
  globalThis.fetch=originalFetch;
  for(const key of ['JSONBIN_ACCESS_KEY','JSONBIN_POSTERS_BIN_ID','JSONBIN_SHOP_BIN_ID']) {
    if(saved[key]===undefined) delete process.env[key];else process.env[key]=saved[key];
  }
});
async function call(url='/api/content?kind=posters',method='GET') {
  const headers={};let value;
  const res={setHeader(k,v){headers[k]=v;},end(v){value=JSON.parse(v);}};
  await handler({url,method},res);
  return {status:res.statusCode,headers,body:value};
}
const setConfig=()=>{
  process.env.JSONBIN_ACCESS_KEY='private-test-key';
  process.env.JSONBIN_POSTERS_BIN_ID='abcdef0123456789abcdef01';
};
const sample=()=>({collections:[{id:'one',title:'One',year:'2026',cover:''}],tags:[],items:[{id:'poster',title:'<script>alert(1)</script>',src:'https://example.com/a.jpg',collection:'one',tags:[],tools:[]}]});
test('existing JSON catalogs survive normalization',async()=>{
  for(const kind of ['posters','shop']) {
    const original=JSON.parse(await readFile(new URL(`../data/${kind}.json`,import.meta.url)));
    const result=validateCatalog(kind,original);
    assert.equal(result.items.length,original.items.length);
    for(let i=0;i<original.items.length;i++) for(const key of ['id','title','src','thumbnail','imageScale']) if(original.items[i][key]!=null) assert.equal(result.items[i][key],original.items[i][key]);
  }
});
test('GET proxy uses fixed JSONBin host, read key, no metadata and caches only success',async()=>{
  setConfig();
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.jsonbin.io/v3/b/abcdef0123456789abcdef01/latest');
    assert.equal(options.headers['X-Access-Key'],'private-test-key');
    assert.equal(options.headers['X-Bin-Meta'],'false');
    assert.equal(options.redirect,'error');
    return Response.json(sample());
  };
  const r=await call();assert.equal(r.status,200);assert.match(r.headers['Cache-Control'],/s-maxage=60/);
  assert(!JSON.stringify(r.body).includes('private-test-key'));assert.equal(r.body.items[0].title,sample().items[0].title);
});
test('no bin retains local fallback; configured failure does not masquerade as unconfigured',async()=>{
  delete process.env.JSONBIN_POSTERS_BIN_ID;
  assert.equal((await call()).body.error,'CONTENT_NOT_CONFIGURED');
  setConfig();globalThis.fetch=async()=>Response.json({message:'private-test-key'},{status:403});
  const r=await call();assert.equal(r.status,502);assert.equal(r.headers['Cache-Control'],'no-store');assert(!JSON.stringify(r.body).includes('private-test-key'));
});
test('rejects writes, admin modes, unknown catalogs and arbitrary URLs without fetching',async()=>{
  globalThis.fetch=()=>{throw Error('must not fetch');};
  assert.equal((await call(undefined,'POST')).status,405);
  for(const url of ['/api/content?kind=other','/api/content?kind=shop&mode=admin','/api/content?kind=shop&url=https://evil.test','/api/content?kind=shop&kind=posters']) assert.equal((await call(url)).status,400);
});
test('rejects malformed upstream data, unsafe URLs, duplicates and unknown collection IDs',async()=>{
  for(const change of [d=>d.items[0].src='javascript:alert(1)',d=>d.items.push(d.items[0]),d=>d.items[0].collection='missing',d=>d.items[0].imageScale=10]) {
    const d=sample();change(d);assert.throws(()=>validateCatalog('posters',d));
  }
  setConfig();globalThis.fetch=async()=>new Response('not json');assert.equal((await call()).status,502);
});
test('limits oversized responses and strips private product fields',async()=>{
  setConfig();globalThis.fetch=async()=>new Response('x'.repeat(1024*1024+1));assert.equal((await call()).status,502);
  const r=validateCatalog('shop',{items:[{id:'one',title:'One',type:'prints',src:'assets/a.jpg',secret:'hidden',download:'https://example.com/paid.zip',checkout_url:'https://example.com/pay'}]});
  assert.equal(r.items[0].secret,undefined);assert.equal(r.items[0].download,undefined);assert.equal(r.items[0].checkout_url,undefined);
});
