// Run before the first paint; revisiting Home in this tab skips the loader.
(() => {
  const key = "portfolio-loader-seen";
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* Storage restrictions must never prevent the page from opening. */ }
  const root = document.documentElement;
  root.classList.add("is-loading");
  const started = performance.now();
  let finished = false;
  let main;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(failsafe);
    root.classList.remove("is-loading");
    main?.removeAttribute("inert");
    const loader = document.querySelector(".site-loader");
    if (loader) {
      loader.setAttribute("aria-hidden", "true");
      setTimeout(() => loader.remove(), 450);
    }
  }
  // A failed image, font, or module cannot leave visitors behind the overlay.
  const failsafe = setTimeout(finish, 4500);
  document.addEventListener("DOMContentLoaded", async () => {
    if (finished) return;
    main = document.querySelector("main");
    main?.setAttribute("inert", "");
    const loaded = document.readyState === "complete" ? Promise.resolve()
      : new Promise(resolve => addEventListener("load", resolve, {once: true}));
    await Promise.allSettled([loaded, document.fonts.ready]);
    const minimum = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850;
    setTimeout(finish, Math.max(0, minimum - (performance.now() - started)));
  }, {once: true});
})();
