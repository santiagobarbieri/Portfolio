(() => {
  'use strict';
  const dialog = document.getElementById('item-dialog');
  const image = dialog.querySelector('.item-image');
  const imageWrap = dialog.querySelector('.item-image-wrap');
  const details = dialog.querySelector('.item-details');
  const shop = dialog.querySelector('.item-shop');
  const download = dialog.querySelector('.item-download');
  const date = dialog.querySelector('.item-date');
  const labels = { posters:'Posters', fonts:'Fonts', logos:'Logos', prints:'Prints', mockups:'Mockups', tee:'Tee' };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opener;
  let animation;
  let currentIndex = -1;
  const previous = dialog.querySelector('.item-previous');
  const next = dialog.querySelector('.item-next');

  function openItem(item, button) {
    const opening = !dialog.open;
    if (opening) opener = button;
    const origin = opening ? button.getBoundingClientRect() : null;
    animation?.cancel();
    currentIndex = window.portfolioItems.findIndex(candidate => candidate.id === item.id);
    previous.disabled = currentIndex <= 0;
    next.disabled = currentIndex >= window.portfolioItems.length - 1;
    dialog.querySelector('.item-position').textContent = `${item.title}, ${currentIndex + 1} de ${window.portfolioItems.length}`;
    const isShop = item.kind === 'product' || item.type === 'tee';
    image.src = item.src;
    image.alt = item.alt || item.title;
    imageWrap.style.background = 'transparent';
    dialog.setAttribute('aria-label', item.title);
    details.hidden = isShop;
    shop.hidden = !isShop;
    dialog.querySelector('.item-title').textContent = item.title;
    dialog.querySelector('.item-category').textContent = labels[item.type];
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(item.createdAt || '') ? new Date(`${item.createdAt}T12:00:00`) : null;
    const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.getFullYear() === Number(item.createdAt.slice(0,4)) && parsedDate.getMonth() + 1 === Number(item.createdAt.slice(5,7)) && parsedDate.getDate() === Number(item.createdAt.slice(8,10));
    date.textContent = validDate ? new Intl.DateTimeFormat('es-AR', { day:'numeric', month:'long', year:'numeric' }).format(parsedDate) : 'Sin informar';
    date.removeAttribute('datetime');
    if (validDate) date.setAttribute('datetime', item.createdAt);
    download.hidden = isShop || !item.download;
    download.removeAttribute('href');
    download.removeAttribute('download');
    if (!download.hidden) {
      download.href = item.download;
      download.setAttribute('download', item.download.split('/').pop());
    }
    if (opening) dialog.showModal();
    document.documentElement.classList.add('item-open');
    dialog.scrollTop = 0;
    if (opening && !reducedMotion.matches) {
      const destination = imageWrap.getBoundingClientRect();
      animation = imageWrap.animate([
        { transform:`translate(${origin.left + origin.width / 2 - destination.left - destination.width / 2}px, ${origin.top + origin.height / 2 - destination.top - destination.height / 2}px) scale(${Math.min(origin.width / destination.width, origin.height / destination.height)})`, opacity:.65 },
        { transform:'none', opacity:1 }
      ], { duration:280, easing:'cubic-bezier(.2,.7,.2,1)' });
    }
  }

  function move(offset) {
    const item = window.portfolioItems[currentIndex + offset];
    if (dialog.open && item) openItem(item);
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  document.body.addEventListener('click', event => {
    const button = event.target.closest('[data-item-id]');
    if (!button) return;
    const item = window.portfolioItems.find(item => item.id === button.dataset.itemId);
    if (item && !dialog.open) openItem(item, button);
  });
  dialog.querySelector('.item-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    animation?.cancel();
    document.documentElement.classList.remove('item-open');
    opener?.focus({ preventScroll:true });
  });
})();
