(async () => {
  'use strict';
  // El header conserva su espacio y las anclas compensan su altura responsive.
  const header = document.querySelector('.hero');
  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  };
  new ResizeObserver(syncHeaderHeight).observe(header);
  syncHeaderHeight();

  const menu = document.getElementById('navigation-dialog');
  const controls = document.querySelector('.header-controls');
  const menuToggle = document.querySelector('.menu-toggle');
  const filterToggle = document.querySelector('.filter-toggle');
  const navigation = menu.querySelector('.navigation');
  const filterPanel = menu.querySelector('.filter-panel');
  let activePanel = null;
  let opener = menuToggle;

  function openPanel(panel) {
    activePanel = panel;
    menu.classList.toggle('is-compact', panel !== 'navigation');
    navigation.hidden = panel !== 'navigation';
    filterPanel.hidden = panel !== 'filters';
    menu.setAttribute('aria-label', panel === 'filters' ? 'Filtrar contenido' : 'Navegación principal');
    if (!menu.open) {
      opener = panel === 'filters' ? filterToggle : menuToggle;
      menu.querySelector('.menu-top').append(controls);
      menu.showModal();
      document.documentElement.classList.add('menu-open');
    }
    menuToggle.setAttribute('aria-expanded', String(panel === 'navigation'));
    menuToggle.setAttribute('aria-label', panel === 'navigation' ? 'Cerrar navegación' : 'Abrir navegación');
    controls.classList.toggle('is-open', panel === 'navigation');
    filterToggle.setAttribute('aria-expanded', String(panel === 'filters'));
    (panel === 'filters' ? filterPanel.querySelector('[aria-pressed="true"]') : menuToggle).focus({ preventScroll:true });
  }
  function closeMenu() {
    controls.classList.remove('is-open');
    menu.close();
  }
  menuToggle.addEventListener('click', () => menu.open && activePanel === 'navigation' ? closeMenu() : openPanel('navigation'));
  filterToggle.addEventListener('click', () => menu.open && activePanel === 'filters' ? closeMenu() : openPanel('filters'));
  menu.addEventListener('close', () => {
    controls.classList.remove('is-open');
    header.append(controls);
    document.documentElement.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir navegación');
    filterToggle.setAttribute('aria-expanded', 'false');
    activePanel = null;
    opener.focus({ preventScroll:true });
  });
  menu.addEventListener('click', event => {
    if (activePanel === 'navigation' || event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  const items = await window.Catalog.loadPortfolio();
  window.portfolioItems = items;
  const labels = { posters:'Posters', fonts:'Fonts', logos:'Logos', prints:'Prints', mockups:'Mockups', tee:'Tee · Shop' };
  const grid = document.querySelector('.grid');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const status = document.getElementById('filter-status');
  const columnButtons = [...document.querySelectorAll('[data-columns]')];
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const card = document.createElement('figure');
    card.className = 'card';
    card.dataset.type = item.type;
    card.setAttribute('aria-label', `${item.title} — ${labels[item.type]}`);
    const box = document.createElement('button');
    box.type = 'button';
    box.dataset.itemId = item.id;
    box.setAttribute('aria-label', `Ver ${item.title}`);
    box.setAttribute('aria-haspopup', 'dialog');
    box.setAttribute('aria-controls', 'item-dialog');
    box.className = 'box';
    const media = document.createElement('div');
    media.className = 'media';
    media.style.setProperty('--placeholder', item.color);
    if (item.src) {
      const asset = document.createElement('img');
      asset.src = item.src;
      asset.alt = item.alt || item.title;
      asset.loading = 'lazy';
      asset.decoding = 'async';
      media.append(asset);
    } else {
      media.setAttribute('role', 'img');
      media.setAttribute('aria-label', `Placeholder: ${labels[item.type]} — ${item.title}`);

    }
    const caption = document.createElement('figcaption');
    caption.className = 'caption';
    const title = document.createElement('span');
    title.textContent = item.title;
    const number = document.createElement('small');
    number.textContent = labels[item.type];
    caption.append(title, number);
    box.append(media);
    card.append(box, caption);
    fragment.append(card);
  });
  grid.append(fragment);

  function setFilter(selected) {
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    [...grid.children].forEach(card => card.classList.toggle('is-muted', selected !== 'all' && card.dataset.type !== selected));
    const matched = items.filter(item => item.type === selected).length;
    status.textContent = selected === 'all' ? `${items.length} elementos · todos` : `${matched} destacados · ${items.length} elementos`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    setFilter(button.dataset.filter);
  }));
  document.querySelectorAll('[data-nav-filter]').forEach(link => link.addEventListener('click', () => setFilter(link.dataset.navFilter)));

  setFilter('all');

  // Máximo de 5 columnas en computadora y 3 en teléfono.
  const viewport = window.matchMedia('(max-width: 600px)');
  const tablet = window.matchMedia('(max-width: 900px)');
  let customView = false;
  let selectedColumns = 5;
  function setColumns(value) {
    const parsed = Number(value);
    const maxColumns = viewport.matches ? 3 : 5;
    const safe = Number.isFinite(parsed) ? Math.max(2, Math.min(maxColumns, Math.round(parsed))) : maxColumns;
    grid.style.setProperty('--columns', safe);
    selectedColumns = safe;
    columnButtons.forEach(button => {
      button.hidden = Number(button.dataset.columns) > maxColumns;
      button.setAttribute('aria-pressed', String(Number(button.dataset.columns) === safe));
    });
  }
  function updateViewport() {
    setColumns(customView ? selectedColumns : viewport.matches ? 2 : tablet.matches ? 4 : 5);
  }
  columnButtons.forEach(button => button.addEventListener('click', () => {
    customView = true;
    setColumns(button.dataset.columns);
  }));
  viewport.addEventListener('change', updateViewport);
  tablet.addEventListener('change', updateViewport);
  updateViewport();
})();
