import { galleryPaths, shopTypes, validateGallery } from "./catalog.js";

const form = document.querySelector("#creator-form");
const status = document.querySelector("#creator-status");
const preview = document.querySelector("#json-preview");
const thumbnails = document.querySelector("#creator-thumbnails");
const defaults = {
  landing: ["Selected works", "#000000", "#f1f0e5"],
  apolo: ["Apolo Studios", "#122b79", "#f1f0e5"],
  ola: ["Organización de Liderazgo y Administraciones", "#80c39c", "#f1f0e5"],
  "are-we-there-yet": ["Are we there yet?", "#0d35be", "#f1f0e5"],
  "casa-brul": ["Casa Brul", "#180405", "#f1f0e5"],
  shop: ["Shop", "#f1f0e5", "#232323"],
};
let dirty = false;
function selectGallery() {
  const id = form.elements.gallery.value;
  const [title, backgroundColor, textColor] = defaults[id];
  for (const [key, value] of Object.entries({title, backgroundColor, textColor})) {
    form.elements[key].value = value;
  }
  form.elements.type.replaceChildren(...(id === "shop" ? shopTypes : ["image", "design", "photography"])
    .map((type) => new Option(type, type)));
  document.querySelector("#creator-destination").textContent = `Destination: ${galleryPaths[id]}`;
}
function createGallery() {
  const values = Object.fromEntries(new FormData(form));
  const lines = values.images.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw Error("Add at least one image URL.");
  const kind = values.gallery === "shop" ? "shop" : "project";
  return validateGallery({
    version: 1,
    id: values.gallery,
    title: values.title,
    kind,
    backgroundColor: values.backgroundColor,
    textColor: values.textColor,
    items: lines.map((line, index) => {
      const fields = line.split("|").map((field) => field.trim());
      if (fields.length > 3) throw Error(`Line ${index + 1}: use URL or Title | URL | Thumbnail URL.`);
      const number = String(index + 1).padStart(2, "0");
      const title = fields.length > 1 ? fields[0] : `${values.title} — ${number}`;
      return {
        id: `${values.gallery}-${number}`,
        title,
        type: values.type,
        src: fields.length > 1 ? fields[1] : fields[0],
        thumbnail: fields[2] || "",
        alt: title,
        description: "",
        year: values.year,
        download: "",
        ...(kind === "shop" ? {price: null, currency: "ARS", soldOut: false} : {}),
      };
    }),
  });
}
function render(gallery) {
  const json = JSON.stringify(gallery, null, 2) + "\n";
  preview.textContent = json;
  thumbnails.replaceChildren();
  for (const item of gallery.items) {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const caption = document.createElement("figcaption");
    img.alt = item.alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.hidden = true;
      caption.textContent = `${item.title} — image unavailable; check the URL.`;
    });
    img.src = item.thumbnail || item.src;
    caption.textContent = item.title;
    figure.append(img, caption);
    thumbnails.append(figure);
  }
  return json;
}
function generate(download = false) {
  if (!form.reportValidity()) return;
  try {
    const gallery = createGallery();
    const json = render(gallery);
    status.textContent = `${gallery.items.length} items generated. Check image previews before publishing.`;
    if (!download) return;
    const url = URL.createObjectURL(new Blob([json], {type: "application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gallery.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false;
    status.textContent = `Downloaded ${gallery.id}.json. Replace ${galleryPaths[gallery.id]} to publish, or import it in the gallery editor to add details.`;
  } catch (error) {
    preview.textContent = "Fix the input to generate a new JSON preview.";
    thumbnails.replaceChildren();
    status.textContent = error.message;
  }
}
form.addEventListener("input", () => {
  dirty = true;
  preview.textContent = "Content changed. Preview again to see the updated JSON.";
  thumbnails.replaceChildren();
  status.textContent = "";
});
form.elements.gallery.addEventListener("change", selectGallery);
form.addEventListener("submit", (event) => {event.preventDefault(); generate();});
document.querySelector("#download-json").addEventListener("click", () => generate(true));
window.addEventListener("beforeunload", (event) => {
  if (dirty) {event.preventDefault(); event.returnValue = "";}
});
selectGallery();
