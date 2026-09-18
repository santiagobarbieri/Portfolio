import {HttpError, check} from './validation.js';
export function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new HttpError(503, 'CONTENT_NOT_CONFIGURED');
  check(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url), 'Invalid server configuration.', 503);
  return {url: url.replace(/\/$/,''), key};
}
export async function supabase(path, {token, method='GET', body, headers={}} = {}) {
  const {url,key} = config();
  const response = await fetch(url + path, {
    method, headers: {apikey:key, ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(body != null ? {'Content-Type':'application/json'} : {}), ...headers},
    body: body == null ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(15000), redirect:'error'
  });
  if (!response.ok) {
    // Never return provider response bodies, credentials or SQL details to clients.
    if (response.status===401) throw new HttpError(401,'Session expired or invalid credentials.');
    if (response.status===403) throw new HttpError(403,'Access denied.');
    if (response.status===409) throw new HttpError(409,'This ID already exists.');
    if (response.status===429) throw new HttpError(429,'Too many requests. Try again later.');
    throw new HttpError(502,'The content service could not complete the request.');
  }
  if (response.status===204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
export async function requireAdmin(req) {
  const match = /^Bearer ([A-Za-z0-9._-]{20,8192})$/.exec(req.headers.authorization || '');
  check(match, 'Sign in to continue.', 401);
  const token = match[1];
  // Supabase verifies the token signature and the SQL function checks its user ID.
  const allowed = await supabase('/rest/v1/rpc/is_content_admin', {token,method:'POST',body:{}});
  check(allowed===true, 'This account cannot manage the catalog.', 403);
  return token;
}
export async function rows(token, kind) {
  const result = [];
  for (let offset=0; offset<10000; offset+=500) {
    const page = await supabase(`/rest/v1/content_items?select=kind,id,payload,published,sort_order,updated_at&order=sort_order.asc,id.asc&limit=500&offset=${offset}${kind ? `&kind=eq.${kind}` : ''}`,{token});
    result.push(...page);
    if (page.length<500) return result;
  }
  throw new HttpError(503,'Catalog size requires pagination changes.');
}
