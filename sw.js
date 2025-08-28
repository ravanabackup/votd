// Simple PWA Service Worker
const CACHE_NAME = 'bible-verse-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
  // Note: external resources (Google Fonts, Picsum) are not pre-cached.
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// Cache-first for same-origin core assets; network-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;

  const isSameOrigin = new URL(req.url).origin === self.location.origin;
  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        }).catch(() => {
          // offline fallback for root
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
      })
    );
  } else {
    // Network-first for cross-origin (APIs, images) to keep things fresh
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
