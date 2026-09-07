(() => {
  'use strict';
  const portal = document.getElementById('portal');
  const diamond = document.querySelector('.diamond');
  const caption = document.querySelector('.portal-caption');
  const gallery = document.getElementById('gallery');
  const close = gallery.querySelector('.gallery-close');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let ready = false;
  function progress() {
    frame = 0;
    if (gallery.open) return;
    const rect = portal.getBoundingClientRect();
    const distance = Math.max(1, portal.offsetHeight - window.innerHeight);
    const amount = Math.min(1, Math.max(0, -rect.top / distance));
    const scale = 1 + Math.pow(amount, 2.2) * (Math.hypot(window.innerWidth, window.innerHeight) / 56 * 1.5);
    diamond.style.transform = `rotate(${reduced.matches ? 45 : 45 + amount * 225}deg) scale(${scale})`;
    caption.style.opacity = String(1 - Math.min(1, amount * 4));
    if (ready && amount >= .995) openGallery();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(progress); }
  function openGallery() {
    if (gallery.open) return;
    gallery.showModal();
    document.documentElement.classList.add('gallery-open');
    window.dispatchEvent(new Event('gallery-open'));
  }
  document.querySelector('.portal-entry').addEventListener('click', openGallery);
  close.addEventListener('click', () => gallery.close());
  // La X es la salida de la grilla; Escape sigue cerrando el detalle de una pieza.
  gallery.addEventListener('cancel', event => event.preventDefault());
  gallery.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-open');
    const returnTo = window.scrollY + portal.getBoundingClientRect().top - window.innerHeight + 100;
    window.scrollTo({ top:Math.max(0, returnTo), behavior:'instant' });
    document.querySelector('.portal-entry').focus({ preventScroll:true });
    window.dispatchEvent(new Event('gallery-close'));
    schedule();
  });
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule);
  window.addEventListener('featured-ready', () => { ready = true; schedule(); });
  reduced.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(portal);
  schedule();
})();
