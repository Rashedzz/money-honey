/**
 * Money-Honey Progressive Web App (PWA) Service Worker
 * Enables offline caching, fast background assets, and Chrome/Edge/Mobile PWA Installability
 */

const CACHE_NAME = 'money-honey-cache-v2';

// Install: Cache critical static assets relative to current scope
self.addEventListener('install', (event) => {
  self.skipWaiting();
  const scope = self.registration ? self.registration.scope : './';
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urlsToCache = [
        scope,
        new URL('manifest.json', scope).href,
        new URL('favicon.png', scope).href,
        new URL('icon-192.png', scope).href,
        new URL('icon-512.png', scope).href,
      ];
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('PWA: Some assets failed to pre-cache', err);
      });
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: Purging deprecated cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate / Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            const scope = self.registration ? self.registration.scope : './';
            return caches.match(scope);
          }
        });
      })
  );
});
