// The preview uses the real panels' colors and labels. Their content stays in
// normal document flow, so native scrolling, anchors and keyboard focus work.
export function initPanelFan() {
  const home = document.querySelector("#home");
  const panels = [...document.querySelectorAll("main > .panel:not(.home)")];
  if (!home || !panels.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fan = document.createElement("div");
  fan.className = "landing-tabs";
  fan.setAttribute("aria-hidden", "true");
  const positions = panels.map((_, index) => 86 + Math.floor(index / 2) * 5 + (index > 1 && index % 2 ? 3 : 0));
  const angles = panels.map((_, index) => index % 2 ? 5 : -5);
  const tabs = panels.map((panel, index) => {
    const tab = document.createElement("div");
    const palette = getComputedStyle(panel);
    tab.className = "landing-tab";
    tab.dataset.panel = panel.id;
    tab.style.setProperty("--surface", palette.getPropertyValue("--surface"));
    tab.style.setProperty("--text", palette.getPropertyValue("--text"));
    const label = document.createElement("div");
    label.className = "landing-tab-label";
    const icon = document.createElement("span");
    icon.className = "menu-icon";
    const text = document.createElement("span");
    text.textContent = panel.querySelector(".menu-trigger > span:last-child")?.textContent || "Let’s work together";
    label.append(icon, text);
    tab.append(label);
    fan.append(tab);
    return tab;
  });
  home.append(fan);
  home.classList.add("has-panel-fan");
  let frame = 0;
  function update() {
    frame = 0;
    const height = home.offsetHeight;
    const distance = Math.max(1, Math.min(height, innerHeight) * .28);
    const progress = Math.max(0, Math.min(1, scrollY / distance));
    fan.hidden = progress >= 1;
    if (fan.hidden) return;
    // Meet About exactly where it enters the viewport, then let the actual
    // panels take over. Scrolling upward reverses the same transition.
    const targetTop = height - scrollY;
    tabs.forEach((tab, index) => {
      const initialTop = height * positions[index] / 100;
      const top = initialTop + (targetTop + index * 24 - initialTop) * progress;
      tab.style.setProperty("--tab-top", `${top}px`);
      tab.style.setProperty("--tab-angle", `${reduced.matches ? 0 : angles[index] * (1 - progress)}deg`);
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  addEventListener("scroll", schedule, {passive: true});
  addEventListener("resize", schedule);
  addEventListener("pageshow", schedule);
  reduced.addEventListener("change", schedule);
  new ResizeObserver(schedule).observe(home);
  document.fonts.ready.then(schedule);
  update();
}
