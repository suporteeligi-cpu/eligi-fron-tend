// Eligi PWA service worker (dashboard) — mínimo. O fetch handler de navegação
// existe pra satisfazer o critério de instalabilidade do Chrome (Android).
const CACHE = 'eligi-dash-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match('/');
      return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
