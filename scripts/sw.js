const CACHE_NAME = 'visita-formularios-v1';
const URLS = [
  '/formularios-visita-tecnica/',
  '/formularios-visita-tecnica/index.html',
  '/formularios-visita-tecnica/config/manifest.json',
  '/formularios-visita-tecnica/hospital/',
  '/formularios-visita-tecnica/hospital/index.html',
  '/formularios-visita-tecnica/hospital/config/manifest.json',
  '/formularios-visita-tecnica/maternidade/',
  '/formularios-visita-tecnica/maternidade/index.html',
  '/formularios-visita-tecnica/maternidade/config/manifest.json',
  '/formularios-visita-tecnica/ubs/',
  '/formularios-visita-tecnica/ubs/index.html',
  '/formularios-visita-tecnica/ubs/config/manifest.json',
  '/formularios-visita-tecnica/upa/',
  '/formularios-visita-tecnica/upa/index.html',
  '/formularios-visita-tecnica/upa/config/manifest.json',
  '/formularios-visita-tecnica/sadt/',
  '/formularios-visita-tecnica/sadt/index.html',
  '/formularios-visita-tecnica/sadt/config/manifest.json',
  '/formularios-visita-tecnica/caps/',
  '/formularios-visita-tecnica/caps/index.html',
  '/formularios-visita-tecnica/caps/config/manifest.json',
  '/formularios-visita-tecnica/centro-reabilitacao/',
  '/formularios-visita-tecnica/centro-reabilitacao/index.html',
  '/formularios-visita-tecnica/centro-reabilitacao/config/manifest.json',
  '/formularios-visita-tecnica/vigilancia-epidemiologica/',
  '/formularios-visita-tecnica/vigilancia-epidemiologica/index.html',
  '/formularios-visita-tecnica/vigilancia-epidemiologica/config/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.origin.includes('github.io')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || network;
    })
  );
});
