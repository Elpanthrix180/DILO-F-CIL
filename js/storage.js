/* Dilo Fácil — guardado local, exportación e importación.
   Se usa localStorage: los datos se quedan solo en este navegador. */
window.DF = window.DF || {};

DF.STORAGE_KEY = 'dilofacil.v1';
DF.SCHEMA_VERSION = 1;
DF.MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB

DF.uid = function () {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

DF.defaultSettings = function () {
  return {
    theme: 'light', fontScale: 1, btnSize: 'm', cols: 4, showIcons: true,
    voiceEnabled: true, voiceURI: '', rate: 1
  };
};

DF.createDefaultState = function () {
  var phrases = DF.DEFAULT_PHRASES.map(function (p, i) {
    return { id: 'd' + i, label: p[0], text: p[0], categoryId: p[2], icon: p[1], color: '', speak: true, favorite: false, uses: 0 };
  });
  var quick = DF.DEFAULT_QUICK.map(function (t) {
    var f = phrases.find(function (p) { return p.text === t; });
    return f && f.id;
  }).filter(Boolean);
  return {
    version: DF.SCHEMA_VERSION,
    categories: DF.DEFAULT_CATEGORIES.map(function (c) { return Object.assign({}, c); }),
    phrases: phrases,
    quick: quick,
    saved: [],
    settings: DF.defaultSettings()
  };
};

DF.load = function () {
  try {
    var raw = localStorage.getItem(DF.STORAGE_KEY);
    if (raw) {
      var res = DF.validateState(JSON.parse(raw));
      if (res.ok) return res.state;
    }
  } catch (e) { /* datos dañados o almacenamiento bloqueado: empezamos de cero */ }
  return DF.createDefaultState();
};

DF.save = function (state) {
  try {
    localStorage.setItem(DF.STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
};

DF.clearAll = function () {
  try { localStorage.removeItem(DF.STORAGE_KEY); } catch (e) { /* nada */ }
};

/* ---------- Validación (se usa al cargar y al importar) ---------- */
function str(v, max) {
  if (typeof v !== 'string') return '';
  // Quitamos caracteres de control; el texto nunca se interpreta como HTML ni código.
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}
function safeId(v) {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : null;
}

DF.validateState = function (data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'El archivo no tiene el formato de Dilo Fácil.' };
  if (data.version !== DF.SCHEMA_VERSION) return { ok: false, error: 'La versión del archivo no es compatible.' };
  if (!Array.isArray(data.categories) || !Array.isArray(data.phrases)) return { ok: false, error: 'Faltan las categorías o las frases.' };
  if (data.categories.length > 100 || data.phrases.length > 2000) return { ok: false, error: 'El archivo tiene demasiados elementos.' };

  var cats = [], catIds = {};
  data.categories.forEach(function (c) {
    var id = c && safeId(c.id);
    if (!id || catIds[id]) return;
    var name = str(c.name, 60).trim();
    if (!name) return;
    catIds[id] = true;
    cats.push({ id: id, name: name, icon: str(c.icon, 8) });
  });
  if (!cats.length) return { ok: false, error: 'No hay categorías válidas.' };

  var phrases = [], pIds = {};
  data.phrases.forEach(function (p) {
    var id = p && safeId(p.id);
    if (!id || pIds[id]) return;
    var text = str(p.text, 500).trim();
    if (!text) return;
    pIds[id] = true;
    phrases.push({
      id: id,
      label: str(p.label, 80).trim() || text.slice(0, 80),
      text: text,
      categoryId: catIds[p.categoryId] ? p.categoryId : cats[0].id,
      icon: str(p.icon, 8),
      color: DF.COLORS.indexOf(p.color) >= 0 ? p.color : '',
      speak: p.speak !== false,
      favorite: p.favorite === true,
      uses: Number.isFinite(p.uses) && p.uses >= 0 ? Math.floor(p.uses) : 0
    });
  });

  var quick = (Array.isArray(data.quick) ? data.quick : []).filter(function (id, i, a) {
    return pIds[id] && a.indexOf(id) === i;
  }).slice(0, 12);

  var saved = (Array.isArray(data.saved) ? data.saved : []).slice(0, 200).map(function (m) {
    return { id: safeId(m && m.id) || DF.uid(), text: str(m && m.text, 2000).trim() };
  }).filter(function (m) { return m.text; });

  var d = DF.defaultSettings(), s = data.settings || {};
  var settings = {
    theme: ['light', 'dark', 'calm', 'contrast'].indexOf(s.theme) >= 0 ? s.theme : d.theme,
    fontScale: [0.9, 1, 1.2, 1.45].indexOf(s.fontScale) >= 0 ? s.fontScale : d.fontScale,
    btnSize: ['s', 'm', 'l', 'xl'].indexOf(s.btnSize) >= 0 ? s.btnSize : d.btnSize,
    cols: Number.isInteger(s.cols) && s.cols >= 1 && s.cols <= 6 ? s.cols : d.cols,
    showIcons: typeof s.showIcons === 'boolean' ? s.showIcons : d.showIcons,
    voiceEnabled: typeof s.voiceEnabled === 'boolean' ? s.voiceEnabled : d.voiceEnabled,
    voiceURI: str(s.voiceURI, 300),
    rate: typeof s.rate === 'number' && s.rate >= 0.5 && s.rate <= 1.5 ? s.rate : d.rate
  };

  return { ok: true, state: { version: DF.SCHEMA_VERSION, categories: cats, phrases: phrases, quick: quick, saved: saved, settings: settings } };
};

DF.exportJSON = function (state) {
  return JSON.stringify(Object.assign({ app: 'Dilo Fácil', exportedAt: new Date().toISOString() }, state), null, 2);
};

/* Lee un archivo elegido por la persona y devuelve una promesa con {ok, state|error} */
DF.importFile = function (file) {
  return new Promise(function (resolve) {
    if (!file) return resolve({ ok: false, error: 'No se ha elegido ningún archivo.' });
    if (file.size > DF.MAX_IMPORT_BYTES) return resolve({ ok: false, error: 'El archivo es demasiado grande (máximo 1 MB).' });
    var reader = new FileReader();
    reader.onload = function () {
      try { resolve(DF.validateState(JSON.parse(reader.result))); }
      catch (e) { resolve({ ok: false, error: 'El archivo no es un JSON válido.' }); }
    };
    reader.onerror = function () { resolve({ ok: false, error: 'No se pudo leer el archivo.' }); };
    reader.readAsText(file);
  });
};
