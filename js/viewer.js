import { imageFallback, safeURL } from "./catalog.js";
export class Viewer {
  constructor(syncLock) {
    this.syncLock = syncLock;
    this.dialog = document.createElement("dialog");
    this.dialog.className = "detail-dialog";
    this.dialog.setAttribute("aria-label", "Selected item");
    this.dialog.innerHTML =
      '<button class="text-button detail-back"><span aria-hidden="true">←</span> back to grid</button><div class="detail-content"><div class="detail-copy"><h2 class="detail-title"></h2><div class="detail-meta"><div class="detail-row"><span class="detail-type"></span><span class="detail-year"></span></div><p class="detail-description"></p></div><div class="detail-bottom"><span class="detail-price"></span><div class="detail-actions"></div></div></div><figure class="detail-image asset-frame"></figure></div><div class="carousel-controls"><button class="icon-button detail-prev" aria-label="Previous item">←</button><p class="detail-notice" role="status"></p><button class="icon-button detail-next" aria-label="Next item">→</button></div>';
    document.body.append(this.dialog);
    this.dialog
      .querySelector(".detail-back")
      .addEventListener("click", () => this.close());
    this.dialog
      .querySelector(".detail-prev")
      .addEventListener("click", () => this.move(-1));
    this.dialog
      .querySelector(".detail-next")
      .addEventListener("click", () => this.move(1));
    this.dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close();
    });
    this.dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.move(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.move(1);
      }
    });
  }
  open(data, index, trigger) {
    this.data = data;
    this.index = index;
    this.trigger = trigger;
    this.dialog.style.setProperty("--surface", data.backgroundColor);
    this.dialog.style.setProperty("--text", data.textColor);
    this.render();
    this.dialog.showModal();
    this.syncLock();
  }
  close() {
    this.dialog.close();
    this.syncLock();
    this.trigger?.focus({ preventScroll: true });
  }
  move(delta) {
    this.index =
      (this.index + delta + this.data.items.length) % this.data.items.length;
    this.render();
    this.dialog.scrollTop = 0;
  }
  wishlist() {
    try {
      return JSON.parse(
        localStorage.getItem("portfolio-wishlist") || "[]",
      ).filter((x) => typeof x === "string");
    } catch {
      return [];
    }
  }
  render() {
    const item = this.data.items[this.index],
      q = (s) => this.dialog.querySelector(s);
    q(".detail-title").textContent = item.title;
    q(".detail-type").textContent =
      this.data.kind === "shop" ? item.type.toUpperCase() : this.data.title;
    q(".detail-year").textContent =
      item.year || (item.createdAt ? String(item.createdAt).slice(0, 4) : "");
    q(".detail-description").textContent = item.description;
    q(".detail-notice").textContent = "";
    this.dialog.setAttribute("aria-label", item.title);
    const image = q(".detail-image");
    image.replaceChildren();
    image.classList.remove("missing");
    image.classList.toggle("sold-out", item.soldOut);
    const img = document.createElement("img");
    img.alt = item.alt;
    img.src = item.src;
    image.append(img);
    imageFallback(img);
    const price = q(".detail-price");
    price.textContent = "";
    price.style.textDecoration = item.soldOut ? "line-through" : "none";
    if (item.price != null) {
      let formatted;
      try {
        formatted = new Intl.NumberFormat("es-AR", {
          maximumFractionDigits: 0,
        }).format(item.price);
      } catch {
        formatted = String(item.price);
      }
      price.textContent = `${formatted} ${item.currency === "ARS" ? "AR$" : item.currency || "AR$"}`;
    } else if (item.type === "freebies") price.textContent = "Free";
    const actions = q(".detail-actions");
    actions.replaceChildren();
    if (this.data.kind === "shop") {
      if (item.soldOut) {
        const sold = document.createElement("span");
        sold.className = "pill filled";
        sold.textContent = "sold out";
        actions.append(sold);
      } else {
        const wish = document.createElement("button");
        wish.className = "pill";
        const key = `${this.data.id}:${item.id}`;
        const update = () => {
          const saved = this.wishlist().includes(key);
          wish.textContent = saved ? "in wishlist" : "add to wishlist";
          wish.setAttribute("aria-pressed", String(saved));
        };
        update();
        wish.addEventListener("click", () => {
          const list = this.wishlist();
          const next = list.includes(key)
            ? list.filter((id) => id !== key)
            : [...list, key];
          try {
            localStorage.setItem("portfolio-wishlist", JSON.stringify(next));
            update();
          } catch {
            q(".detail-notice").textContent =
              "Browser storage is unavailable. Your wishlist could not be saved.";
          }
        });
        actions.append(wish);
        if (item.type === "freebies") {
          this.downloadButton(actions, item);
        } else {
          const buy = document.createElement("button");
          buy.className = "pill filled";
          buy.textContent = "add to cart";
          buy.setAttribute("aria-describedby", "purchase-note");
          q(".detail-notice").id = "purchase-note";
          buy.addEventListener(
            "click",
            () =>
              (q(".detail-notice").textContent =
                "The shop is coming soon. Checkout is not available yet."),
          );
          actions.append(buy);
        }
      }
    } else if (item.download) this.downloadButton(actions, item);
    q(".detail-prev").disabled = q(".detail-next").disabled =
      this.data.items.length < 2;
  }
  downloadButton(container, item) {
    const download = document.createElement("a");
    download.className = "pill filled";
    download.textContent = "download";
    if (item.download) {
      download.href = safeURL(item.download);
      download.download = "";
    } else {
      download.setAttribute("aria-disabled", "true");
      download.title = "Download file coming soon";
    }
    container.append(download);
  }
}
