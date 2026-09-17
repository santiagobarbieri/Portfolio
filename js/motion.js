const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let viewAnimation;

// Update navigation immediately. Visual effects never gate interaction.
export function transitionView(update) {
  viewAnimation?.cancel();
  update();
  if (reducedMotion.matches) return;
  const view = document.querySelector(".posters-page > section:not([hidden])");
  if (view) viewAnimation = view.animate([{opacity: .45}, {opacity: 1}], {
    duration: 220, easing: "ease-out"
  });
}

// Closing a modal must complete even if its animation is cancelled or paused.
export async function settleAnimation(animation) {
  let timer;
  try {
    await Promise.race([
      animation.finished.catch(() => {}),
      new Promise(resolve => { timer = setTimeout(resolve, 550); })
    ]);
  } finally {
    clearTimeout(timer);
    animation.cancel();
  }
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
