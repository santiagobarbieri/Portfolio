(async () => {
  'use strict';
  const form = document.getElementById('item-form');
  const status = document.getElementById('editor-status');
  const list = document.getElementById('item-list');
  const field = name => form.elements.namedItem(name);
  let items = [];
  let editing = null;
  let formDirty = false;
  let collectionDirty = false;
  const notify = message => { status.textContent = message; };
  const canDiscard = () => !formDirty || window.confirm('Hay cambios sin guardar en el formulario. ¿Descartarlos?');

  function updateProduct() {
    if (field('type').value === 'tee') field('product').checked = true;
    field('product').disabled = field('type').value === 'tee';
    document.getElementById('download-field').hidden = field('product').checked;
  }
  function resetForm() {
    form.reset();
    editing = null;
    let next = 1;
    while (items.some(item => item.id === String(next).padStart(2,'0'))) next++;
    field('id').value = String(next).padStart(2,'0');
    document.getElementById('form-title').textContent = 'Nuevo elemento';
    formDirty = false;
    updateProduct();
    render();
  }
  function edit(id) {
    if (!canDiscard()) return;
    const item = items.find(item => item.id === id);
    editing = id;
    for (const key of ['id','type','title','src','alt','createdAt','download']) field(key).value = item[key] || '';
    field('color').value = item.color.length === 4 ? '#' + [...item.color.slice(1)].map(c=>c+c).join('') : item.color;
    field('product').checked = item.kind === 'product';
    document.getElementById('form-title').textContent = 'Editar elemento';
    formDirty = false;
    updateProduct();
    render();
    field('title').focus();
  }
  function render() {
    list.replaceChildren();
    document.getElementById('item-count').textContent = items.length;
    if (!items.length) { const text = document.createElement('p'); text.textContent = 'Todavía no hay elementos.'; list.append(text); }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.classList.toggle('is-editing', editing === item.id);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'item-edit';
      const title = document.createElement('strong'); title.textContent = item.title;
      const category = document.createElement('small'); category.textContent = `${item.id} · ${window.Catalog.types[item.type]}`;
      button.append(title, category); button.addEventListener('click', () => edit(item.id));
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'item-remove'; remove.textContent = 'Eliminar'; remove.setAttribute('aria-label', `Eliminar ${item.title}`);
      remove.addEventListener('click', () => {
        if (!window.confirm(`¿Eliminar “${item.title}” de esta colección?`)) return;
        items = items.filter(candidate => candidate.id !== item.id);
        collectionDirty = true;
        if (editing === item.id) resetForm(); else render();
        notify('Elemento eliminado. Descargá el JSON para guardar la colección.');
      });
      row.append(button, remove); list.append(row);
    });
  }
  form.addEventListener('input', () => { formDirty = true; });
  field('type').addEventListener('change', updateProduct);
  field('product').addEventListener('change', updateProduct);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form));
    raw.createdAt = raw.createdAt || null;
    if (field('product').checked) { raw.kind = 'product'; delete raw.download; }
    delete raw.product;
    try {
      const candidate = window.Catalog.validate([raw])[0];
      const next = items.slice();
      const index = next.findIndex(item => item.id === editing);
      if (index === -1) next.push(candidate); else next[index] = candidate;
      items = window.Catalog.validate(next);
      collectionDirty = true;
      formDirty = false;
      editing = candidate.id;
      render();
      document.getElementById('form-title').textContent = 'Editar elemento';
      notify('Elemento guardado en la colección. Descargá el JSON para conservarlo.');
    } catch (error) { notify(error.message); }
  });
  for (const id of ['new-item','cancel-edit']) document.getElementById(id).addEventListener('click', () => { if (canDiscard()) resetForm(); });
  document.getElementById('import-json').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = await window.Catalog.read(file);
      if ((collectionDirty || formDirty) && !window.confirm('¿Reemplazar la colección actual con este JSON?')) return;
      items = imported; collectionDirty = false; resetForm();
      notify(`${items.length} elementos importados.`);
    } catch (error) { notify(error.message); }
    finally { event.target.value = ''; }
  });
  document.getElementById('export-json').addEventListener('click', () => {
    if (formDirty) { notify('Guardá el elemento o limpiá el formulario antes de descargar el JSON.'); return; }
    try {
      const json = JSON.stringify(window.Catalog.validate(items), null, 2) + '\n';
      const url = URL.createObjectURL(new Blob([json], { type:'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'items.json'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      collectionDirty = false;
      notify('JSON descargado. Reemplazá data/items.json para actualizar el portfolio.');
    } catch (error) { notify(error.message); }
  });
  window.addEventListener('beforeunload', event => { if (formDirty || collectionDirty) { event.preventDefault(); event.returnValue = ''; } });
  // Los controles se habilitan al terminar la carga inicial para no sobrescribir ediciones.
  const inputs = [...document.querySelectorAll('button,input,select')];
  inputs.forEach(input => { input.disabled = true; });
  try {
    if (location.protocol === 'file:') throw new Error('local');
    items = await window.Catalog.fetchDefault();
    notify(`${items.length} elementos cargados desde data/items.json.`);
  } catch {
    notify('Creá una colección nueva o importá data/items.json para editar la actual.');
  } finally {
    inputs.forEach(input => { input.disabled = false; });
    resetForm();
  }
})();
