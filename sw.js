/* Offline-Unterstützung: App-Dateien werden zwischengespeichert.
   Eigene Dateien: erst Netz (für Updates), sonst Zwischenspeicher. */
const CACHE = 'kleiderschrank-v1-2-1';
const ASSETS = ['./', './index.html', './app.js', './engine.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable.png',
  './barlow-400.woff2', './barlow-500.woff2', './barlow-600.woff2', './barlow-condensed-600.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'kleiderschrank-cdn').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(req, { signal: ctrl.signal, cache: 'no-cache' }); clearTimeout(t);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
      }
    })());
    return;
  }
  // Texterkennung (einmalig aus dem Netz, danach offline verfügbar)
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open('kleiderschrank-cdn').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
  }
  // Wetterdaten gehen direkt ans Netz; die App merkt sich die letzte Vorhersage selbst.
});
