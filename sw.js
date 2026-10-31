/* 逆指示パニック PWA v0.7 */
const CACHE_NAME = 'gyakushiji-panic-pwa-v0.7';
const CACHE_PREFIX = 'gyakushiji-panic-pwa-';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key =>
        key.startsWith(CACHE_PREFIX) &&
        key !== CACHE_NAME
      ).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' ||
      url.origin !== self.location.origin) return;

  if (!url.pathname.startsWith(
    new URL(self.registration.scope).pathname
  )) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put('./', copy))
          );
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(req, {
          ignoreSearch: true
        });

        return cached ||
          await caches.match('./index.html') ||
          await caches.match('./');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req)
      .then(cached => cached || fetch(req))
  );
});
