const $ = (sel) => document.querySelector(sel);

const FIELDS = [
  'alias', 'tipoDocumento', 'nit', 'nombre', 'nrc', 'nombreComercial',
  'actividad', 'descActividad', 'tipoPersona', 'pais',
  'departamento', 'departamentoLabel',
  'municipio', 'municipioLabel',
  'distrito', 'distritoLabel',
  'complemento', 'correo', 'telefono',
];

// Solo para mostrar de dónde se capturó cada receptor.
const FORM_NAMES = {
  ccf: 'Crédito Fiscal', fac: 'Factura', exp: 'Exportación', fse: 'Sujeto Excluido',
};

// Nombres legibles para el mensaje de campos omitidos.
const FIELD_NAMES = {
  tipoDocumento: 'tipo de documento', nit: 'documento', nombre: 'nombre',
  nrc: 'NRC', nombreComercial: 'nombre comercial', actividad: 'actividad',
  descActividad: 'actividad (texto)', tipoPersona: 'tipo de persona',
  pais: 'país', departamento: 'departamento', municipio: 'municipio',
  distrito: 'distrito', complemento: 'dirección', correo: 'correo',
  telefono: 'teléfono',
};

let receptores = [];
let editingId = null;
// capturedFrom no es un campo del formulario: lo arrastramos aparte.
let editingCapturedFrom = null;

// ---------- almacenamiento ----------
async function load() {
  const data = await chrome.storage.local.get('receptores');
  receptores = data.receptores || [];
  render();
}

async function save() {
  await chrome.storage.local.set({ receptores });
  render();
}

// ---------- comunicación con la pestaña ----------
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToPage(msg) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('No hay pestaña activa.');
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    // El content script no está (p. ej. la página se abrió antes de instalar
    // la extensión): lo inyectamos y reintentamos.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
      return await chrome.tabs.sendMessage(tab.id, msg);
    } catch {
      throw new Error('Abre el formulario de DTE en factura.gob.sv primero.');
    }
  }
}

// ---------- UI ----------
function showStatus(text, ok = true) {
  const el = $('#status');
  el.textContent = text;
  el.className = `status ${ok ? 'ok' : 'err'}`;
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => el.classList.add('hidden'), 4000);
}

function render() {
  const list = $('#list');
  list.innerHTML = '';
  $('#empty').classList.toggle('hidden', receptores.length > 0);

  for (const r of receptores) {
    const li = document.createElement('li');

    const main = document.createElement('div');
    main.className = 'item-main';
    main.title = 'click para llenar el formulario';

    const alias = document.createElement('div');
    alias.className = 'item-alias';
    alias.textContent = r.alias || r.nombre || '(sin alias)';

    const sub = document.createElement('div');
    sub.className = 'item-sub';
    if (r.nit) {
      const chip = document.createElement('span');
      chip.className = 'mono-chip';
      chip.textContent = `NIT ${r.nit}`;
      sub.appendChild(chip);
    }
    if (r.nombre && r.nombre !== r.alias) {
      sub.appendChild(document.createTextNode(` ${r.nombre}`));
    }
    main.append(alias, sub);

    if (FORM_NAMES[r.capturedFrom]) {
      const origin = document.createElement('div');
      origin.className = 'item-loc';
      origin.textContent = `Capturado en ${FORM_NAMES[r.capturedFrom]}`;
      main.appendChild(origin);
    }
    main.addEventListener('click', () => fill(r));

    const fillHint = document.createElement('span');
    fillHint.className = 'item-fill';
    fillHint.textContent = 'Llenar →';
    fillHint.addEventListener('click', () => fill(r));

    const btnEdit = document.createElement('button');
    btnEdit.className = 'item-btn';
    btnEdit.textContent = '✎';
    btnEdit.title = 'Editar';
    btnEdit.addEventListener('click', () => openEditor(r));

    const btnDel = document.createElement('button');
    btnDel.className = 'item-btn danger';
    btnDel.textContent = '✕';
    btnDel.title = 'Eliminar';
    btnDel.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${r.alias || r.nombre}"?`)) return;
      receptores = receptores.filter((x) => x.id !== r.id);
      await save();
    });

    li.append(main, fillHint, btnEdit, btnDel);
    list.appendChild(li);
  }
}

async function fill(r) {
  try {
    const res = await sendToPage({ type: 'FILL_RECEPTOR', receptor: r });
    if (!res?.ok) {
      return showStatus(res?.error || 'No se pudo llenar el formulario.', false);
    }
    let msg = `${res.form}: ${res.filled} campos llenados.`;
    if (res.skipped?.length) {
      const names = res.skipped.map((f) => FIELD_NAMES[f] || f);
      msg += ` Sin datos para: ${names.join(', ')}.`;
    }
    showStatus(msg);
  } catch (e) {
    showStatus(e.message, false);
  }
}

async function capture() {
  try {
    const res = await sendToPage({ type: 'CAPTURE_RECEPTOR' });
    if (!res?.ok) return showStatus(res?.error || 'No se pudo leer el formulario.', false);
    const r = res.receptor;
    if (!r.nit && !r.nombre) {
      return showStatus('La sección Receptor está vacía; llénala primero.', false);
    }
    openEditor({ ...r, alias: r.nombre || '' });
    showStatus('Datos capturados. Revisa y guarda.');
  } catch (e) {
    showStatus(e.message, false);
  }
}

// ---------- editor ----------
function openEditor(r = null) {
  editingId = r?.id ?? null;
  editingCapturedFrom = r?.capturedFrom ?? null;
  $('#editorEyebrow').textContent = editingId ? 'Editar receptor' : 'Nuevo receptor';
  const form = $('#form');
  form.reset();
  if (r) for (const f of FIELDS) form.elements[f].value = r[f] ?? '';
  document.body.classList.add('editing');
  $('#editor').classList.remove('hidden');
  form.elements.alias.focus();
}

function closeEditor() {
  editingId = null;
  document.body.classList.remove('editing');
  $('#editor').classList.add('hidden');
}

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const r = { id: editingId ?? crypto.randomUUID() };
  if (editingCapturedFrom) r.capturedFrom = editingCapturedFrom;
  for (const f of FIELDS) r[f] = form.elements[f].value.trim();
  const idx = receptores.findIndex((x) => x.id === r.id);
  if (idx >= 0) {
    receptores[idx] = { ...receptores[idx], ...r };
  } else {
    receptores.push(r);
  }
  await save();
  closeEditor();
  showStatus('Receptor guardado.');
});

$('#btnCancel').addEventListener('click', closeEditor);
$('#btnCapture').addEventListener('click', capture);

// ---------- exportar / importar ----------
$('#btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(receptores, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'receptores-dte.json';
  a.click();
  URL.revokeObjectURL(url);
});

$('#btnImport').addEventListener('click', () => $('#fileImport').click());
$('#fileImport').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error();
    for (const r of imported) {
      if (!r.id) r.id = crypto.randomUUID();
      const idx = receptores.findIndex((x) => x.id === r.id);
      if (idx >= 0) receptores[idx] = r;
      else receptores.push(r);
    }
    await save();
    showStatus(`${imported.length} receptor(es) importados.`);
  } catch {
    showStatus('Archivo inválido: debe ser el JSON exportado por esta extensión.', false);
  }
  e.target.value = '';
});

load();
