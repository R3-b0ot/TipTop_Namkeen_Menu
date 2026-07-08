const CACHE = 'ttn-static-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/product.html',
  '/assets/css/design-system.css',
  '/assets/css/main.css',
  '/assets/css/product.css',
  '/assets/js/state.js',
  '/assets/js/ui.js',
  '/assets/js/scene-3d.js',
  '/assets/data/catalog.json',
  'https://unpkg.com/three@0.126.0/build/three.module.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      const fetched = fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
