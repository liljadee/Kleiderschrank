/*
 * Service Worker von „Mein Kleiderschrank“, beim Paketieren aus scripts/sw-vorlage.js erzeugt.
 * Lädt alle Programmdateien bei der Installation vorab; danach läuft die App ohne Netz.
 * Die Texterkennung wird beim ersten Gebrauch (bzw. kurz nach dem Start) zwischengespeichert.
 * Eine neue Version wartet, bis man „Neu laden“ antippt. Löst den Service Worker von Version 1.5 ab.
 */
const VERSION = '2.0.0-7b9b63ba309a';
const DATEIEN = ["index.html","app.js","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png","barlow-400.woff2","barlow-500.woff2","barlow-600.woff2","barlow-condensed-600.woff2"];
const TEXTERKENNUNG = ["worker.min.js","tesseract-core-simd-lstm.wasm.js","deu.traineddata.gz"];
const CACHE = `kleiderschrank-${VERSION}`;
const CACHE_TEXTERKENNUNG = 'kleiderschrank-texterkennung-7.0.0';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(DATEIEN.map((f) => new Request(f, { cache: 'reload' })));
      // Gibt es noch keine frühere Version 2 (erste Installation oder Wechsel von 1.5), sofort übernehmen.
      // Sonst wartet die neue Version, bis man in der App „Neu laden“ antippt.
      const frueher = (await caches.keys()).filter((k) => /^kleiderschrank-\d/.test(k) && k !== CACHE);
      if (!frueher.length) await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('kleiderschrank-') && key !== CACHE && key !== CACHE_TEXTERKENNUNG) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Nur eigene Dateien; das Wetter (Open-Meteo) geht direkt ans Netz.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      // Jede Seitenadresse bekommt index.html; die App wertet die Adresse (#/…) aus.
      if (req.mode === 'navigate') return (await (await caches.open(CACHE)).match('index.html')) ?? fetch(req);
      const name = url.pathname.split('/').pop();
      if (TEXTERKENNUNG.includes(name)) {
        const cache = await caches.open(CACHE_TEXTERKENNUNG);
        const treffer = await cache.match(name);
        if (treffer) return treffer;
        const antwort = await fetch(req);
        if (antwort.ok) await cache.put(name, antwort.clone());
        return antwort;
      }
      return (await (await caches.open(CACHE)).match(req, { ignoreSearch: true })) ?? fetch(req);
    })(),
  );
});
