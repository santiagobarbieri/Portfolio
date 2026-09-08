import { imageFallback } from "./catalog.js";
import { Gallery } from "./gallery.js";
const page = document.body.dataset.page;
const index = document.createElement("dialog");
index.className = "index-dialog";
index.setAttribute("aria-label", "Index");
index.innerHTML = `<img class="index-pattern decorative" src="assets/index-pattern.svg" alt=""><header class="site-header"><button class="menu-trigger index-close" aria-label="Close index"><span class="menu-icon is-close" aria-hidden="true"></span><span>Index</span></button></header><div class="index-body"><div class="index-left"><nav class="index-links" aria-label="Main navigation"><a href="index.html" data-page="home">Main Page</a><a href="contact.html" data-page="contact">Contact</a><a href="shop.html" data-page="shop">Shop</a></nav><div class="credits"><p>Designed By Santiago Barbieri<br>Using Figma &amp; VSCode.</p><p>ALL RIGHTS RESERVED.<br>2026_BUENOS AIRES, ARGENTINA</p></div></div><div class="index-right"><div><p>Socials</p><div class="index-links"><a class="social-placeholder" aria-disabled="true" data-social="instagram">Instagram</a><a class="social-placeholder" aria-disabled="true" data-social="linkedin">LinkedIn</a><a class="social-placeholder" aria-disabled="true" data-social="tiktok">TikTok</a></div></div><div><p>Archives</p><div class="index-links"><a class="social-placeholder" aria-disabled="true" data-social="cosmos">Cosmos</a><a class="social-placeholder" aria-disabled="true" data-social="pinterest">Pinterest</a><a class="social-placeholder" aria-disabled="true" data-social="arena">Are.na</a><a class="social-placeholder" aria-disabled="true" data-social="gumroad">Gumroad</a></div></div></div></div>`;
document.body.append(index);
// Fill in profile URLs here; empty entries remain intentional placeholders.
const socialURLs = {
  instagram: "",
  linkedin: "",
  tiktok: "",
  cosmos: "",
  pinterest: "",
  arena: "",
  gumroad: "",
};
for (const [key, url] of Object.entries(socialURLs)) {
  if (!url) continue;
  const link = index.querySelector(`[data-social="${key}"]`);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.removeAttribute("aria-disabled");
  link.classList.remove("social-placeholder");
}
index
  .querySelector(`[data-page="${page}"]`)
  ?.setAttribute("aria-current", "page");
function syncLock() {
  document.body.classList.toggle(
    "modal-open",
    !!document.querySelector("dialog[open]"),
  );
}
function openIndex() {
  index.showModal();
  syncLock();
}
let closingIndex = false;
async function closeIndex() {
  if (closingIndex || !index.open) return;
  closingIndex = true;
  await index.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-18px)" },
    ],
    {
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 1
        : 260,
      easing: "cubic-bezier(.4,0,.2,1)",
    },
  ).finished;
  index.close();
  closingIndex = false;
  syncLock();
}
index.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeIndex();
});
index.querySelector(".index-close").addEventListener("click", closeIndex);
index.addEventListener("close", syncLock);
document.addEventListener("click", (event) => {
  if (event.target.closest(".menu-trigger:not(.index-close)")) openIndex();
});
for (const img of document.querySelectorAll("img[data-placeholder]"))
  imageFallback(img);
for (const img of document.querySelectorAll(".decorative"))
  img.addEventListener("error", () => (img.hidden = true), { once: true });
