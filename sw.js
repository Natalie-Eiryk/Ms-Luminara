/**
 * Service Worker for Ms. Luminara's Quiz Lab
 * Network-first strategy - always fetch fresh on refresh, cache for offline only
 * Truly roguelike: every run starts fresh!
 */

const CACHE_NAME = 'luminara-quiz-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './quick-quiz.html',
  './manifest.json',
  './000-core/000.0-styles.css',
  './000-core/000.0-mobile.css',
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
  './000-core/000.14-scaffold-remediation.js',
  './000-core/000.15-boss-system.js',
  './000-core/000.16-run-manager.js',
  './000-core/000.17-powerups.js',
  './000-core/000.18-high-scores.js',
  './000-core/question-registry.json'
];

// Install event - cache static assets for offline use
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets for offline');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete - taking over immediately');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean up ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activated - claiming all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK FIRST, cache only as fallback for offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Skip TTS server requests
  if (url.port === '5500') return;

  event.respondWith(
    // Always try network first - fresh files every time!
    fetch(event.request)
      .then((networkResponse) => {
        // Got fresh response from network
        if (networkResponse && networkResponse.status === 200) {
          // Update the cache with the fresh version
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed - we're offline, use cached version
        console.log('[SW] Offline - serving from cache:', event.request.url);
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache either - return offline message for documents
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            return new Response('Offline - no cached version available', { status: 503 });
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
      console.log('[SW] Cache nuked from orbit');
    });
  }
});
