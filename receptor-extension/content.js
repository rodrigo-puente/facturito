// Content script: lee y llena la sección "Receptor" de los formularios DTE
// de factura.gob.sv (Angular reactive forms). Soporta los 4 tipos de DTE con
// un perfil de selectores por formulario.
(() => {
  if (window.__receptorFillerLoaded) return;
  window.__receptorFillerLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- perfiles por tipo de formulario ----------
  // kinds: text | select | cascade (selects dependientes) | ngselect (con búsqueda)
  // Los campos usan el modelo canónico del receptor; cada perfil mapea los que
  // existen en su formulario al formcontrolname real.
  const fcn = (tag, name) => `${tag}[formcontrolname="${name}"]`;

  const PROFILES = {
    ccf: {
      label: 'Crédito Fiscal',
      detect: 'app-facturador-ccf',
      root: 'app-common-receptor',
      fields: {
        nit: { sel: fcn('input', 'nit'), kind: 'text' },
        nombre: { sel: fcn('input', 'nombre'), kind: 'text' },
        nrc: { sel: fcn('input', 'nrc'), kind: 'text' },
        nombreComercial: { sel: fcn('input', 'nombreComercial'), kind: 'text' },
        actividad: { sel: fcn('ng-select', 'actividadEconomica'), kind: 'ngselect' },
        departamento: { sel: fcn('select', 'departamento'), kind: 'cascade' },
        municipio: { sel: fcn('select', 'municipio'), kind: 'cascade' },
        distrito: { sel: fcn('select', 'distrito'), kind: 'cascade' },
        complemento: { sel: fcn('textarea', 'complemento'), kind: 'text' },
        correo: { sel: fcn('input', 'correo'), kind: 'text' },
        telefono: { sel: fcn('input', 'telefono'), kind: 'text' },
      },
    },
    fac: {
      label: 'Factura',
      detect: 'app-facturador-cf',
      root: 'app-facturador-cf tab[heading="Receptor"]',
      // El input del número de documento se renderiza al elegir tipoDocumento.
      docNumberAfterTipo: true,
      fields: {
        tipoDocumento: { sel: fcn('select', 'tipoDocumento'), kind: 'select' },
        nit: { sel: fcn('input', 'nit'), kind: 'docnumber' },
        nombre: { sel: fcn('input', 'nombre'), kind: 'text' },
        nrc: { sel: fcn('input', 'nrc'), kind: 'text' },
        actividad: { sel: fcn('ng-select', 'codActividad'), kind: 'ngselect' },
        departamento: { sel: fcn('select', 'departamento'), kind: 'cascade' },
        municipio: { sel: fcn('select', 'municipio'), kind: 'cascade' },
        distrito: { sel: fcn('select', 'distrito'), kind: 'cascade' },
        complemento: { sel: fcn('textarea', 'complemento'), kind: 'text' },
        correo: { sel: fcn('input', 'correoReceptor'), kind: 'text' },
        telefono: { sel: fcn('input', 'telefonoReceptor'), kind: 'text' },
      },
    },
    exp: {
      label: 'Exportación',
      detect: 'app-facturador-fe',
      root: 'app-facturador-fe tab[heading="Receptor"]',
      fields: {
        tipoDocumento: { sel: fcn('select', 'tipoDocumento'), kind: 'select' },
        nit: { sel: fcn('input', 'nit'), kind: 'text' },
        nombre: { sel: fcn('input', 'nombre'), kind: 'text' },
        tipoPersona: { sel: fcn('select', 'tipoPersona'), kind: 'select' },
        pais: { sel: fcn('ng-select', 'paises'), kind: 'ngselect' },
        descActividad: { sel: fcn('input', 'descActividad'), kind: 'text' },
        complemento: { sel: fcn('textarea', 'complemento'), kind: 'text' },
        correo: { sel: fcn('input', 'correoReceptor'), kind: 'text' },
        telefono: { sel: fcn('input', 'telefonoReceptor'), kind: 'text' },
      },
    },
    fse: {
      label: 'Sujeto Excluido',
      detect: 'app-facturador-fse',
      root: 'app-facturador-fse tab[heading="Receptor"]',
      fields: {
        tipoDocumento: { sel: fcn('select', 'tipoDocumento'), kind: 'select' },
        nit: { sel: fcn('input', 'nit'), kind: 'text' },
        nombre: { sel: fcn('input', 'nombre'), kind: 'text' },
        descActividad: { sel: fcn('input', 'descActividad'), kind: 'text' },
        departamento: { sel: fcn('select', 'departamento'), kind: 'cascade' },
        municipio: { sel: fcn('select', 'municipio'), kind: 'cascade' },
        distrito: { sel: fcn('select', 'distrito'), kind: 'cascade' },
        complemento: { sel: fcn('textarea', 'complemento'), kind: 'text' },
        correo: { sel: fcn('input', 'correoReceptor'), kind: 'text' },
        telefono: { sel: fcn('input', 'telefonoReceptor'), kind: 'text' },
      },
    },
  };

  // Orden de llenado: tipoDocumento antes que el número, ubicación en cascada
  // en orden, el resto da igual.
  const FILL_ORDER = [
    'tipoDocumento', 'nit', 'nombre', 'nrc', 'nombreComercial', 'tipoPersona',
    'pais', 'actividad', 'descActividad',
    'departamento', 'municipio', 'distrito',
    'complemento', 'correo', 'telefono',
  ];

  function detectForm() {
    for (const [key, p] of Object.entries(PROFILES)) {
      if (document.querySelector(p.detect)) return key;
    }
    return null;
  }

  function getRoot(profile) {
    return (
      document.querySelector(profile.root) ||
      // fallback por si <tab> no expone heading como atributo en el DOM real
      document.querySelector(`${profile.detect} tab`)
    );
  }

  // ---------- helpers de escritura ----------
  // Angular escucha 'input' en textos y 'change' en selects; disparamos ambos
  // más blur para que corran los validadores.
  function setText(el, value) {
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Los selects en cascada (departamento → municipio → distrito) cargan sus
  // opciones después del change del padre: esperamos a que aparezca la opción.
  async function setSelect(root, sel, code, { wait = true, timeoutMs = 6000 } = {}) {
    const deadline = Date.now() + (wait ? timeoutMs : 300);
    while (Date.now() < deadline) {
      const el = root.querySelector(sel);
      if (el) {
        const opt = [...el.options].find(
          (o) => o.value === code || o.textContent.trim().startsWith(code)
        );
        if (opt) {
          el.focus();
          el.value = opt.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.blur();
          return true;
        }
      }
      await sleep(150);
    }
    return false;
  }

  // ng-select con búsqueda: escribimos el texto, esperamos el panel de
  // opciones y hacemos click en la mejor coincidencia.
  async function setNgSelect(root, sel, text, timeoutMs = 6000) {
    const ngSelect = root.querySelector(sel);
    const input = ngSelect?.querySelector('input[role="combobox"]');
    if (!input) return false;
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const opts = [
        ...document.querySelectorAll(
          'ng-dropdown-panel .ng-option:not(.ng-option-disabled)'
        ),
      ];
      if (opts.length) {
        const wanted = text.trim().toLowerCase();
        const best =
          opts.find((o) => o.textContent.trim().toLowerCase() === wanted) ||
          opts[0];
        best.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        best.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return true;
      }
      await sleep(150);
    }
    return false;
  }

  // En Factura el input del número de documento aparece tras elegir el tipo;
  // esperamos a que exista. Fallback: el input del form-group cuyo label
  // menciona "Número".
  async function waitDocNumberInput(root, sel, timeoutMs = 6000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const el = root.querySelector(sel);
      if (el) return el;
      for (const label of root.querySelectorAll('label')) {
        if (/n[úu]mero\s+documento/i.test(label.textContent)) {
          const input = label.parentElement?.querySelector('input[type="text"]');
          if (input) return input;
        }
      }
      await sleep(150);
    }
    return null;
  }

  // ---------- llenar ----------
  async function fillReceptor(r) {
    const formKey = detectForm();
    const profile = PROFILES[formKey];
    if (!profile) {
      return { ok: false, error: 'Esta página no es un formulario de DTE conocido.' };
    }
    const root = getRoot(profile);
    if (!root) {
      return { ok: false, error: `No se encontró la sección Receptor (${profile.label}).` };
    }

    // Si el formulario pide tipo de documento y el receptor no lo trae pero
    // sí tiene NIT (p. ej. capturado en Crédito Fiscal), asumimos NIT (36).
    const data = { ...r };
    if (profile.fields.tipoDocumento && !data.tipoDocumento && data.nit) {
      data.tipoDocumento = '36';
    }

    let filled = 0;
    const skipped = [];
    for (const name of FILL_ORDER) {
      const field = profile.fields[name];
      if (!field) continue; // el formulario no tiene este campo
      const value = data[name];
      if (value == null || value === '') {
        skipped.push(name);
        continue;
      }
      let ok = false;
      if (field.kind === 'text') {
        const el = root.querySelector(field.sel);
        if (el) { setText(el, value); ok = true; }
      } else if (field.kind === 'docnumber') {
        const el = await waitDocNumberInput(root, field.sel);
        if (el) { setText(el, value); ok = true; }
      } else if (field.kind === 'select') {
        ok = await setSelect(root, field.sel, value, { wait: false });
      } else if (field.kind === 'cascade') {
        ok = await setSelect(root, field.sel, value);
      } else if (field.kind === 'ngselect') {
        ok = await setNgSelect(root, field.sel, value);
      }
      if (ok) filled += 1;
      else {
        skipped.push(name);
        console.warn(`[Facturito] No se pudo llenar "${name}" en ${profile.label}`);
      }
    }
    return { ok: true, form: profile.label, filled, skipped };
  }

  // ---------- capturar ----------
  function captureReceptor() {
    const formKey = detectForm();
    const profile = PROFILES[formKey];
    if (!profile) {
      return { ok: false, error: 'Esta página no es un formulario de DTE conocido.' };
    }
    const root = getRoot(profile);
    if (!root) {
      return { ok: false, error: `No se encontró la sección Receptor (${profile.label}).` };
    }

    const receptor = { capturedFrom: formKey };
    for (const [name, field] of Object.entries(profile.fields)) {
      if (field.kind === 'ngselect') {
        const ngSelect = root.querySelector(field.sel);
        receptor[name] =
          ngSelect?.querySelector('.ng-value-label')?.textContent.trim() || '';
      } else if (field.kind === 'select' || field.kind === 'cascade') {
        const el = root.querySelector(field.sel);
        const opt = el && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
        receptor[name] = el?.value ?? '';
        if (field.kind === 'cascade') {
          receptor[`${name}Label`] = opt ? opt.textContent.trim() : '';
        }
      } else {
        receptor[name] = root.querySelector(field.sel)?.value?.trim() ?? '';
      }
    }
    // La opción "-- Seleccione --" de Angular tiene value "0: null": no es un código.
    if (receptor.tipoDocumento && !/^\d+$/.test(receptor.tipoDocumento)) {
      receptor.tipoDocumento = '';
    }
    // El CCF usa NIT sin selector de tipo: normalizamos para el modelo común.
    if (!receptor.tipoDocumento && receptor.nit) receptor.tipoDocumento = '36';
    if (receptor.nrc) receptor.nrc = receptor.nrc.replace(/\D/g, '');
    if (receptor.telefono) receptor.telefono = receptor.telefono.replace(/\D/g, '');
    return { ok: true, form: profile.label, receptor };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'FILL_RECEPTOR') {
      fillReceptor(msg.receptor).then(sendResponse);
      return true; // respuesta asíncrona
    }
    if (msg?.type === 'CAPTURE_RECEPTOR') {
      sendResponse(captureReceptor());
    }
    if (msg?.type === 'PING') {
      sendResponse({ ok: true });
    }
  });
})();
