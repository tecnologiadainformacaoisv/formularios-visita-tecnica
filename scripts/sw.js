const APP_VERSION = '0.3.0';
const CACHE_NAME = `visita-formularios-${APP_VERSION}`;
const URLS = [
  // Raiz e assets compartilhados
  '/formularios-visita-tecnica/',
  '/formularios-visita-tecnica/index.html',
  '/formularios-visita-tecnica/config/manifest.json',
  '/formularios-visita-tecnica/shared/styles/instituto.css',
  '/formularios-visita-tecnica/shared/assets/logo-192.png',
  // Scripts compartilhados (necessários para CAPS, UBS, UPA, SADT, CER, Vigilância)
  '/formularios-visita-tecnica/scripts/form-core.js',
  '/formularios-visita-tecnica/scripts/appscript-config.js',
  // Pesquisa de satisfação
  '/formularios-visita-tecnica/pesquisa-satisfacao/',
  '/formularios-visita-tecnica/pesquisa-satisfacao/pesquisa.html',
  '/formularios-visita-tecnica/pesquisa-satisfacao/dashboard.html',
  // Hospital
  '/formularios-visita-tecnica/hospital/',
  '/formularios-visita-tecnica/hospital/index.html',
  '/formularios-visita-tecnica/hospital/config/manifest.json',
  // Maternidade
  '/formularios-visita-tecnica/maternidade/',
  '/formularios-visita-tecnica/maternidade/index.html',
  '/formularios-visita-tecnica/maternidade/config/manifest.json',
  // UBS
  '/formularios-visita-tecnica/ubs/',
  '/formularios-visita-tecnica/ubs/index.html',
  '/formularios-visita-tecnica/ubs/config/manifest.json',
  // UPA
  '/formularios-visita-tecnica/upa/',
  '/formularios-visita-tecnica/upa/index.html',
  '/formularios-visita-tecnica/upa/config/manifest.json',
  // SADT
  '/formularios-visita-tecnica/sadt/',
  '/formularios-visita-tecnica/sadt/index.html',
  '/formularios-visita-tecnica/sadt/config/manifest.json',
  // CAPS
  '/formularios-visita-tecnica/caps/',
  '/formularios-visita-tecnica/caps/index.html',
  '/formularios-visita-tecnica/caps/config/manifest.json',
  // Centro de Reabilitação
  '/formularios-visita-tecnica/centro-reabilitacao/',
  '/formularios-visita-tecnica/centro-reabilitacao/index.html',
  '/formularios-visita-tecnica/centro-reabilitacao/config/manifest.json',
  // Vigilância Epidemiológica
  '/formularios-visita-tecnica/vigilancia-epidemiologica/',
  '/formularios-visita-tecnica/vigilancia-epidemiologica/index.html',
  '/formularios-visita-tecnica/vigilancia-epidemiologica/config/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Promise.allSettled garante que uma URL com falha não cancela todo o cache
      return Promise.allSettled(
        URLS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Falha ao cachear:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Tenta atualizar o cache em background enquanto serve o cached
      const network = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      // Cache first: serve o cached imediatamente se existir
      return cached || network;
    })
  );
});
