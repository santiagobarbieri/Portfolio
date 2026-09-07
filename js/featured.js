(() => {
  'use strict';
  function validate(projects) {
    if (!Array.isArray(projects) || projects.length !== 5) throw new Error('Featured debe contener exactamente cinco proyectos.');
    const ids = new Set();
    return projects.map((project, index) => {
      const fail = message => { throw new Error(`Proyecto ${index + 1}: ${message}`); };
      if (!project || typeof project !== 'object') fail('datos inválidos.');
      if (typeof project.id !== 'string' || !project.id.trim() || ids.has(project.id.trim())) fail('ID vacío o repetido.');
      ids.add(project.id.trim());
      if (typeof project.title !== 'string' || !project.title.trim()) fail('falta el título.');
      for (const key of ['backgroundColor','textColor']) {
        if (typeof project[key] !== 'string' || !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(project[key])) fail(`${key} debe ser un color hexadecimal.`);
      }
      if (typeof project.src === 'string') project = { ...project, src:project.src.trim() };
      if (project.src && (typeof project.src !== 'string' || !project.src.trim() || /[\u0000-\u001f\\]/.test(project.src) || project.src.startsWith('//') || (/^[a-z][a-z\d+.-]*:/i.test(project.src) && !/^https?:\/\//i.test(project.src)))) fail('ruta de imagen inválida.');
      return { id:project.id.trim(), title:project.title.trim(), description:typeof project.description === 'string' ? project.description : '', backgroundColor:project.backgroundColor, textColor:project.textColor, src:project.src || null, alt:typeof project.alt === 'string' ? project.alt : project.title };
    });
  }
  function render(projects) {
    const fragment = document.createDocumentFragment();
    projects.forEach((project, index) => {
      const entry = document.createElement('li');
      entry.className = 'featured-step';
      entry.style.zIndex = String(index + 1);
      const article = document.createElement('article');
      article.className = 'featured-project';
      article.style.setProperty('--project-background', project.backgroundColor);
      article.style.setProperty('--project-text', project.textColor);
      const number = document.createElement('span');
      number.className = 'featured-project-number';
      number.textContent = String(index + 1).padStart(2,'0');
      const content = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = project.title;
      const description = document.createElement('p'); description.textContent = project.description;
      content.append(title, description);
      article.append(number);
      if (project.src) {
        const image = document.createElement('img');
        image.src = project.src; image.alt = project.alt; image.loading = 'lazy'; image.decoding = 'async';
        article.append(image);
      }
      article.append(content); entry.append(article); fragment.append(entry);
    });
    document.querySelector('.featured-list').replaceChildren(fragment);
    window.dispatchEvent(new Event('featured-ready'));
  }
  async function load() {
    const panel = document.querySelector('.featured-load');
    try {
      const response = await fetch('data/featured.json');
      if (!response.ok) throw new Error(`No se pudo cargar Featured (${response.status}).`);
      render(validate(await response.json()));
    } catch (error) {
      panel.hidden = false;
      const message = panel.querySelector('.featured-message');
      message.textContent = location.protocol === 'file:' ? 'Seleccioná data/featured.json para cargar los proyectos.' : error.message;
      panel.querySelector('input').addEventListener('change', async event => {
        const file = event.target.files[0];
        if (!file) return;
        try { render(validate(JSON.parse(await file.text()))); panel.hidden = true; }
        catch (error) { message.textContent = error.message; event.target.value = ''; }
      });
    }
  }
  window.Featured = { validate };
  load();
})();
