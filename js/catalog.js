export const galleryPaths = {
  landing: "data/landing.json",
  apolo: "data/galleries/apolo.json",
  ola: "data/galleries/ola.json",
  "are-we-there-yet": "data/galleries/are-we-there-yet.json",
  "casa-brul": "data/galleries/casa-brul.json",
  shop: "data/shop.json",
};
export const shopTypes = ["mockups", "fonts", "prints", "freebies"];
export function safeURL(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("//") || v.includes("\\")) return "";
  try {
    const u = new URL(v, location.href);
    return ["http:", "https:"].includes(u.protocol) ? v : "";
  } catch {
    return "";
  }
}
// ImgBB's viewer pages are HTML; images must use its direct i.ibb.co URL.
export function imageURL(value) {
  const url = safeURL(value);
  if (!url) return "";
  const host = new URL(url, location.href).hostname.toLowerCase();
  if (host === "ibb.co" || host === "imgbb.com" || host.endsWith(".imgbb.com")) return "";
  return url;
}
export function validateGallery(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error(
      "Expected a gallery object, including colors and an items array.",
    );
  if (!Array.isArray(value.items))
    throw Error("The gallery must contain an items array.");
  if (!["shop", "project"].includes(value.kind))
    throw Error("Gallery kind must be shop or project.");
  for (const field of ["id", "title"])
    if (typeof value[field] !== "string" || !value[field].trim())
      throw Error(`Missing gallery ${field}.`);
  for (const field of ["backgroundColor", "textColor"])
    if (!/^#[\da-f]{6}$/i.test(value[field] || ""))
      throw Error(`${field} must be a six-digit hex color.`);
  const ids = new Set();
  const items = value.items.map((item, index) => {
    const name = `Item ${index + 1}`;
    if (!item || typeof item !== "object") throw Error(`${name} is invalid.`);
    for (const field of ["id", "title", "src"])
      if (typeof item[field] !== "string" || !item[field].trim())
        throw Error(`${name}: ${field} is required.`);
    if (ids.has(item.id)) throw Error(`${name}: duplicate id ${item.id}.`);
    ids.add(item.id);
    if (!imageURL(item.src))
      throw Error(`${name}: use a direct image URL (https://i.ibb.co/…) or a local asset path, not an ImgBB viewer page.`);
    if (item.thumbnail && !imageURL(item.thumbnail))
      throw Error(`${name}: invalid thumbnail URL. Use a direct image link.`);
    if (typeof item.type !== "string" || !item.type.trim())
      throw Error(`${name}: type is required.`);
    if (item.soldOut != null && typeof item.soldOut !== "boolean")
      throw Error(`${name}: soldOut must be true or false.`);
    if (item.download && !safeURL(item.download))
      throw Error(`${name}: invalid download URL.`);
    if (value.kind === "shop" && !shopTypes.includes(item.type))
      throw Error(`${name}: use Mockups, Fonts, Prints or Freebies.`);
    if (item.price != null && (!Number.isFinite(item.price) || item.price < 0))
      throw Error(`${name}: price must be a positive number or null.`);
    if (item.currency && !/^[A-Z]{3}$/.test(item.currency))
      throw Error(`${name}: currency must have three uppercase letters.`);
    return {
      ...item,
      src: imageURL(item.src),
      thumbnail: imageURL(item.thumbnail),
      description: String(item.description || ""),
      year: String(item.year || ""),
      alt: String(item.alt || item.title),
      download: safeURL(item.download),
      soldOut: Boolean(item.soldOut),
    };
  });
  return { ...value, version: 1, items };
}
export async function fetchGallery(id) {
  const path = galleryPaths[id];
  if (!path) throw Error("Unknown gallery.");
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok)
    throw Error("The gallery could not be loaded. Please try again.");
  return validateGallery(await response.json());
}
export function imageFallback(img) {
  const fail = () => {
    const frame = img.parentElement;
    if (!frame) return;
    frame.classList.add("missing");
    frame.dataset.label = img.dataset.placeholder || img.alt || "Image";
    img.hidden = true;
  };
  img.addEventListener("load", () => {
    img.hidden = false;
    img.parentElement?.classList.remove("missing");
  });
  img.addEventListener("error", fail);
  if (img.complete && !img.naturalWidth) fail();
}
