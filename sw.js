// Service worker — asset caching for the FE model.
//
// Strategy:
//   `assets/`  cache-first (textures, vendored libs, geojson, icons)
//   .js / .css stale-while-revalidate (cached returns immediately,
//                                      network fetches in background,
//                                      cache updated for next nav)
//   HTML       network-first, cached fallback for offline use.
//
// CACHE_VERSION must be bumped whenever asset names change so old
// caches are dropped on activate. The S671 kill-switch unregistered
// itself, so installing a fresh worker (here, S736) takes effect on
// the next navigation cycle.

const CACHE_VERSION = 'fe-v8-s750';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png',
];

// `_isFirstInstall` is true when this SW boots into a brand-new
// origin (no caches present at install time). On first install
// the activate handler MUST NOT force-reload its claimed clients —
// that produces a redirect on the very first page load (Lighthouse
// "Avoid multiple page redirects"). Subsequent installs (CACHE_VERSION
// bump) DO force-reload so old-bundle tabs pick up the new code.
let _isFirstInstall = false;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const existingKeys = await caches.keys();
    _isFirstInstall = existingKeys.length === 0;
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== STATIC_CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
      return null;
    }));
    await self.clients.claim();
    if (_isFirstInstall) return;
    // Force-reload every controlled tab so any client still
    // running pre-CACHE_VERSION JS / CSS picks up the fresh
    // bundle immediately. Skipped on first install — there's
    // nothing to evict, and the navigate counts as a redirect.
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { await client.navigate(client.url); } catch {}
    }
  })());
});

function isCacheableResponse(res) {
  return res && res.status === 200 && res.type !== 'opaqueredirect';
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (isCacheableResponse(res)) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((res) => {
    if (isCacheableResponse(res)) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || networkPromise;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (isCacheableResponse(res)) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request) || await caches.match('./index.html');
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (req.destination === 'script' || req.destination === 'style' ||
      url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});
