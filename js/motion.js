const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let activeTransition;

// Native snapshots preserve layout, focus and history during view changes.
export function transitionView(update) {
  activeTransition?.skipTransition();
  if (reducedMotion.matches || !document.startViewTransition) {
    update();
    return;
  }
  const transition = document.startViewTransition(async () => {
    update();
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
  activeTransition = transition;
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (activeTransition === transition) activeTransition = null;
  }).catch(() => {});
}

export function initImageMotion() {
  const watched = new WeakSet();
  function watch(img) {
    if (watched.has(img) || !img.closest(".asset-frame, .poster-collection, .posters-intro-art, .poster-credit")) return;
    watched.add(img);
    if (img.complete) return;
    img.classList.add("image-loading");
    function settle() {
      img.classList.remove("image-loading");
      img.removeEventListener("load", settle);
      img.removeEventListener("error", settle);
      if (img.isConnected && img.naturalWidth && !reducedMotion.matches) {
        img.animate([{opacity: 0}, {opacity: 1}], {duration: 300, easing: "ease-out"});
      }
    }
    img.addEventListener("load", settle);
    img.addEventListener("error", settle);
  }
  document.querySelectorAll("img").forEach(watch);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches("img")) watch(node);
      node.querySelectorAll("img").forEach(watch);
    }
  }).observe(document.body, {childList: true, subtree: true});
}
