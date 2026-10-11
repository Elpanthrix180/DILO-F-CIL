/* Dilo Fácil — service worker: guarda los archivos para funcionar sin conexión.
   Cambia CACHE cuando publiques una versión nueva. */
var CACHE = 'dilofacil-v1';
var FILES = [
  './', 'index.html', 'css/styles.css',
  'js/data.js', 'js/storage.js', 'js/speech.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Primero la caché; si no está, la red. Solo archivos de esta misma web.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request).catch(function () {
      if (e.request.mode === 'navigate') return caches.match('index.html');
    });
  }));
});
