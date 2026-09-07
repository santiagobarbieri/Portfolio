(async () => {
  'use strict';
  const viewport = document.querySelector('.infinite-viewport');
  const grid = document.querySelector('.grid');
  const gallery = document.getElementById('gallery');
  const sizes = [...document.querySelectorAll('[data-columns]')];
  const labels = { posters:'Posters', fonts:'Fonts', logos:'Logos', prints:'Prints', mockups:'Mockups', tee:'Tee · Shop' };
  let columns = 4;
  let cell = 1;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let frame = 0, lastTime = 0;
  let pool = [];
  let rows = 0, cols = 0;
  let items = [];
  let drag = null, suppressClick = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mod = (n, size) => ((n % size) + size) % size;

  function paint() {
    if (!items.length) return;
    const firstCol = Math.floor(x / cell) - 2;
    const firstRow = Math.floor(y / cell) - 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const tile = pool[r * cols + c];
      const worldCol = firstCol + c, worldRow = firstRow + r;
      const item = items[mod(worldCol + worldRow * 7, items.length)];
      if (tile.button.dataset.itemId !== item.id) {
        tile.button.dataset.itemId = item.id;
        tile.button.setAttribute('aria-label', `Ver ${item.title}`);
        tile.image.src = item.src;
        tile.image.alt = item.alt || item.title;
        tile.media.style.background = item.color || '#000';
        tile.title.textContent = item.title;
        tile.kind.textContent = labels[item.type];
      }
      const left = worldCol * cell - x, top = worldRow * cell - y;
      tile.card.style.transform = `translate3d(${left}px,${top}px,0)`;
      tile.button.tabIndex = left >= 0 && top >= 0 && left + cell <= viewport.clientWidth && top + cell <= viewport.clientHeight ? 0 : -1;
    }
  }
  function rebuild() {
    if (!gallery.open || !items.length) return;
    const oldCell = cell;
    cell = viewport.clientWidth / columns;
    x = x / oldCell * cell; y = y / oldCell * cell;
    targetX = x; targetY = y;
    cols = columns + 4;
    rows = Math.ceil(viewport.clientHeight / cell) + 4;
    const fragment = document.createDocumentFragment();
    pool = [];
    for (let i = 0; i < rows * cols; i++) {
      const card = document.createElement('figure'); card.className = 'card'; card.style.width = `${cell}px`; card.style.height = `${cell}px`;
      const button = document.createElement('button'); button.className = 'box'; button.type = 'button'; button.setAttribute('aria-haspopup','dialog'); button.setAttribute('aria-controls','item-dialog');
      const media = document.createElement('span'); media.className = 'media';
      const image = document.createElement('img'); image.decoding = 'async'; image.draggable = false;
      const caption = document.createElement('figcaption'); caption.className = 'caption';
      const title = document.createElement('span'), kind = document.createElement('small');
      media.append(image); button.append(media); caption.append(title,kind); card.append(button,caption); fragment.append(card);
      pool.push({card,button,media,image,title,kind});
    }
    grid.replaceChildren(fragment);
    paint();
  }
  function tick(time) {
    frame = 0;
    if (!gallery.open || document.getElementById('item-dialog').open) return;
    const dt = Math.min(32, time - lastTime || 16); lastTime = time;
    const ease = reduced.matches || drag ? 1 : 1 - Math.exp(-dt / 65);
    x += (targetX - x) * ease; y += (targetY - y) * ease;
    // Evita coordenadas enormes conservando exactamente el patrón periódico.
    const period = Math.max(1, items.length) * cell;
    if (Math.abs(x) > period * 4) { const shift = Math.trunc(x / period) * period; x -= shift; targetX -= shift; }
    if (Math.abs(y) > period * 4) { const shift = Math.trunc(y / period) * period; y -= shift; targetY -= shift; }
    paint();
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .1) requestPaint();
  }
  function requestPaint() { if (!frame) frame = requestAnimationFrame(tick); }
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || !items.length) return;
    event.preventDefault();
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    targetX += (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * multiplier;
    targetY += (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * multiplier;
    requestPaint();
  }, { passive:false });
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = {id:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false};
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY) > 6) {
      drag.moved = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging');
    }
    if (drag.moved) { targetX -= event.clientX-drag.lastX; targetY -= event.clientY-drag.lastY; requestPaint(); }
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    drag = null; viewport.classList.remove('is-dragging');
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  viewport.addEventListener('keydown', event => {
    const movement = { ArrowLeft:[-cell,0], ArrowRight:[cell,0], ArrowUp:[0,-cell], ArrowDown:[0,cell] }[event.key];
    if (!movement) return;
    event.preventDefault(); viewport.focus({preventScroll:true}); targetX += movement[0]; targetY += movement[1]; requestPaint();
  });
  sizes.forEach(button => button.addEventListener('click', () => {
    columns = Number(button.dataset.columns);
    sizes.forEach(size => size.setAttribute('aria-pressed', String(size === button)));
    rebuild();
  }));
  window.addEventListener('gallery-open', rebuild);
  window.addEventListener('gallery-close', () => { cancelAnimationFrame(frame); frame=0; targetX=x; targetY=y; drag=null; });
  new ResizeObserver(rebuild).observe(viewport);
  items = await window.Catalog.loadPortfolio();
  window.portfolioItems = items;
  document.getElementById('filter-status').textContent = `${items.length} elementos`;
  if (!items.length) { const message = document.createElement('p'); message.className='empty-grid'; message.textContent='La colección está vacía.'; grid.append(message); }
  rebuild();
})();
