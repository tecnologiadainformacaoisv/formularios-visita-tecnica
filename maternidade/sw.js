// ── SERVICE WORKER – Ficha de Visita Técnica Maternidade ──
const CACHE_NAME = 'visita-maternidade-v1';

// Arquivos a cachear na instalação
const ARQUIVOS = [
  '/formularios-visita-tecnica/maternidade/',
  '/formularios-visita-tecnica/maternidade/index.html'
];

// Instalação – cacheia os arquivos principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

// Ativação – limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch – serve do cache se offline
self.addEventListener('fetch', e => {
  // Ignora POSTs (envios do formulário)
  if (e.request.method !== 'GET') return;

  // Ignora requisições externas (IBGE, Apps Script)
  const url = new URL(e.request.url);
  if (!url.hostname.includes('github.io')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Tenta buscar versão atualizada em background
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached); // Se offline, retorna cache

      // Retorna cache imediatamente se tiver, senão espera a rede
      return cached || network;
    })
  );
});
