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
  document.body.append(fan);
  // About is the back sheet itself, never a duplicate above the stack.
  tabs[0].hidden = true;
  const about = panels[0];
  home.classList.add("has-panel-fan");
  let frame = 0;
  function update() {
    frame = 0;
    const height = home.offsetHeight;
    const distance = Math.max(1, Math.min(height, innerHeight) * .7);
    const progress = Math.max(0, Math.min(1, scrollY / distance));
    const smooth = value => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * t * (t * (t * 6 - 15) + 10);
    };
    fan.hidden = reduced.matches || progress >= 1;
    if (reduced.matches || progress >= 1) {
      about.style.removeProperty("transform");
      return;
    }
    // The actual back sheet rises while the foreground sheets settle down,
    // preserving their depth order throughout the handoff to native scroll.
    const straighten = smooth(progress / .85);
    const lift = -height * .14 * (1 - straighten);
    about.style.transformOrigin = "50% 0";
    about.style.transform = `translateY(${lift}px) rotate(${angles[0] * (1 - straighten)}deg)`;
    tabs.forEach((tab, index) => {
      if (!index) return;
      const initialTop = height * positions[index] / 100;
      const settle = smooth((progress - index * .025) / (1 - index * .025));
      const top = initialTop + (innerHeight * 1.15 + index * 24 - initialTop) * settle;
      tab.style.setProperty("--tab-top", `${top}px`);
      tab.style.setProperty("--tab-angle", `${angles[index] * (1 - settle)}deg`);
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
