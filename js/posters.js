import { transitionView, settleAnimation } from "./motion.js";
import { imageURL, safeURL, imageFallback } from "./catalog.js";

const $ = selector => document.querySelector(selector);
const gridView = $("#poster-grid-view"), collectionsView = $("#poster-collections-view"), detailView = $("#poster-detail-view");
const search = $("#poster-search"), query = $("#poster-query");
let catalog, state, searchState, savedScroll = 0, returnId = "", searchNavigating = false;
const normalize = text => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
function readRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {view: ["collections", "detail"].includes(params.get("view")) ? params.get("view") : "grid", id: params.get("id") || "", q: params.get("q") || "", tags: params.getAll("tag"), collection: params.get("collection") || ""};
}
function navigate(next, replace = false) {
  if (state?.view === "grid") savedScroll = scrollY;
  const route = {...state, ...next};
  if (route.view === "grid" && (next.q !== undefined || next.tags !== undefined || next.collection !== undefined)) savedScroll = 0;
  const params = new URLSearchParams();
  if (route.view !== "grid") params.set("view", route.view);
  if (route.view === "detail") params.set("id", route.id);
  if (route.q) params.set("q", route.q);
  for (const tag of route.tags) params.append("tag", tag);
  if (route.collection) params.set("collection", route.collection);
  history[replace ? "replaceState" : "pushState"]({}, "", `${location.pathname}${location.search}${params.size ? `#${params}` : ""}`);
  transitionView(render);
}
function filtered(route) {
  const words = normalize(route.q).split(/\s+/).filter(Boolean);
  return catalog.items.filter(item => {
    const collection = catalog.collections.find(c => c.id === item.collection);
    const tags = [...item.tags, collection?.title || ""].map(normalize);
    const haystack = normalize([item.title, item.date, collection?.title, ...item.tags, ...item.tools].join(" "));
    return (!route.collection || item.collection === route.collection) && route.tags.every(tag => tags.includes(normalize(tag))) && words.every(word => haystack.includes(word));
  });
}
function makeTile(item, fromSearch = false) {
  const button = element("button", "poster-tile");
  button.dataset.poster = item.id;
  button.setAttribute("aria-label", `View ${item.title}`);
  const frame = element("figure", "asset-frame");
  frame.style.setProperty("--poster-image-scale", item.imageScale);
  const img = new Image();
  img.alt = item.title;
  img.loading = "lazy";
  img.decoding = "async";
  img.src = item.thumbnail || item.src;
  frame.append(img);
  imageFallback(img);
  button.append(frame, element("span", "", item.title));
  button.addEventListener("click", () => {
    if (searchClosing) return;
    returnId = item.id;
    if (fromSearch) {
      searchNavigating = true;
      closeSearch(() => navigate({...searchState, view: "detail", id: item.id}));
    } else navigate({view: "detail", id: item.id});
  });
  return button;
}
function renderGrid() {
  const items = filtered(state);
  $("#poster-grid").replaceChildren(...items.map(item => makeTile(item)));
  $("#poster-empty").hidden = items.length > 0;
  const summary = $(".poster-filter-summary");
  summary.hidden = !state.q && !state.tags.length && !state.collection;
  const collection = catalog.collections.find(c => c.id === state.collection);
  summary.querySelector("span").textContent = [collection?.title, state.q, ...state.tags, `${items.length} posters`].filter(Boolean).join(" · ");
}
function renderCollections() {
  $("#poster-collections").replaceChildren(...catalog.collections.map(collection => {
    const button = element("button", "poster-collection");
    const img = new Image();
    img.alt = "";
    img.loading = "lazy";
    if (collection.cover) img.src = collection.cover;
    else img.style.visibility = "hidden";
    img.onerror = () => { img.style.visibility = "hidden"; };
    const copy = element("div", "collection-copy");
    copy.append(element("h2", "", collection.title), element("span", "collection-caption", "Poster collection"));
    button.append(img, copy, element("time", "", `(${collection.year})`));
    button.addEventListener("click", () => {savedScroll = 0; navigate({view: "grid", collection: collection.id, q: "", tags: []});});
    return button;
  }));
}
function renderDetail() {
  const item = catalog.items.find(item => item.id === state.id);
  if (!item) { navigate({view: "grid", id: ""}, true); return; }
  $("#poster-detail-title").textContent = item.title;
  $("#poster-techniques").textContent = item.tools.join("  |  ");
  const date = $("#poster-date");
  date.textContent = item.dateLabel || item.date || "";
  if (item.date) date.dateTime = item.date; else date.removeAttribute("datetime");
  const frame = $(".poster-main-image");
  frame.classList.remove("missing");
  const img = new Image();
  img.id = "poster-full-image";
  img.alt = item.title;
  img.src = item.src;
  img.decoding = "async";
  frame.replaceChildren(img);
  imageFallback(img);
  const credit = $(".poster-credit");
  credit.hidden = !item.credit;
  if (item.credit) {
    const image = credit.querySelector("img");
    image.hidden = !item.credit.src;
    image.onerror = () => { image.hidden = true; };
    if (item.credit.src) {image.src = item.credit.src; image.alt = item.credit.title;}
    else image.removeAttribute("src");
    credit.querySelector("h2").textContent = `“${item.credit.title}”`;
    credit.querySelector("p").textContent = item.credit.description;
  }
  const download = $("#poster-download");
  if (item.download) {
    download.href = item.download;
    download.removeAttribute("aria-disabled");
    download.title = "Download poster";
    if (new URL(item.download, location.href).origin !== location.origin) {download.target = "_blank"; download.rel = "noopener noreferrer";}
    else {download.removeAttribute("target"); download.removeAttribute("rel");}
  } else {
    download.removeAttribute("href"); download.setAttribute("aria-disabled", "true"); download.title = "Download coming soon";
  }
  const count = detailItems().length;
  $("#poster-prev").disabled = $("#poster-next").disabled = count < 2;
  $("#poster-detail-notice").textContent = `${item.title}, ${detailItems().findIndex(i => i.id === item.id) + 1} of ${count}`;
  document.title = `${item.title} · Posters · Santiago Barbieri`;
}
function detailItems() {
  const items = filtered(state);
  return items.some(item => item.id === state.id) ? items : catalog.items;
}
function move(delta) {
  const items = detailItems();
  if (items.length < 2) return;
  const index = items.findIndex(item => item.id === state.id);
  const item = items[(index + delta + items.length) % items.length];
  returnId = item.id;
  navigate({id: item.id}, true);
}
function render() {
  if (!catalog) return;
  state = readRoute();
  gridView.hidden = state.view !== "grid";
  collectionsView.hidden = state.view !== "collections";
  detailView.hidden = state.view !== "detail";
  document.title = "Posters · Santiago Barbieri";
  if (state.view === "grid") renderGrid();
  else if (state.view === "collections") renderCollections();
  else {renderDetail(); if (readRoute().view !== "detail") return;}
  requestAnimationFrame(() => {
    scrollTo({top: state.view === "grid" ? savedScroll : 0, behavior: "instant"});
    if (state.view === "detail") $("#poster-detail-title").focus({preventScroll: true});
    else if (state.view === "collections") $("#collections-title").focus({preventScroll: true});
    else if (returnId) [...document.querySelectorAll("#poster-grid .poster-tile")].find(e => e.dataset.poster === returnId)?.focus({preventScroll: true});
  });
}
function renderSearch() {
  searchState.q = query.value;
  const items = filtered(searchState);
  search.classList.toggle("has-query", !!searchState.q || searchState.tags.length > 0 || !!searchState.collection);
  $("#poster-search-results").replaceChildren(...items.map(item => makeTile(item, true)));
  $("#poster-search-empty").hidden = items.length > 0;
  $("#poster-search-count").textContent = `${items.length} posters found`;
  for (const button of $("#poster-search-tags").querySelectorAll("button")) button.setAttribute("aria-pressed", String(searchState.tags.includes(button.textContent)));
}
function syncLock() { document.body.classList.toggle("modal-open", !!document.querySelector("dialog[open]")); }
let searchClosing = false;
async function closeSearch(afterClose) {
  if (!search.open || searchClosing) return;
  searchClosing = true;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const animation = search.animate([
      {backgroundColor: "#232323", color: "#f1f0e5", opacity: 1},
      {backgroundColor: "#f1f0e5", color: "#232323", opacity: 1, offset: .7},
      {backgroundColor: "#f1f0e5", color: "#232323", opacity: 0}
    ], {duration: 320, easing: "ease-in-out", fill: "forwards"});
    await settleAnimation(animation);
    search.close();
    animation.cancel();
  } else search.close();
  searchClosing = false;
  if (afterClose) afterClose();
}
search.addEventListener("cancel", event => {
  event.preventDefault();
  closeSearch();
});
$(".poster-search-trigger").addEventListener("click", () => {
  if (!catalog) return;
  const origin = $(".poster-search-trigger").getBoundingClientRect();
  searchState = {...state, tags: [...state.tags]};
  searchNavigating = false;
  query.value = state.q;
  const collections = catalog.collections.map(c => c.title);
  const topics = [...new Set([...catalog.tags, ...catalog.items.flatMap(item => item.tags)])].filter(tag => !collections.includes(tag));
  const groups = [["Collections", collections], ["Suggested topics", topics]].map(([title, tags]) => {
    const group = element("section", "search-suggestions-group");
    group.append(element("h2", "", title));
    const list = element("div", "search-suggestions-list");
    for (const tag of tags) {
      const button = element("button", "", tag);
      button.addEventListener("click", () => {
        searchState.tags = searchState.tags.includes(tag) ? searchState.tags.filter(t => t !== tag) : [...searchState.tags, tag];
        renderSearch();
      });
      list.append(button);
    }
    group.append(list);
    return group;
  });
  $("#poster-search-tags").replaceChildren(...groups);
  renderSearch(); search.showModal(); syncLock(); query.focus({preventScroll: true});
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const field = $(".poster-search-field");
    const target = field.getBoundingClientRect();
    field.animate([
      {transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})`, borderRadius: "999px", backgroundColor: "#f1f0e5", color: "#232323", borderColor: "#232323", borderWidth: "1px"},
      {transform: "none", borderRadius: "0", backgroundColor: "#232323", color: "#f1f0e5", borderColor: "transparent transparent #f1f0e5 transparent", borderWidth: "1px"}
    ], {duration: 440, easing: "cubic-bezier(.22,1,.36,1)"});
  }
});
query.addEventListener("input", renderSearch);
search.querySelector("form").addEventListener("submit", event => {event.preventDefault(); closeSearch();});
$(".poster-search-close").addEventListener("click", () => closeSearch());
search.addEventListener("close", () => {
  syncLock();
  if (!searchNavigating) {savedScroll = 0; navigate({...searchState, view: "grid"}); $(".poster-search-trigger").focus({preventScroll: true});}
});
$(".collections-trigger").addEventListener("click", () => {if(catalog) navigate({view: "collections"});});
for (const button of document.querySelectorAll(".poster-back")) button.addEventListener("click", () => navigate({view: "grid", id: ""}));
$(".clear-poster-filters").addEventListener("click", () => {savedScroll = 0; navigate({q: "", tags: [], collection: ""});});
$("#poster-prev").addEventListener("click", () => move(-1));
$("#poster-next").addEventListener("click", () => move(1));
document.addEventListener("keydown", event => {
  if (!catalog || state.view !== "detail" || document.querySelector("dialog[open]")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);}
  if (event.key === "Escape") navigate({view: "grid", id: ""});
});
addEventListener("popstate", () => transitionView(render));
addEventListener("hashchange", () => transitionView(render));
async function load() {
  $("#posters-retry").hidden = true;
  $("#posters-status").textContent = "Loading posters…";
  try {
    const response = await fetch("data/posters.json", {cache: "no-cache"});
    if (!response.ok) throw Error();
    const data = await response.json();
    if (!Array.isArray(data.items) || !Array.isArray(data.collections)) throw Error();
    const ids = new Set();
    data.items = data.items.map(item => {
      if (!item.id || ids.has(item.id) || !item.title || !imageURL(item.src)) throw Error();
      ids.add(item.id);
      return {...item, imageScale: Math.min(2, Math.max(1, Number(item.imageScale) || 1)), src: imageURL(item.src), thumbnail: imageURL(item.thumbnail), download: safeURL(item.download), tags: Array.isArray(item.tags) ? item.tags.map(String) : [], tools: Array.isArray(item.tools) ? item.tools.map(String) : [], credit: item.credit ? {...item.credit, src: imageURL(item.credit.src)} : null};
    });
    data.collections = data.collections.map(collection => ({...collection, cover: imageURL(collection.cover)}));
    data.tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    catalog = data;
    $("#posters-status").textContent = "";
    render();
  } catch {
    $("#posters-status").textContent = "Posters could not be loaded. Please try again.";
    $("#posters-retry").hidden = false;
  }
}
$("#posters-retry").addEventListener("click", load);
load();
