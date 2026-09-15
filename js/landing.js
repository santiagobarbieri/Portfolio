import { fetchGallery } from "./catalog.js";

export function initLanding(syncLock) {
  const home = document.querySelector("#home");
  const title = home.querySelector(".landing-title");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = home.querySelector(".landing-work");
  const start = home.querySelector(".landing-start");
  const rail = dialog.querySelector(".landing-work-rail");
  const status = dialog.querySelector("[role=status]");
  const count = dialog.querySelector("[data-work-count]");
  const previous = dialog.querySelector("[data-work-prev]");
  const next = dialog.querySelector("[data-work-next]");
  let items = [], current = 0, sequence = 0;

  // The three base inks stay fixed; their overprints vary on each page load.
  const patterns = [
    "linear-gradient(110deg, transparent 45%, #005ad055 45%, #005ad055 60%, transparent 60%)",
    "repeating-linear-gradient(0deg, transparent 0 3px, #ffffff15 3px 4px)",
    "linear-gradient(135deg, #7b6c2c55, transparent 45%, #9b000055)",
    "repeating-linear-gradient(90deg, transparent 0 16px, #005ad044 16px 20px)",
    "radial-gradient(ellipse at 20% 80%, #ffffff44, transparent 65%)",
    "repeating-linear-gradient(135deg, transparent 0 5px, #ffffff18 5px 6px)",
  ];
  let variation = Math.floor(Math.random() * patterns.length);
  try {
    const last = Number(sessionStorage.getItem("landing-variation"));
    if (variation === last) variation = (variation + 1) % patterns.length;
    sessionStorage.setItem("landing-variation", String(variation));
  } catch { /* The visual still varies when storage is unavailable. */ }
  home.dataset.variation = String(variation);
  ["graphic", "web", "photo"].forEach((role, index) => {
    home.querySelectorAll(`.role-${role}`).forEach((box) => {
      box.style.setProperty("--ink-overlay", patterns[(variation + index * 2) % patterns.length]);
    });
  });
  function fitTitle() {
    title.style.removeProperty("font-size");
    if (innerWidth <= 700) return;
    const lines = [...title.querySelectorAll(".landing-line")];
    const widest = Math.max(...lines.map(line => line.offsetWidth));
    const fontSize = parseFloat(getComputedStyle(title).fontSize);
    const content = home.querySelector(".home-content");
    const availableHeight = innerHeight - home.querySelector(".site-header").offsetHeight - home.querySelector(".hero-footer").offsetHeight - 40;
    const scale = Math.min(1, content.clientWidth > 0 ? title.clientWidth / widest : 1, Math.max(180, availableHeight) / title.offsetHeight);
    title.style.fontSize = `${fontSize * scale}px`;
  }
  new ResizeObserver(fitTitle).observe(home.querySelector(".home-content"));
  addEventListener("resize", fitTitle);
  document.fonts.ready.then(fitTitle);
  fitTitle();

  function controls() {
    previous.disabled = next.disabled = items.length < 2;
  }
  function sizeRail() {
    const img = rail.querySelector("img");
    if (!img?.naturalWidth) return;
    const stage = dialog.querySelector(".landing-work-stage");
    const maxWidth = innerWidth * (innerWidth <= 700 ? .72 : .46);
    const width = Math.min(maxWidth, stage.clientHeight * img.naturalWidth / img.naturalHeight);
    rail.style.setProperty("--active-width", `${width}px`);
  }
  new ResizeObserver(sizeRail).observe(dialog.querySelector(".landing-work-stage"));
  async function show(index, failures = 0) {
    if (!items.length || !dialog.open) return;
    current = (index + items.length) % items.length;
    const token = ++sequence;
    const cards = Array.from({length: Math.min(3, items.length)}, (_, offset) => {
      const item = items[(current + offset) % items.length];
      const card = document.createElement(offset ? "button" : "figure");
      card.className = "landing-work-card";
      const img = new Image();
      img.alt = item.alt;
      img.decoding = "async";
      img.draggable = false;
      img.src = item.src;
      card.append(img);
      if (offset) {
        card.type = "button";
        card.setAttribute("aria-label", `View ${item.title}`);
        card.addEventListener("click", () => show(current + offset));
        img.addEventListener("error", () => { card.hidden = true; });
      }
      return card;
    });
    try {
      await cards[0].querySelector("img").decode();
      if (token !== sequence || !dialog.open) return;
      rail.replaceChildren(...cards);
      sizeRail();
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")} — ${items[current].title}`;
      status.textContent = "";
      if (!reduced.matches) {
        rail.getAnimations().forEach(animation => animation.cancel());
        rail.animate([{opacity: 0, marginLeft: "35px"}, {opacity: 1, marginLeft: "0px"}], {duration: 400, easing: "cubic-bezier(.22,1,.36,1)"});
      }
    } catch {
      if (token !== sequence || !dialog.open) return;
      if (failures < items.length - 1) return show(current + 1, failures + 1);
      status.textContent = "Images could not be loaded. Try another work or close and reopen the carousel.";
    }
  }
  start.hidden = false;
  start.addEventListener("click", async () => {
    if (dialog.open) return;
    items = [];
    rail.replaceChildren();
    count.textContent = "";
    status.textContent = "Loading works…";
    dialog.showModal();
    syncLock();
    const token = ++sequence;
    controls();
    try {
      const data = await fetchGallery("landing");
      if (token !== sequence || !dialog.open) return;
      items = data.items;
      controls();
      if (!items.length) {
        status.textContent = "Selected works are coming soon.";
        return;
      }
      await show(0);
    } catch {
      if (token === sequence && dialog.open) status.textContent = "Works could not be loaded. Close and try again.";
    }
  });
  dialog.querySelector(".landing-work-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    ++sequence;
    syncLock();
    start.focus({preventScroll: true});
  });
  function move(delta) {
    show(current + delta);
  }
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  let touch, swiped = false;
  const stage = dialog.querySelector(".landing-work-stage");
  stage.addEventListener("pointerdown", event => { swiped = false; touch = {x: event.clientX, y: event.clientY}; });
  stage.addEventListener("pointercancel", () => { touch = null; });
  stage.addEventListener("pointerup", event => {
    if (!touch) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      move(dx < 0 ? 1 : -1);
    }
    touch = null;
  });
  stage.addEventListener("click", event => {
    if (!swiped || event.detail === 0) return;
    swiped = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}
