/**
 * Service Worker for Ms. Luminara's Quiz Lab
 * Enables offline functionality as a PWA
 */

const CACHE_NAME = 'luminara-quiz-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './quick-quiz.html',
  './manifest.json',
  './000-core/000.0-styles.css',
  './000-core/000.0-dev-panel.css',
  './000-core/000.1-app.js',
  './000-core/000.2-renderer.js',
  './000-core/000.2.2-renderer-inventory.js',
  './000-core/000.2.3-renderer-d20-ui.js',
  './000-core/000.3-gamification.js',
  './000-core/000.4-persistence.js',
  './000-core/000.5-achievements.js',
  './000-core/000.6-scaffolding.js',
  './000-core/000.7-d20-system.js',
  './000-core/000.8-loot-system.js',
  './000-core/000.10-isotope-engine.js',
  './000-core/000.11-zpd-system.js',
  './000-core/000.12-multimodal-questions.js',
  './000-core/000.13-lumi-bridge.js',
  './000-core/000.15-boss-system.js',
  './000-core/000.16-run-manager.js',
  './000-core/000.17-powerups.js',
  './000-core/000.18-high-scores.js',
  './000-core/question-registry.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Skip TTS server requests (they need to go to network)
  if (url.port === '5500') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache - fetch from network and cache it
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response (it can only be read once)
            const responseToCache = networkResponse.clone();

            // Cache the fetched response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache same-origin requests
                if (url.origin === location.origin) {
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          })
          .catch(() => {
            // Network failed, return offline fallback if available
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
