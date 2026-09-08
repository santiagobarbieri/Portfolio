import { fetchGallery, imageFallback } from "./catalog.js";
import { Viewer } from "./viewer.js";
const mod = (n, m) => ((n % m) + m) % m;
export class Gallery {
  constructor(syncLock) {
    this.syncLock = syncLock;
    this.states = new Map();
    this.tiles = [];
    this.pointers = new Map();
    this.frame = 0;
    this.serial = 0;
    this.active = false;
    this.filter = "";
    this.dialog = document.createElement("dialog");
    this.dialog.className = "gallery-dialog";
    this.dialog.setAttribute("aria-label", "Gallery");
    this.dialog.innerHTML =
      '<header class="gallery-header"></header><div class="gallery-viewport" aria-label="Infinite gallery. Drag or scroll to move; pinch to zoom."></div><p class="gallery-announcement" role="status"></p>';
    document.body.append(this.dialog);
    this.viewport = this.dialog.querySelector(".gallery-viewport");
    this.header = this.dialog.querySelector("header");
    this.status = this.dialog.querySelector("[role=status]");
    this.viewer = new Viewer(syncLock);
    this.dialog.addEventListener("cancel", (e) => e.preventDefault());
    this.viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) this.zoomBy(Math.exp(-e.deltaY * 0.008));
        else {
          const unit =
            e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.height : 1;
          this.pan(-e.deltaX * unit, -e.deltaY * unit);
          this.schedule();
        }
      },
      { passive: false },
    );
    this.viewport.addEventListener("pointerdown", (e) => this.pointerDown(e));
    this.viewport.addEventListener("pointermove", (e) => this.pointerMove(e));
    for (const name of ["pointerup", "pointercancel"])
      this.viewport.addEventListener(name, (e) => this.pointerUp(e));
    this.viewport.addEventListener("click", (e) => {
      const tile = e.target.closest(".gallery-tile");
      if (!tile || e.detail !== 0) return;
      this.viewer.open(this.data, Number(tile.dataset.index), tile);
    });
    this.viewport.addEventListener(
      "gesturestart",
      (e) => {
        e.preventDefault();
        this.gestureScale = this.target.zoom;
      },
      { passive: false },
    );
    this.viewport.addEventListener(
      "gesturechange",
      (e) => {
        e.preventDefault();
        this.setZoom(this.gestureScale * e.scale);
      },
      { passive: false },
    );
    this.viewport.addEventListener("gestureend", (e) => e.preventDefault(), {
      passive: false,
    });
    this.resizeObserver = new ResizeObserver(() => {
      if (this.active) {
        this.measure();
        this.draw();
      }
    });
    this.resizeObserver.observe(this.viewport);
  }
  async open(id, options = {}) {
    const serial = ++this.serial;
    const data = await fetchGallery(id);
    if (serial !== this.serial) return;
    this.data = data;
    this.options = options;
    this.filter = "";
    this.dialog.dataset.kind = data.kind;
    this.dialog.style.setProperty("--surface", data.backgroundColor);
    this.dialog.style.setProperty("--text", data.textColor);
    this.dialog.setAttribute("aria-label", `${data.title} gallery`);
    this.viewport.replaceChildren();
    this.tiles = [];
    this.header.replaceChildren();
    this.status.textContent = "";
    const heading = document.createElement("div");
    heading.className = "gallery-heading";
    if (data.kind === "shop") {
      const close = document.createElement("button");
      close.className = "text-button gallery-close shop-close";
      close.setAttribute("aria-label", "Close shop gallery");
      close.innerHTML =
        '<span class="close-icon" aria-hidden="true"></span><span>Shop</span>';
      close.addEventListener("click", () => this.close());
      heading.append(close);
      this.header.append(heading);
      const filters = document.createElement("nav");
      filters.className = "filters";
      filters.setAttribute("aria-label", "Product categories");
      for (const type of ["mockups", "fonts", "prints", "freebies"]) {
        const button = document.createElement("button");
        button.textContent = type[0].toUpperCase() + type.slice(1);
        button.dataset.type = type;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          this.filter = this.filter === type ? "" : type;
          filters
            .querySelectorAll("button")
            .forEach((b) =>
              b.setAttribute(
                "aria-pressed",
                String(b.dataset.type === this.filter),
              ),
            );
          this.draw();
        });
        filters.append(button);
      }
      this.header.append(filters);
    } else {
      const back = document.createElement("button");
      back.className = "text-button gallery-close";
      back.innerHTML = '<span aria-hidden="true">←</span> back to general';
      back.addEventListener("click", () => this.close());
      heading.append(back);
      this.header.append(heading);
      const title = document.createElement("p");
      title.className = "gallery-title";
      title.textContent = data.title;
      this.header.append(title);
    }
    this.current = { ...(this.states.get(id) || { x: 0, y: 0, zoom: 1 }) };
    this.target = { ...this.current };
    this.lastFrame = null;
    this.velocity = { x: 0, y: 0 };
    this.pointers.clear();
    this.dialog.showModal();
    this.syncLock();
    this.active = true;
    this.measure();
    this.draw();
    this.header.querySelector("button").focus({ preventScroll: true });
  }
  async close() {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.states.set(this.data.id, { ...this.current });
    await this.dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 1
        : 180,
      easing: "ease-out",
    }).finished;
    this.dialog.close();
    this.syncLock();
    if (this.options.onClose) await this.options.onClose();
    this.options.returnFocus?.focus({ preventScroll: true });
  }
  measure() {
    this.width = this.viewport.clientWidth;
    this.height = this.viewport.clientHeight;
    this.base = Math.max(
      130,
      Math.min(245, this.width / (this.width < 600 ? 2.4 : 5.1)),
    );
  }
  setZoom(zoom) {
    this.target.zoom = Math.max(0.55, Math.min(2.2, zoom));
    this.schedule();
  }
  zoomBy(factor) {
    this.setZoom(this.target.zoom * factor);
  }
  pan(dx, dy) {
    for (const [key, delta] of [
      ["x", dx],
      ["y", dy],
    ]) {
      // A direction change should respond immediately, without old momentum.
      const remaining = this.target[key] - this.current[key];
      if (delta * remaining < 0) this.target[key] = this.current[key];
      this.target[key] += delta;
    }
  }
  schedule() {
    if (!this.active || this.frame) return;
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }
  tick(time) {
    this.frame = 0;
    const elapsed = Math.min(
      40,
      this.lastFrame == null ? 1000 / 60 : time - this.lastFrame,
    );
    this.lastFrame = time;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let unsettled = false;
    for (const key of ["x", "y", "zoom"]) {
      const distance = this.target[key] - this.current[key];
      // Time-based damping keeps the same feel on 60 Hz and 120 Hz displays.
      const response = key === "zoom" ? 110 : this.pointers.size ? 38 : 100;
      const blend = reduced ? 1 : 1 - Math.exp(-elapsed / response);
      if (!reduced && Math.abs(distance) > (key === "zoom" ? 0.0002 : 0.05)) {
        this.current[key] += distance * blend;
        unsettled = true;
      } else this.current[key] = this.target[key];
    }
    this.draw();
    if (unsettled) this.schedule();
    else this.lastFrame = null;
  }
  pointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!this.pointers.size) {
      this.target.x = this.current.x;
      this.target.y = this.current.y;
      this.velocity = { x: 0, y: 0 };
    }
    if (!this.pointers.size) this.wasPinching = false;
    this.lastPointerTime = performance.now();
    this.downTile = e.target.closest(".gallery-tile");
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragged = false;
    this.distanceMoved = 0;
    this.viewport.setPointerCapture(e.pointerId);
    if (this.pointers.size === 2) {
      this.pinchDistance = this.pointerDistance();
      this.pinchZoom = this.target.zoom;
      this.dragged = true;
    }
  }
  pointerDistance() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  pointerMove(e) {
    const previous = this.pointers.get(e.pointerId);
    if (!previous) return;
    const dx = e.clientX - previous.x,
      dy = e.clientY - previous.y;
    const now = performance.now();
    const elapsed = Math.max(8, now - this.lastPointerTime);
    this.velocity.x = this.velocity.x * 0.45 + (dx / elapsed) * 0.55;
    this.velocity.y = this.velocity.y * 0.45 + (dy / elapsed) * 0.55;
    this.lastPointerTime = now;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.distanceMoved += Math.hypot(dx, dy);
    if (this.distanceMoved > 5) this.dragged = true;
    if (this.pointers.size === 2) {
      this.dragged = true;
      this.wasPinching = true;
      this.setZoom(
        (this.pinchZoom * this.pointerDistance()) /
          Math.max(1, this.pinchDistance),
      );
    } else {
      this.pan(dx, dy);
      this.schedule();
    }
  }
  pointerUp(e) {
    const shouldOpen =
      e.type === "pointerup" &&
      !this.dragged &&
      this.pointers.size === 1 &&
      this.downTile;
    if (
      e.type === "pointerup" &&
      this.pointers.size === 1 &&
      this.dragged &&
      !this.wasPinching &&
      performance.now() - this.lastPointerTime < 80 &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // A short release glide for dragging; trackpads already supply inertia.
      this.pan(
        Math.max(-160, Math.min(160, this.velocity.x * 85)),
        Math.max(-160, Math.min(160, this.velocity.y * 85)),
      );
      this.schedule();
    }
    this.pointers.delete(e.pointerId);
    if (this.viewport.hasPointerCapture(e.pointerId))
      this.viewport.releasePointerCapture(e.pointerId);
    if (e.type === "pointercancel") this.dragged = true;
    if (shouldOpen)
      this.viewer.open(
        this.data,
        Number(this.downTile.dataset.index),
        this.downTile,
      );
  }
  makeTile() {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "gallery-tile";
    const img = document.createElement("img");
    img.draggable = false;
    img.decoding = "async";
    const placeholder = document.createElement("span");
    placeholder.className = "placeholder";
    placeholder.hidden = true;
    tile.append(img, placeholder);
    img.addEventListener("error", () => {
      img.hidden = true;
      placeholder.hidden = false;
    });
    this.viewport.append(tile);
    return { tile, img, placeholder, index: -1 };
  }
  draw() {
    if (!this.active || !this.width) return;
    const count = this.data.items.length;
    if (!count) {
      this.status.textContent = "This gallery is waiting for its first items.";
      return;
    }
    const step = this.base * this.current.zoom;
    const cols = Math.ceil(this.width / step) + 5,
      rows = Math.ceil(this.height / step) + 5;
    const needed = cols * rows;
    while (this.tiles.length < needed) this.tiles.push(this.makeTile());
    while (this.tiles.length > needed) {
      this.tiles.pop().tile.remove();
    }
    const startX = Math.floor(-this.current.x / step) - Math.floor(cols / 2),
      startY = Math.floor(-this.current.y / step) - Math.floor(rows / 2);
    let pool = 0;
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const gx = startX + col,
          gy = startY + row,
          index = mod(gx + gy * 7, count);
        const node = this.tiles[pool++],
          item = this.data.items[index];
        if (node.index !== index) {
          node.index = index;
          node.tile.dataset.index = index;
          node.tile.dataset.title = item.title;
          node.tile.setAttribute("aria-label", `Open ${item.title}`);
          node.img.hidden = false;
          node.placeholder.hidden = true;
          node.placeholder.textContent = item.title;
          node.img.alt = item.alt;
          node.img.src = item.src;
        }
        const x = gx * step + this.current.x,
          y = gy * step + this.current.y;
        const radius = Math.hypot(
          x / (this.width * 0.38),
          y / (this.height * 0.4),
        );
        const focus = Math.exp(-radius * radius * 4);
        const scale = 1 + focus * 0.46;
        const size = step * 0.72;
        const displacement = 1 + 0.06 * focus;
        node.tile.style.width = `${size}px`;
        node.tile.style.height = `${size * 0.9}px`;
        node.tile.style.transform = `translate3d(${this.width / 2 + x * displacement - size / 2}px,${this.height / 2 + y * displacement - size * 0.45}px,0) scale(${scale})`;
        node.tile.style.zIndex = String(Math.round(focus * 100));
        node.tile.style.opacity = String(0.3 + 0.7 * focus);
        node.tile.classList.toggle(
          "is-muted",
          !!this.filter && item.type !== this.filter,
        );
        node.tile.tabIndex = radius < 0.8 ? 0 : -1;
      }
  }
}
