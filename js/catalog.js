(() => {
  'use strict';
  const types = { posters:'Posters', fonts:'Fonts', logos:'Logos', prints:'Prints', mockups:'Mockups', tee:'Tee' };
  function assetPath(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    const path = value.trim();
    return !/[\u0000-\u001f\\]/.test(path) && !path.startsWith('//') && (!/^[a-z][a-z\d+.-]*:/i.test(path) || /^https?:\/\//i.test(path));
  }
  function validate(value) {
    if (!Array.isArray(value)) throw new Error('El JSON debe contener una lista de elementos.');
    const ids = new Set();
    return value.map((item, index) => {
      const fail = message => { throw new Error(`Elemento ${index + 1}: ${message}`); };
      if (!item || typeof item !== 'object' || Array.isArray(item)) fail('datos inválidos.');
      if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id.trim())) fail('el ID debe ser único y no estar vacío.');
      ids.add(item.id.trim());
      if (!Object.hasOwn(types, item.type)) fail('categoría desconocida.');
      if (typeof item.title !== 'string' || !item.title.trim()) fail('falta el título.');
      if (!assetPath(item.src)) fail('la imagen debe ser una ruta local o URL HTTP/HTTPS.');
      if (item.download && !assetPath(item.download)) fail('ruta de descarga inválida.');
      if (item.kind && item.kind !== 'product') fail('tipo de producto inválido.');
      if (item.createdAt) {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(item.createdAt) ? new Date(`${item.createdAt}T12:00:00Z`) : null;
        if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== item.createdAt) fail('fecha inválida; usar YYYY-MM-DD.');
      }
      if (item.color && !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(item.color)) fail('color inválido.');
      const result = { id:item.id.trim(), type:item.type, title:item.title.trim(), src:item.src.trim(), alt:typeof item.alt === 'string' ? item.alt : item.title.trim(), color:item.color || '#ffffff', createdAt:item.createdAt || null };
      if (item.type === 'tee' || item.kind === 'product') result.kind = 'product';
      else if (item.download) result.download = item.download.trim();
      if (item.featured === true) result.featured = true;
      return result;
    });
  }
  async function read(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch { throw new Error('No se pudo leer el JSON. Revisá su formato.'); }
    return validate(data);
  }
  async function fetchDefault() {
    const response = await fetch('data/items.json');
    if (!response.ok) throw new Error(`No se pudo cargar data/items.json (${response.status}).`);
    return validate(await response.json());
  }
  async function loadPortfolio() {
    try { return await fetchDefault(); }
    catch (error) {
      const panel = document.querySelector('.catalog-load');
      const message = panel.querySelector('.catalog-message');
      panel.hidden = false;
      message.textContent = location.protocol === 'file:' ? 'Seleccioná data/items.json para cargar la colección.' : `${error.message} Podés seleccionar un archivo JSON.`;
      return new Promise(resolve => {
        panel.querySelector('input').addEventListener('change', async event => {
          const file = event.target.files[0];
          if (!file) return;
          try { const items = await read(file); panel.hidden = true; resolve(items); }
          catch (error) { message.textContent = error.message; event.target.value = ''; }
        });
      });
    }
  }
  window.Catalog = { types, validate, read, fetchDefault, loadPortfolio };
})();
