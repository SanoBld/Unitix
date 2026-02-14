const CACHE_NAME = 'unitix-v7-power';
const DYNAMIC_CACHE = 'unitix-dynamic-v7';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://unpkg.com/@phosphor-icons/web'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v7.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation v7.0...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME && name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

// Fetch - Stratégie hybride optimisée
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API de devises - Network First avec cache fallback
  if (url.hostname.includes('er-api.com')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback vers cache en mode offline
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Retourner une réponse par défaut si pas de cache
              return new Response(
                JSON.stringify({ rates: {}, error: 'Offline, no cache available' }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            });
        })
    );
    return;
  }

  // Stratégie Cache First pour ressources statiques
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Vérifier mises à jour en arrière-plan
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse);
                  });
                }
              })
              .catch(() => {
                // Erreur réseau, garder le cache
              })
          );
          return cachedResponse;
        }

        // Pas en cache, fetch depuis réseau
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Page offline si disponible
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  // NOUVEAU : Mode Éco - Réduire fréquence de sync
  if (event.data && event.data.type === 'ECO_MODE_ENABLED') {
    console.log('[SW] Mode Éco activé - Sync réduit');
  }
});

// Background Sync (si supporté) - Adaptatif selon mode éco
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-currency') {
    event.waitUntil(
      fetch('https://open.er-api.com/v6/latest/EUR')
        .then((response) => response.json())
        .then((data) => {
          console.log('[SW] Taux de change synchronisés');
          // Stocker dans cache
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            return cache.put(
              'https://open.er-api.com/v6/latest/EUR',
              new Response(JSON.stringify(data))
            );
          });
        })
        .catch((error) => {
          console.error('[SW] Erreur sync:', error);
        })
    );
  }
});

// Periodic Background Sync (si supporté) - Optimisé mode éco
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'currency-update') {
    event.waitUntil(
      fetch('https://open.er-api.com/v6/latest/EUR')
        .then(response => response.json())
        .then(data => {
          console.log('[SW] Mise à jour périodique des taux');
        })
        .catch(error => {
          console.error('[SW] Erreur mise à jour périodique:', error);
        })
    );
  }
});

console.log('✅ Service Worker v7.0 - Power Edition chargé');
