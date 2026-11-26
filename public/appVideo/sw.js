const CACHE_NAME = 'teleshorts-pwa-v1.0.3';
const OFFLINE_URL = 'offline.html';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'offline.html',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable.png',
  'icons/apple-touch-icon.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for message events (e.g. skip waiting prompt)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Strategy with strict video/stream exclusion
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never intercept non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. NEVER intercept Range requests (video stream chunks / partial content)
  if (req.headers.has('range')) {
    return;
  }

  // 3. NEVER intercept video / audio streaming destinations or known media workers/CDNs
  if (
    req.destination === 'video' ||
    req.destination === 'audio' ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('drive.google.com') ||
    url.hostname.includes('drive.usercontent.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.m3u8')
  ) {
    return;
  }

  // 4. Navigation requests (HTML documents) -> Network first, fallback to cache, then offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 5. App assets (JS, CSS, icons, posters) -> Stale-while-revalidate or Network first
  // For app.js: Network first to ensure latest player/streaming fixes, fallback to cache
  if (url.pathname.endsWith('app.js')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 6. Other local static assets (icons, manifest, offline page) -> Cache First, fallback to Network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(req).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: pass through to network
});