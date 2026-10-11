/* Dilo Fácil — lógica principal de la interfaz.
   Regla de seguridad: el texto del usuario se muestra SIEMPRE con textContent,
   nunca con innerHTML, para que no pueda ejecutarse como código. */
(function () {
  'use strict';
  var DF = window.DF;
  var state = DF.load();
  var current = { view: 'home', categoryId: null, phraseId: null, fields: [] };
  var MAX_QUICK = 12;

  var $ = function (id) { return document.getElementById(id); };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { n.addEventListener(ev, attrs.on[ev]); });
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function persist() {
    if (!DF.save(state)) toast('No se pudo guardar. Puede que el almacenamiento esté lleno o bloqueado.');
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  /* ---------- Confirmación accesible ---------- */
  function confirmBox(message) {
    return new Promise(function (resolve) {
      var d = $('confirm');
      $('confirm-text').textContent = message;
      var done = function (v) {
        $('confirm-yes').onclick = $('confirm-no').onclick = null;
        d.removeEventListener('cancel', onCancel);
        if (d.open) d.close();
        resolve(v);
      };
      var onCancel = function (e) { e.preventDefault(); done(false); };
      d.addEventListener('cancel', onCancel);
      $('confirm-yes').onclick = function () { done(true); };
      $('confirm-no').onclick = function () { done(false); };
      if (typeof d.showModal === 'function') { d.showModal(); $('confirm-no').focus(); }
      else resolve(window.confirm(message));
    });
  }

  /* ---------- Helpers de datos ---------- */
  function phraseById(id) { return state.phrases.find(function (p) { return p.id === id; }); }
  function catById(id) { return state.categories.find(function (c) { return c.id === id; }); }

  // Plantillas: "Necesito [una pausa]" -> campos editables
  function templateParts(text) {
    var parts = [], re = /\[([^\]]*)\]/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push({ t: text.slice(last, m.index) });
      parts.push({ field: true, t: m[1] });
      last = re.lastIndex;
    }
    if (last < text.length) parts.push({ t: text.slice(last) });
    return parts;
  }
  function selectedText() {
    var p = phraseById(current.phraseId);
    if (!p) return '';
    var i = 0;
    return templateParts(p.text).map(function (part) {
      return part.field ? (current.fields[i++] || '') : part.t;
    }).join('').replace(/\s+/g, ' ').trim();
  }

  /* ---------- Aplicar ajustes visuales ---------- */
  function applySettings() {
    var s = state.settings, root = document.documentElement;
    root.setAttribute('data-theme', s.theme);
    root.setAttribute('data-btn', s.btnSize);
    root.setAttribute('data-icons', s.showIcons ? 'on' : 'off');
    root.style.setProperty('--font-scale', s.fontScale);
    root.style.setProperty('--cols', s.cols);
  }

  /* ---------- Botones de frases y categorías ---------- */
  function phraseTile(p) {
    return el('button', {
      type: 'button', class: 'tile' + (p.favorite ? ' fav' : ''), 'data-color': p.color || null,
      'data-id': p.id, 'aria-label': p.label + (p.favorite ? ' (favorita)' : ''),
      on: { click: function () { selectPhrase(p.id); } }
    }, [p.icon ? el('span', { class: 'ico', 'aria-hidden': 'true', text: p.icon }) : null, el('span', { text: p.label })]);
  }
  function fill(container, nodes) {
    container.replaceChildren.apply(container, nodes);
  }

  function renderHome() {
    var favs = state.phrases.filter(function (p) { return p.favorite; });
    fill($('home-favs'), favs.map(phraseTile));
    $('home-favs-wrap').hidden = !favs.length;
    var freq = state.phrases.filter(function (p) { return p.uses > 0; })
      .sort(function (a, b) { return b.uses - a.uses; }).slice(0, 6);
    fill($('home-freq'), freq.map(phraseTile));
    $('home-freq-wrap').hidden = !freq.length;
    fill($('home-cats'), state.categories.map(function (c) {
      return el('button', { type: 'button', class: 'tile', 'data-cat': c.id, on: { click: function () { openCategory(c.id); } } },
        [c.icon ? el('span', { class: 'ico', 'aria-hidden': 'true', text: c.icon }) : null, el('span', { text: c.name })]);
    }));
  }

  function renderCategory() {
    var c = catById(current.categoryId);
    if (!c) return go('home');
    $('h-cat').textContent = c.name;
    var list = state.phrases.filter(function (p) { return p.categoryId === c.id; });
    fill($('cat-phrases'), list.map(phraseTile));
    $('cat-empty').hidden = list.length > 0;
  }

  /* ---------- Frase seleccionada ---------- */
  function selectPhrase(id) {
    var p = phraseById(id);
    if (!p) return;
    current.phraseId = id;
    current.fields = templateParts(p.text).filter(function (x) { return x.field; }).map(function (x) { return x.t; });
    p.uses += 1;
    persist();
    renderSelected();
    $('selected').scrollIntoView({ block: 'nearest' });
    $('selected-text').focus();
  }

  function renderSelected() {
    var p = phraseById(current.phraseId);
    var box = $('selected');
    if (!p) { box.hidden = true; return; }
    box.hidden = false;
    $('selected-text').textContent = selectedText();
    $('selected-text').setAttribute('tabindex', '-1');
    var i = 0;
    var inputs = templateParts(p.text).filter(function (x) { return x.field; }).map(function () {
      var idx = i++;
      var input = el('input', { type: 'text', maxlength: '120', value: current.fields[idx] });
      input.value = current.fields[idx];
      input.addEventListener('input', function () {
        current.fields[idx] = input.value;
        $('selected-text').textContent = selectedText();
      });
      return el('label', {}, [el('span', { text: 'Parte ' + (idx + 1) + ' (puedes cambiarla)' }), input]);
    });
    fill($('selected-fields'), inputs);
    var fav = $('btn-fav');
    fav.setAttribute('aria-pressed', p.favorite ? 'true' : 'false');
    fav.lastChild.textContent = p.favorite ? ' Favorita' : ' Marcar favorita';
    fav.firstChild.textContent = p.favorite ? '★' : '☆';
    var canSpeak = p.speak && state.settings.voiceEnabled && DF.speech.supported;
    $('btn-speak').disabled = !canSpeak;
    var note = $('speech-note');
    if (!DF.speech.supported) { note.hidden = false; note.textContent = 'Este navegador no permite leer en voz alta. Puedes mostrar la pantalla o copiar el texto.'; }
    else if (!state.settings.voiceEnabled) { note.hidden = false; note.textContent = 'La voz está desactivada en Ajustes.'; }
    else if (!p.speak) { note.hidden = false; note.textContent = 'Esta frase está configurada para no leerse en voz alta.'; }
    else note.hidden = true;
  }

  function speakText(text) {
    if (!text) return;
    if (!DF.speech.supported) return toast('La voz no está disponible en este navegador.');
    if (!state.settings.voiceEnabled) return toast('La voz está desactivada en Ajustes.');
    DF.speech.speak(text, { voiceURI: state.settings.voiceURI, rate: state.settings.rate });
  }

  function copyText(text) {
    if (!text) return;
    var fallback = function () {
      var ta = el('textarea', { 'aria-hidden': 'true' });
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? 'Texto copiado.' : 'No se pudo copiar. Selecciona el texto y cópialo a mano.');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Texto copiado.'); }, fallback);
    } else fallback();
  }

  /* ---------- Navegación ---------- */
  var VIEWS = ['home', 'category', 'quick', 'write', 'manage', 'settings', 'install', 'privacy'];
  function go(view) {
    current.view = view;
    VIEWS.forEach(function (v) { $('view-' + v).hidden = v !== view; });
    var navMap = { category: 'home', install: 'settings', privacy: 'settings' };
    document.querySelectorAll('.mainnav button').forEach(function (b) {
      if (b.getAttribute('data-go') === (navMap[view] || view)) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    render();
    var h = document.querySelector('#view-' + view + ' h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }
  function openCategory(id) { current.categoryId = id; go('category'); }

  function render() {
    renderSelected();
    if (current.view === 'home') renderHome();
    if (current.view === 'category') renderCategory();
    if (current.view === 'quick') renderQuick();
    if (current.view === 'write') renderSaved();
    if (current.view === 'manage') renderManage();
    if (current.view === 'settings') renderSettings();
    if (current.view === 'install') renderInstall();
  }

  /* ---------- Modo rápido ---------- */
  function renderQuick() {
    var items = state.quick.map(phraseById).filter(Boolean);
    fill($('quick-grid'), items.map(phraseTile));
    fill($('quick-list'), items.map(function (p, i) {
      return el('li', {}, [
        el('span', { class: 'grow', text: p.label }),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Subir ' + p.label, disabled: i === 0 ? 'disabled' : null, on: { click: function () { move(state.quick, i, -1); persist(); renderQuick(); } } }, [document.createTextNode('↑')]),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Bajar ' + p.label, disabled: i === items.length - 1 ? 'disabled' : null, on: { click: function () { move(state.quick, i, 1); persist(); renderQuick(); } } }, [document.createTextNode('↓')]),
        el('button', { type: 'button', class: 'btn small danger', 'aria-label': 'Quitar ' + p.label + ' del modo rápido', on: { click: function () {
          confirmBox('¿Quitar «' + p.label + '» del modo rápido? La frase no se borra.').then(function (ok) {
            if (!ok) return;
            state.quick = state.quick.filter(function (id) { return id !== p.id; });
            persist(); renderQuick();
          });
        } } }, [document.createTextNode('Quitar')])
      ]);
    }));
    var sel = $('quick-add-select');
    fill(sel, state.phrases.filter(function (p) { return state.quick.indexOf(p.id) < 0; }).map(function (p) {
      return el('option', { value: p.id, text: p.label });
    }));
    $('quick-add').disabled = !sel.options.length || state.quick.length >= MAX_QUICK;
  }

  function move(arr, i, d) {
    var j = i + d;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  /* ---------- Escribir ---------- */
  var writeScale = 1;
  function renderSaved() {
    fill($('saved-list'), state.saved.map(function (m) {
      return el('li', {}, [
        el('span', { class: 'grow', text: m.text }),
        el('button', { type: 'button', class: 'btn small', on: { click: function () { $('free-text').value = m.text; $('free-text').focus(); } } }, [document.createTextNode('Usar')]),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Leer en voz alta', on: { click: function () { speakText(m.text); } } }, [document.createTextNode('🔊')]),
        el('button', { type: 'button', class: 'btn small danger', on: { click: function () {
          confirmBox('¿Eliminar este mensaje guardado?').then(function (ok) {
            if (!ok) return;
            state.saved = state.saved.filter(function (x) { return x.id !== m.id; });
            persist(); renderSaved();
          });
        } } }, [document.createTextNode('Eliminar')])
      ]);
    }));
    $('saved-empty').hidden = state.saved.length > 0;
  }

  /* ---------- Mis frases ---------- */
  function catOptions(select, includeAll) {
    var opts = state.categories.map(function (c) { return el('option', { value: c.id, text: c.name }); });
    if (includeAll) opts.unshift(el('option', { value: '', text: 'Todas' }));
    var prev = select.value;
    fill(select, opts);
    if (prev && Array.prototype.some.call(select.options, function (o) { return o.value === prev; })) select.value = prev;
  }

  function renderManage() {
    catOptions($('manage-filter'), true);
    catOptions($('f-cat'), false);
    var filter = $('manage-filter').value;
    var list = state.phrases.filter(function (p) { return !filter || p.categoryId === filter; });
    fill($('manage-list'), list.map(function (p) {
      var idx = state.phrases.indexOf(p);
      var siblings = state.phrases.filter(function (x) { return x.categoryId === p.categoryId; });
      var pos = siblings.indexOf(p);
      return el('li', {}, [
        el('span', { class: 'grow', text: (p.icon ? p.icon + ' ' : '') + p.label + (p.favorite ? ' ★' : '') }),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Subir ' + p.label, disabled: pos === 0 ? 'disabled' : null, on: { click: function () { swapInCategory(idx, siblings, pos, -1); } } }, [document.createTextNode('↑')]),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Bajar ' + p.label, disabled: pos === siblings.length - 1 ? 'disabled' : null, on: { click: function () { swapInCategory(idx, siblings, pos, 1); } } }, [document.createTextNode('↓')]),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Editar ' + p.label, on: { click: function () { openForm(p.id); } } }, [document.createTextNode('Editar')])
      ]);
    }));
    fill($('cat-order'), state.categories.map(function (c, i) {
      return el('li', {}, [
        el('span', { class: 'grow', text: (c.icon ? c.icon + ' ' : '') + c.name }),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Subir categoría ' + c.name, disabled: i === 0 ? 'disabled' : null, on: { click: function () { move(state.categories, i, -1); persist(); renderManage(); } } }, [document.createTextNode('↑')]),
        el('button', { type: 'button', class: 'btn small', 'aria-label': 'Bajar categoría ' + c.name, disabled: i === state.categories.length - 1 ? 'disabled' : null, on: { click: function () { move(state.categories, i, 1); persist(); renderManage(); } } }, [document.createTextNode('↓')])
      ]);
    }));
  }

  function swapInCategory(idx, siblings, pos, d) {
    var other = siblings[pos + d];
    if (!other) return;
    var j = state.phrases.indexOf(other);
    var tmp = state.phrases[idx]; state.phrases[idx] = state.phrases[j]; state.phrases[j] = tmp;
    persist(); renderManage();
  }

  function openForm(id, categoryId) {
    if (current.view !== 'manage') go('manage');
    var p = id ? phraseById(id) : null;
    catOptions($('f-cat'), false);
    $('form-title').textContent = p ? 'Editar frase' : 'Nueva frase';
    $('f-id').value = p ? p.id : '';
    $('f-label').value = p ? p.label : '';
    $('f-text').value = p ? p.text : '';
    $('f-cat').value = p ? p.categoryId : (categoryId || 'personal');
    if (!$('f-cat').value) $('f-cat').selectedIndex = 0;
    $('f-icon').value = p ? p.icon : '';
    $('f-color').value = p ? p.color : '';
    $('f-speak').checked = p ? p.speak : true;
    $('f-fav').checked = p ? p.favorite : false;
    $('form-delete').hidden = !p;
    $('form-error').hidden = true;
    $('phrase-form').hidden = false;
    $('f-label').focus();
  }
  function closeForm() { $('phrase-form').hidden = true; $('new-phrase').focus(); }

  function submitForm(e) {
    e.preventDefault();
    var text = $('f-text').value.trim();
    var label = $('f-label').value.trim();
    var err = $('form-error');
    if (!text) { err.textContent = 'Escribe el texto de la frase. No puede estar vacío.'; err.hidden = false; $('f-text').focus(); return; }
    var data = {
      label: (label || text).slice(0, 80), text: text.slice(0, 500), categoryId: $('f-cat').value,
      icon: $('f-icon').value.trim().slice(0, 8), color: $('f-color').value,
      speak: $('f-speak').checked, favorite: $('f-fav').checked
    };
    var id = $('f-id').value;
    var p = id && phraseById(id);
    if (p) Object.assign(p, data);
    else state.phrases.push(Object.assign({ id: DF.uid(), uses: 0 }, data));
    persist();
    toast(p ? 'Frase guardada.' : 'Frase creada.');
    $('phrase-form').hidden = true;
    render();
    $('new-phrase').focus();
  }

  function deletePhrase() {
    var p = phraseById($('f-id').value);
    if (!p) return;
    confirmBox('¿Eliminar la frase «' + p.label + '»? No se puede deshacer.').then(function (ok) {
      if (!ok) return;
      state.phrases = state.phrases.filter(function (x) { return x.id !== p.id; });
      state.quick = state.quick.filter(function (x) { return x !== p.id; });
      if (current.phraseId === p.id) current.phraseId = null;
      persist();
      toast('Frase eliminada.');
      $('phrase-form').hidden = true;
      render();
      $('new-phrase').focus();
    });
  }

  /* ---------- Ajustes ---------- */
  function renderSettings() {
    var s = state.settings;
    $('s-theme').value = s.theme;
    $('s-font').value = String(s.fontScale);
    $('s-btn').value = s.btnSize;
    $('s-cols').value = String(s.cols);
    $('s-icons').checked = s.showIcons;
    $('s-voice').checked = s.voiceEnabled;
    $('s-rate').value = String(s.rate);
    renderVoices();
  }
  function renderVoices() {
    var sup = DF.speech.supported, voices = DF.speech.getVoices();
    $('voice-support').textContent = !sup
      ? 'Este navegador no permite leer en voz alta. Puedes seguir usando el texto en pantalla y copiarlo.'
      : (voices.length ? 'Voces disponibles en este dispositivo: ' + voices.length + '. Las voces en español aparecen primero.' : 'Buscando voces… Si no aparece ninguna, tu dispositivo puede no tener voces instaladas.');
    var sel = $('s-voice-select');
    var opts = [el('option', { value: '', text: 'Automática (español si existe)' })].concat(voices.map(function (v) {
      return el('option', { value: v.voiceURI, text: v.name + ' (' + v.lang + ')' + (v.localService ? '' : ' — en línea') });
    }));
    fill(sel, opts);
    sel.value = state.settings.voiceURI;
    if (sel.value !== state.settings.voiceURI) sel.value = '';
    ['s-voice', 's-voice-select', 's-rate', 's-voice-test'].forEach(function (id) { $(id).disabled = !sup; });
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    persist();
    applySettings();
    renderSelected();
  }

  /* ---------- Instalación / sin conexión ---------- */
  var installPrompt = null;
  function renderInstall() {
    var st = $('offline-status');
    if (location.protocol === 'file:') st.textContent = 'Has abierto el archivo directamente. Para instalarla y usarla sin conexión, ábrela desde una dirección web (por ejemplo GitHub Pages o un servidor local).';
    else if (!('serviceWorker' in navigator)) st.textContent = 'Este navegador no permite el modo sin conexión.';
    else st.textContent = navigator.serviceWorker.controller ? '✅ La aplicación está preparada para funcionar sin conexión en este navegador.' : 'La aplicación se está preparando para funcionar sin conexión. Vuelve a cargar la página en unos segundos.';
    $('install-btn').hidden = !installPrompt;
  }

  /* ---------- Eventos ---------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (b) go(b.getAttribute('data-go'));
    });

    $('btn-speak').addEventListener('click', function () { speakText(selectedText()); });
    $('btn-copy').addEventListener('click', function () { copyText(selectedText()); });
    $('btn-fav').addEventListener('click', function () {
      var p = phraseById(current.phraseId);
      if (!p) return;
      p.favorite = !p.favorite;
      persist(); render();
      toast(p.favorite ? 'Añadida a favoritas.' : 'Quitada de favoritas.');
    });
    $('btn-edit').addEventListener('click', function () { openForm(current.phraseId); });
    $('btn-close-sel').addEventListener('click', function () { current.phraseId = null; DF.speech.stop(); renderSelected(); });

    $('cat-add').addEventListener('click', function () { openForm(null, current.categoryId); });

    $('quick-add').addEventListener('click', function () {
      var id = $('quick-add-select').value;
      if (!id || state.quick.length >= MAX_QUICK) return;
      state.quick.push(id); persist(); renderQuick();
    });

    var ft = $('free-text');
    $('free-speak').addEventListener('click', function () { speakText(ft.value.trim()); });
    $('free-copy').addEventListener('click', function () { copyText(ft.value); });
    $('free-save').addEventListener('click', function () {
      var t = ft.value.trim();
      if (!t) return toast('Escribe algo antes de guardar.');
      if (state.saved.some(function (m) { return m.text === t; })) return toast('Ese mensaje ya está guardado.');
      state.saved.unshift({ id: DF.uid(), text: t.slice(0, 2000) });
      persist(); renderSaved(); toast('Mensaje guardado.');
    });
    $('free-bigger').addEventListener('click', function () { writeScale = Math.min(3, writeScale + 0.25); ft.style.setProperty('--write-scale', writeScale); });
    $('free-smaller').addEventListener('click', function () { writeScale = Math.max(0.75, writeScale - 0.25); ft.style.setProperty('--write-scale', writeScale); });
    $('free-clear').addEventListener('click', function () {
      if (!ft.value) return;
      confirmBox('¿Borrar el texto escrito?').then(function (ok) { if (ok) { ft.value = ''; ft.focus(); } });
    });

    $('new-phrase').addEventListener('click', function () { openForm(null); });
    $('phrase-form').addEventListener('submit', submitForm);
    $('form-cancel').addEventListener('click', closeForm);
    $('form-delete').addEventListener('click', deletePhrase);
    $('manage-filter').addEventListener('change', renderManage);
    fill($('icon-picks'), DF.ICON_SUGGESTIONS.map(function (ic) {
      return el('button', { type: 'button', 'aria-label': 'Usar icono ' + ic, text: ic, on: { click: function () { $('f-icon').value = ic; } } });
    }));

    $('s-theme').addEventListener('change', function (e) { setSetting('theme', e.target.value); });
    $('s-font').addEventListener('change', function (e) { setSetting('fontScale', Number(e.target.value)); });
    $('s-btn').addEventListener('change', function (e) { setSetting('btnSize', e.target.value); });
    $('s-cols').addEventListener('change', function (e) { setSetting('cols', Number(e.target.value)); });
    $('s-icons').addEventListener('change', function (e) { setSetting('showIcons', e.target.checked); });
    $('s-voice').addEventListener('change', function (e) { setSetting('voiceEnabled', e.target.checked); });
    $('s-voice-select').addEventListener('change', function (e) { setSetting('voiceURI', e.target.value); });
    $('s-rate').addEventListener('change', function (e) { setSetting('rate', Number(e.target.value)); });
    $('s-voice-test').addEventListener('click', function () { speakText('Hola. Esta es mi voz.'); });
    DF.speech.onVoices(function () { if (current.view === 'settings') renderVoices(); });

    $('export').addEventListener('click', function () {
      var blob = new Blob([DF.exportJSON(state)], { type: 'application/json' });
      var a = el('a', { href: URL.createObjectURL(blob), download: 'dilo-facil-copia-' + new Date().toISOString().slice(0, 10) + '.json' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast('Copia de seguridad descargada.');
    });
    $('import-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      e.target.value = '';
      DF.importFile(file).then(function (res) {
        var msg = $('import-msg');
        if (!res.ok) { msg.textContent = '⚠️ ' + res.error; return; }
        confirmBox('¿Restaurar esta copia? Se reemplazarán tus frases y ajustes actuales.').then(function (ok) {
          if (!ok) { msg.textContent = 'Importación cancelada.'; return; }
          state = res.state; current.phraseId = null;
          persist(); applySettings(); render();
          msg.textContent = '✅ Copia restaurada: ' + state.phrases.length + ' frases.';
        });
      });
    });
    $('reset').addEventListener('click', function () {
      confirmBox('¿Borrar TODOS tus datos (frases, favoritas y ajustes)? Te recomendamos exportar una copia antes. No se puede deshacer.').then(function (ok) {
        if (!ok) return;
        DF.clearAll();
        state = DF.createDefaultState(); current.phraseId = null;
        persist(); applySettings(); go('home');
        toast('Datos borrados. Se han restaurado las frases iniciales.');
      });
    });

    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPrompt = e; if (current.view === 'install') renderInstall(); });
    $('install-btn').addEventListener('click', function () {
      if (!installPrompt) return;
      installPrompt.prompt();
      installPrompt = null; renderInstall();
    });
  }

  /* ---------- Inicio ---------- */
  applySettings();
  bind();
  go('home');
  window.scrollTo(0, 0);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* sin modo offline */ });
  }

  // Acceso para las pruebas automáticas (no contiene datos externos)
  window.DF.debugState = function () { return state; };
})();
