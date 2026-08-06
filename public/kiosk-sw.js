/*
 * Service worker du kiosque VenuD'où.
 * Objectif : le questionnaire doit fonctionner hors ligne après une première
 * ouverture en ligne. Stratégies :
 *  - navigations (/kiosk*) : réseau d'abord, cache en secours ;
 *  - assets build (/assets/*) : cache d'abord (fichiers hashés immuables) ;
 *  - le reste : réseau, sans mise en cache.
 * Les réponses en attente sont gérées par IndexedDB côté application.
 */
const CACHE = 'venudou-kiosk-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations kiosque : réseau d'abord, cache en secours (hors ligne).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/kiosk'))),
    );
    return;
  }

  // Assets hashés + fichiers publics : cache d'abord.
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/brand/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