const gallery = new Gallery(syncLock);
if (page === "home") {
  const panels = [...document.querySelectorAll(".panel")];
  const positionPanels = () =>
    panels.forEach((panel) =>
      panel.style.setProperty(
        "--sticky-top",
        `${Math.min(0, innerHeight - panel.offsetHeight)}px`,
      ),
    );
  new ResizeObserver(positionPanels).observe(document.querySelector("main"));
  addEventListener("resize", positionPanels);
  document.fonts.ready.then(positionPanels);
  positionPanels();
}
document.querySelectorAll("[data-open-gallery]").forEach((button) =>
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await gallery.open(button.dataset.openGallery, { returnFocus: button });
    } catch (error) {
      showStatus(error.message);
    } finally {
      button.disabled = false;
    }
  }),
);
function showStatus(message) {
  let status = document.querySelector(".page-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "page-status";
    status.setAttribute("role", "status");
    document.body.append(status);
  }
  status.textContent = message;
}
if (page === "shop") {
  const diamond = document.querySelector(".portal-diamond"),
    intro = document.querySelector(".shop-journey");
  let busy = false,
    opened = false,
    raf = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function maxScale() {
    return (
      (Math.hypot(innerWidth, innerHeight) * 2) / (innerWidth <= 600 ? 72 : 100)
    );
  }
  function transform(p) {
    const scale = 1 + (maxScale() - 1) * p * p;
    return `translate(-50%,-50%) rotate(${45 + p * 135}deg) scale(${scale})`;
  }
  function progress() {
    return Math.max(
      0,
      Math.min(1, scrollY / Math.max(1, intro.offsetHeight - innerHeight)),
    );
  }
  async function openShop() {
    if (busy || opened) return;
    busy = true;
    try {
      await gallery.open("shop", {
        onClose: reverse,
        returnFocus: document.querySelector(".portal-open"),
      });
      opened = true;
      showStatus("");
    } catch (error) {
      showStatus(error.message);
      window.scrollTo(0, 0);
      diamond.style.transform = transform(0);
    } finally {
      busy = false;
    }
  }
  let displayedProgress = progress();
  let previousFrame = null;
  function update(time = performance.now()) {
    if (typeof time !== "number") time = performance.now();
    raf = 0;
    if (busy || opened) return;
    const p = progress();
    const elapsed = Math.min(
      40,
      previousFrame == null ? 1000 / 60 : time - previousFrame,
    );
    previousFrame = time;
    displayedProgress +=
      (p - displayedProgress) * (reduced ? 1 : 1 - Math.exp(-elapsed / 85));
    if (Math.abs(p - displayedProgress) < 0.0001) displayedProgress = p;
    diamond.style.transform = transform(displayedProgress);
    if (p >= 0.995 && displayedProgress >= 0.995) {
      previousFrame = null;
      openShop();
    } else if (displayedProgress !== p) {
      raf = requestAnimationFrame(update);
    } else previousFrame = null;
  }
  addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true },
  );
  addEventListener("resize", update);
  async function reverse() {
    busy = true;
    opened = false;
    displayedProgress = 0;
    previousFrame = null;
    window.scrollTo({ top: 0, behavior: "instant" });
    diamond.style.transform = transform(0);
    await diamond.animate(
      [{ transform: transform(1) }, { transform: transform(0) }],
      { duration: reduced ? 1 : 850, easing: "cubic-bezier(.22,1,.36,1)" },
    ).finished;
    busy = false;
    update();
  }
  document.querySelector(".portal-open").addEventListener("click", async () => {
    if (busy || opened) return;
    busy = true;
    await diamond.animate(
      [{ transform: transform(progress()) }, { transform: transform(1) }],
      {
        duration: reduced ? 1 : 750,
        easing: "cubic-bezier(.65,0,.35,1)",
        fill: "forwards",
      },
    ).finished;
    window.scrollTo({
      top: intro.offsetHeight - innerHeight,
      behavior: "instant",
    });
    diamond.getAnimations().forEach((a) => a.cancel());
    diamond.style.transform = transform(1);
    displayedProgress = 1;
    previousFrame = null;
    busy = false;
    await openShop();
  });
  update();
}
const form = document.querySelector(".contact-form");
if (form)
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const status = form.querySelector(".form-status"),
      button = form.querySelector("[type=submit]");
    button.disabled = true;
    button.textContent = "sending…";
    status.textContent = "";
    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/santibarbieri01@gmail.com",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        },
      );
      const data = await response.json();
      if (!response.ok || !(data.success === true || data.success === "true"))
        throw Error();
      status.textContent = "Thank you — your message has been submitted.";
      form.reset();
    } catch {
      status.textContent =
        "Your message could not be sent. Please try again or email santibarbieri01@gmail.com.";
    } finally {
      button.disabled = false;
      button.textContent = "send";
    }
  });

// Reveal content without replacing native scrolling or hiding it without JavaScript.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);
document
  .querySelectorAll(
    ".home-content, .project-content, .footer-main, .contact-layout, .shop-welcome",
  )
  .forEach((element) => {
    element.classList.add("reveal-content");
    revealObserver.observe(element);
  });
document.querySelector(".back-to-top")?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
  document.querySelector("#home .menu-trigger")?.focus({ preventScroll: true });
});
