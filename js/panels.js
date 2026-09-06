(() => {
  'use strict';
  const app = document.getElementById('app');
  const panels = [...document.querySelectorAll('.panel')];
  if (!app || !panels.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function jumpTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-jump]');
    if (!trigger) return;
    event.preventDefault();
    jumpTo(trigger.dataset.jump);
  });

  // Marca qué panel está activo para que el rail (menú/filtro) y las
  // flechas solo aparezcan mientras la Gallery o el Featured están a la vista.
  // Se dispara cuando el panel cruza la línea central del viewport, en vez de
  // depender de qué proporción de su alto total es visible: así funciona
  // igual con la Gallery, que puede ser varias pantallas más alta que 100dvh.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) document.body.dataset.panel = entry.target.id;
    });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
  panels.forEach(panel => observer.observe(panel));
})();
