/* Dilo Fácil — lectura en voz alta con la Web Speech API del navegador.
   Nunca se habla automáticamente: solo cuando la persona pulsa un botón. */
window.DF = window.DF || {};

DF.speech = (function () {
  var supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var voices = [];
  var listeners = [];

  function refresh() {
    if (!supported) return;
    voices = window.speechSynthesis.getVoices() || [];
    listeners.forEach(function (fn) { fn(voices); });
  }
  if (supported) {
    refresh();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', refresh);
    }
  }

  function spanishFirst(list) {
    return list.slice().sort(function (a, b) {
      var ea = /^es/i.test(a.lang) ? 0 : 1, eb = /^es/i.test(b.lang) ? 0 : 1;
      return ea - eb || a.name.localeCompare(b.name);
    });
  }

  return {
    supported: supported,
    getVoices: function () { return spanishFirst(voices); },
    onVoices: function (fn) { listeners.push(fn); },
    /* Devuelve true si se ha empezado a hablar */
    speak: function (text, opts) {
      if (!supported || !text) return false;
      opts = opts || {};
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = voices.find(function (x) { return x.voiceURI === opts.voiceURI; }) ||
              voices.find(function (x) { return /^es/i.test(x.lang); });
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'es-ES'; }
      u.rate = opts.rate || 1;
      window.speechSynthesis.speak(u);
      return true;
    },
    stop: function () { if (supported) window.speechSynthesis.cancel(); }
  };
})();
