export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function check(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
export function text(value, max = 200, required = false) {
  check(typeof value === 'string' || value == null, 'Expected text.');
  const result = (value || '').trim();
  check(result.length <= max && (!required || result.length > 0), 'Text length is invalid.');
  return result;
}
export function contentURL(value, required = false) {
  const v = text(value, 2048, required);
  if (!v) return '';
  if (/^assets\/[a-zA-Z0-9_./ -]+$/.test(v) && !v.includes('..')) return v;
  let u;
  try {u = new URL(v);} catch {throw new HttpError(400,'Use an HTTPS URL or a local asset path.');}
  check(u.protocol === 'https:' && !u.username && !u.password, 'Only HTTPS URLs are allowed.');
  check(!['ibb.co','imgbb.com'].includes(u.hostname), 'Use a direct image URL, not an image viewer page.');
  return u.href;
}
function list(value) {
  check(value == null || (Array.isArray(value) && value.length <= 40), 'Invalid tag list.');
  return [...new Set((value || []).map(v => text(v, 80, true)))];
}
export function validateRecord(input) {
  check(input && typeof input === 'object' && !Array.isArray(input), 'Invalid record.');
  const {kind} = input;
  check(['collection','poster','product'].includes(kind), 'Invalid content type.');
  const id = text(input.id, 100, true);
  check(/^[a-z0-9][a-z0-9-]*$/.test(id), 'Use lowercase letters, numbers and hyphens for the ID.');
  const data = input.payload;
  check(data && typeof data === 'object' && !Array.isArray(data), 'Invalid content.');
  check(typeof input.published === 'boolean', 'Publication status is required.');
  const sort_order = input.sort_order ?? 0;
  check(Number.isInteger(sort_order) && sort_order >= 0 && sort_order <= 1000000, 'Invalid position.');
  const payload = {id, title: text(data.title, 200, true)};
  if (kind === 'collection') {
    payload.year = text(data.year,4,true);
    check(/^\d{4}$/.test(payload.year), 'Use a four-digit year.');
    payload.cover = contentURL(data.cover);
  } else {
    Object.assign(payload, {src: contentURL(data.src, true), thumbnail: contentURL(data.thumbnail), alt: text(data.alt,300), description: text(data.description,5000)});
    if (kind === 'poster') {
      payload.collection = text(data.collection,100);
      check(!payload.collection || /^[a-z0-9][a-z0-9-]*$/.test(payload.collection), 'Invalid collection ID.');
      payload.tags = list(data.tags); payload.tools = list(data.tools);
      payload.date = text(data.date,10); payload.dateLabel = text(data.dateLabel,80);
      check(!payload.date || /^\d{4}-\d{2}-\d{2}$/.test(payload.date), 'Invalid date.');
      payload.imageScale = data.imageScale ?? 1;
      check(Number.isFinite(payload.imageScale) && payload.imageScale >= 1 && payload.imageScale <= 2, 'Invalid image crop.');
      payload.download = contentURL(data.download);
      if (data.credit) payload.credit = {src: contentURL(data.credit.src), title: text(data.credit.title,200), description: text(data.credit.description,1000)};
    } else {
      check(['mockups','fonts','prints','freebies'].includes(data.type), 'Invalid product category.');
      payload.type = data.type; payload.year = text(data.year,4);
      check(data.price == null || (Number.isFinite(data.price) && data.price >= 0 && data.price <= 100000000), 'Invalid price.');
      payload.price = data.price ?? null; payload.currency = text(data.currency || 'ARS',3);
      check(/^[A-Z]{3}$/.test(payload.currency), 'Invalid currency.');
      check(data.soldOut == null || typeof data.soldOut === 'boolean', 'Invalid availability.');
      payload.soldOut = Boolean(data.soldOut);
      // Catalog-only: payment links and downloadable product files are not accepted.
    }
  }
  return {kind, id, published: input.published, sort_order, payload};
}
export function validateImage(mime, encoded) {
  check(['image/jpeg','image/png','image/webp'].includes(mime), 'Only JPEG, PNG and WebP images are allowed.');
  check(typeof encoded === 'string' && encoded.length <= 2800000 && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded), 'Invalid image.');
  const bytes = Buffer.from(encoded,'base64');
  check(bytes.length > 12 && bytes.length <= 2097152, 'The optimized image must be smaller than 2 MB.');
  const matches = mime === 'image/jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255
    : mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
  check(matches, 'The file does not match its declared image type.');
  return bytes;
}
