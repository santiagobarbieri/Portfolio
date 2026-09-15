import {
  fetchGallery,
  validateGallery,
  galleryPaths,
  shopTypes,
  imageURL,
} from "./catalog.js";
const $ = (s) => document.querySelector(s),
  settings = $("#gallery-settings"),
  form = $("#item-form"),
  select = $("#gallery-select"),
  status = $("#editor-status");
let data = null,
  selected = 0,
  mode = "project",
  dirty = false,
  sequence = 0,
  loading = false;
const dirtyDrafts = new Set();
function markDirty() {
  if (data) dirtyDrafts.add(data.id);
  dirty = dirtyDrafts.size > 0;
}
function setLoading(value) {
  loading = value;
  document.querySelectorAll(".editor-workspace input, .editor-workspace select, .editor-workspace textarea, .editor-workspace button, #add-item, #export-json, #import-json, #editor-items button")
    .forEach((element) => { element.disabled = value || !data; });
}
const drafts = new Map();
function message(text) {
  status.textContent = text;
}
function remember() {
  if (data && !loading) {
    capture();
    drafts.set(data.id, structuredClone(data));
  }
}
async function load(id) {
  const token = ++sequence;
  setLoading(true);
  try {
    const next = drafts.has(id)
      ? structuredClone(drafts.get(id))
      : await fetchGallery(id);
    if (token !== sequence) return;
    data = next;
    selected = 0;
    draw();
    message(`Editing ${galleryPaths[id]}.`);
  } catch (error) {
    if (token !== sequence) return;
    data = null;
    form.hidden = true;
    $(".editor-preview").hidden = true;
    $("#editor-items").replaceChildren();
    message(error.message);
  } finally {
    if (token === sequence) setLoading(false);
  }
}
function capture() {
  if (!data) return;
  for (const name of ["title", "backgroundColor", "textColor"])
    data[name] = settings.elements[name].value;
  const item = data.items[selected];
  if (!item) return;
  for (const name of [
    "id",
    "title",
    "type",
    "year",
    "src",
    "thumbnail",
    "alt",
    "description",
    "download",
    "currency",
  ])
    item[name] = form.elements[name].value;
  item.price =
    form.elements.price.value === "" ? null : Number(form.elements.price.value);
  item.soldOut = form.elements.soldOut.checked;
}
function draw() {
  settings.elements.title.value = data.title;
  settings.elements.backgroundColor.value = data.backgroundColor;
  settings.elements.textColor.value = data.textColor;
  drawList();
  drawItem();
  $(".editor-preview").style.background = data.backgroundColor;
  $(".editor-preview").style.color = data.textColor;
}
function drawList() {
  const list = $("#editor-items");
  list.replaceChildren();
  data.items.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "editor-item";
    button.textContent = item.title || "Untitled";
    button.setAttribute("aria-current", String(index === selected));
    button.addEventListener("click", () => {
      capture();
      selected = index;
      drawList();
      drawItem();
    });
    list.append(button);
  });
}
function drawItem() {
  const item = data.items[selected];
  form.hidden = !item;
  $(".editor-preview").hidden = !item;
  if (!item) return;
  const type = form.elements.type;
  type.replaceChildren();
  for (const value of data.kind === "shop"
    ? shopTypes
    : ["image", "design", "photography"]) {
    const option = new Option(value[0].toUpperCase() + value.slice(1), value);
    type.append(option);
  }
  if (![...type.options].some((o) => o.value === item.type))
    type.add(new Option(item.type || "Image", item.type || "image"));
  for (const name of [
    "id",
    "title",
    "type",
    "year",
    "src",
    "thumbnail",
    "alt",
    "description",
    "download",
    "currency",
  ])
    form.elements[name].value = item[name] || "";
  form.elements.price.value = item.price ?? "";
  form.elements.soldOut.checked = !!item.soldOut;
  document
    .querySelectorAll(".shop-field")
    .forEach((field) => (field.hidden = data.kind !== "shop"));
  preview();
}
function preview() {
  const img = $("#item-preview"),
    src = imageURL(form.elements.src.value);
  img.hidden = !src;
  $(".editor-preview figcaption").textContent = src ? "Loading preview…" : "Enter a direct image URL or local path.";
  if (src) {
    img.src = src;
    img.alt = form.elements.alt.value || form.elements.title.value;
  }
  img.onerror = () => {
    img.hidden = true;
    $(".editor-preview figcaption").textContent =
      "Image could not be loaded. Check the direct URL or local file.";
  };
  img.onload = () => {
    $(".editor-preview figcaption").textContent = "Preview";
  };
}
for (const f of [settings, form]) {
  f.addEventListener("submit", (e) => e.preventDefault());
  f.addEventListener("input", () => {
    markDirty();
    capture();
    if (f === settings) {
      $(".editor-preview").style.background = data.backgroundColor;
      $(".editor-preview").style.color = data.textColor;
    }
    if (f === form) {
      drawList();
      preview();
    }
  });
}
select.addEventListener("change", () => {
  remember();
  load(select.value);
});
document.querySelectorAll("[data-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    if (mode === button.dataset.mode) return;
    remember();
    mode = button.dataset.mode;
    document
      .querySelectorAll("[data-mode]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
      );
    $(".gallery-select-label").hidden = mode === "shop";
    $(".editor-mode-note").textContent =
      mode === "shop"
        ? "Shop catalog — local JSON for now. Independent from Featured galleries."
        : "Local JSON files for each project gallery.";
    load(mode === "shop" ? "shop" : select.value);
  }),
);
$("#add-item").addEventListener("click", () => {
  capture();
  data.items.push({
    id: `${data.id}-${Date.now()}`,
    title: "New item",
    type: data.kind === "shop" ? "prints" : "image",
    src: "assets/new-image.jpg",
    alt: "",
    year: "",
    description: "",
    download: "",
    price: null,
    currency: "ARS",
    soldOut: false,
  });
  selected = data.items.length - 1;
  markDirty();
  drawList();
  drawItem();
  form.elements.title.focus();
});
$("#remove-item").addEventListener("click", () => {
  if (!data.items[selected]) return;
  data.items.splice(selected, 1);
  selected = Math.max(0, selected - 1);
  markDirty();
  drawList();
  drawItem();
});
$("#export-json").addEventListener("click", () => {
  try {
    capture();
    const valid = validateGallery(data);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(valid, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirtyDrafts.delete(data.id);
    dirty = dirtyDrafts.size > 0;
    message(
      `Downloaded ${data.id}.json. Replace ${galleryPaths[data.id]} to publish these changes.`,
    );
  } catch (error) {
    message(error.message);
  }
});
$("#import-json").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const importSequence = sequence;
    const incoming = validateGallery(JSON.parse(await file.text()));
    if (importSequence !== sequence || loading || !data)
      throw Error("Gallery changed during import. Please import the file again.");
    if (incoming.kind !== mode)
      throw Error(
        `This is a ${incoming.kind} gallery. Switch editor section before importing.`,
      );
    if (incoming.id !== data.id)
      throw Error(`Select ${incoming.id} before importing its file.`);
    data = incoming;
    selected = 0;
    markDirty();
    draw();
    message("Imported. Download the JSON to keep your changes.");
  } catch (error) {
    message(error.message);
  } finally {
    e.target.value = "";
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
load(select.value);
