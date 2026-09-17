export function initLanding() {
  const home = document.querySelector("#home");
  const title = home.querySelector(".landing-title");
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

}
