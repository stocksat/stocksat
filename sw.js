// Service worker de Stock Hoopo.
// La app siempre intenta cargar la última versión de la red; la copia guardada
// solo se usa si no hay cobertura. Los datos (Supabase) nunca se guardan aquí.
const CACHE = 'stock-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
const OPCIONALES = ['./icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).then(() =>
        // Los iconos no son imprescindibles: si faltan, el service worker se instala igual
        Promise.all(OPCIONALES.map(u => c.add(u).catch(() => {})))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fuentes y librerías: directo a la red

  e.respondWith(
    // cache: 'no-cache' = preguntar siempre a GitHub si hay versión nueva
    // (sin esto el móvil podía seguir 10 minutos con la versión vieja guardada)
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
