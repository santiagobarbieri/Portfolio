import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { galleryPaths, validateGallery, imageURL, safeURL } from "../js/catalog.js";

globalThis.location = new URL("http://localhost:8000/index.html");
const gallery = () => ({
  id: "apolo", title: "Apolo", kind: "project",
  backgroundColor: "#122b79", textColor: "#f1f0e5",
  items: [{id: "one", title: "Image", type: "image", src: "https://i.ibb.co/example/photo.jpg"}],
});

test("accepts direct remote images, local paths and optional thumbnails", () => {
  const input = gallery();
  input.items[0].thumbnail = "https://i.ibb.co/example/small.jpg";
  input.items[0].customField = "preserved";
  const result = validateGallery(input);
  assert.equal(result.items[0].thumbnail, input.items[0].thumbnail);
  assert.equal(result.items[0].customField, "preserved");
  assert.equal(imageURL("assets/a photo.jpg"), "assets/a photo.jpg");
  assert.equal(imageURL("https://example.com/image.webp"), "https://example.com/image.webp");
});
test("rejects image viewer pages and unsafe URL schemes", () => {
  for (const value of ["https://ibb.co/abc", "https://imgbb.com/abc", "javascript:alert(1)", "data:text/html,test", "//example.com/img.jpg", "\\\\example.com\\img.jpg"]) {
    assert.equal(imageURL(value), "", value);
  }
  assert.equal(safeURL("mailto:test@example.com"), "");
  const input = gallery(); input.items[0].thumbnail = "https://ibb.co/abc";
  assert.throws(() => validateGallery(input), /thumbnail/);
});
test("rejects duplicate IDs, missing categories and malformed commerce data", () => {
  let input = gallery(); input.items.push({...input.items[0]});
  assert.throws(() => validateGallery(input), /duplicate/);
  input = gallery(); delete input.items[0].type;
  assert.throws(() => validateGallery(input), /type is required/);
  input = gallery(); input.items[0].soldOut = "false";
  assert.throws(() => validateGallery(input), /soldOut/);
  input = gallery(); input.kind = "shop"; input.items[0].type = "prints"; input.items[0].price = -1;
  assert.throws(() => validateGallery(input), /price/);
});
test("every live catalog still validates without requiring migration", async () => {
  for (const path of Object.values(galleryPaths)) {
    const data = JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
    assert.equal(validateGallery(data).id, data.id);
  }
});

test("late image events are harmless after the viewer removes an image", async () => {
  const { imageFallback } = await import("../js/catalog.js");
  const handlers = {};
  const img = {parentElement: null, complete: false, addEventListener: (event, fn) => {handlers[event] = fn;}};
  imageFallback(img);
  assert.doesNotThrow(() => handlers.error());
  assert.doesNotThrow(() => handlers.load());
});
