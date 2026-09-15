import { fetchGallery } from "./catalog.js";

export function initLanding(syncLock) {
  const home = document.querySelector("#home");
  const title = home.querySelector(".landing-title");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = home.querySelector(".landing-work");
  const start = home.querySelector(".landing-start");
  const figure = dialog.querySelector("figure");
  const caption = figure.querySelector("figcaption");
  const status = dialog.querySelector("[role=status]");
  const count = dialog.querySelector("[data-work-count]");
  const pause = dialog.querySelector("[data-work-pause]");
  const previous = dialog.querySelector("[data-work-prev]");
  const next = dialog.querySelector("[data-work-next]");
  let items = [], current = 0, timer, sequence = 0, paused = reduced.matches;

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
    title.querySelectorAll(".landing-line").forEach((line) => {
      const proportion = parseFloat(line.style.getPropertyValue("--line-width")) / 100;
      line.style.setProperty("--line-scale", Math.min(1, title.clientWidth * proportion / line.offsetWidth) || 1);
    });
  }
  new ResizeObserver(fitTitle).observe(title);
  document.fonts.ready.then(fitTitle);
  fitTitle();

  function schedule() {
    clearTimeout(timer);
    pause.textContent = paused ? "play" : "pause";
    pause.setAttribute("aria-label", paused ? "Play selected works" : "Pause selected works");
    if (dialog.open && !paused && !document.hidden && items.length > 1) {
      timer = setTimeout(() => show(current + 1), 4500);
    }
  }
  function controls() {
    previous.disabled = next.disabled = pause.disabled = items.length < 2;
  }
  async function show(index, failures = 0) {
    clearTimeout(timer);
    if (!items.length || !dialog.open) return;
    current = (index + items.length) % items.length;
    const item = items[current];
    const token = ++sequence;
    const img = new Image();
    img.alt = item.alt;
    img.decoding = "async";
    img.draggable = false;
    img.src = item.src;
    try {
      await img.decode();
      if (token !== sequence || !dialog.open) return;
      figure.querySelector("img").replaceWith(img);
      figure.hidden = false;
      caption.textContent = item.title;
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      status.textContent = "";
      if (!reduced.matches) {
        figure.getAnimations().forEach(animation => animation.cancel());
        figure.animate([{opacity: 0, transform: "translateY(20px)"}, {opacity: 1, transform: "none"}], {duration: 350, easing: "ease-out"});
      }
      schedule();
    } catch {
      if (token !== sequence || !dialog.open) return;
      if (failures < items.length - 1) return show(current + 1, failures + 1);
      paused = true;
      status.textContent = "Images could not be loaded. Try another work or close and reopen the carousel.";
      schedule();
    }
  }
  start.hidden = false;
  start.addEventListener("click", async () => {
    if (dialog.open) return;
    paused = reduced.matches;
    items = [];
    figure.hidden = true;
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
    clearTimeout(timer);
    syncLock();
    start.focus({preventScroll: true});
  });
  function move(delta) {
    paused = true;
    show(current + delta);
    schedule();
  }
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  pause.addEventListener("click", () => { paused = !paused; schedule(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  let touch;
  const stage = dialog.querySelector(".landing-work-stage");
  stage.addEventListener("pointerdown", event => { touch = {x: event.clientX, y: event.clientY}; });
  stage.addEventListener("pointercancel", () => { touch = null; });
  stage.addEventListener("pointerup", event => {
    if (!touch) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    touch = null;
  });
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", () => { paused = reduced.matches; schedule(); });
}
