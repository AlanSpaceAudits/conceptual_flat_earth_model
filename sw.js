// Service worker — asset caching for the FE model.
//
// GitHub Pages serves all static files with a 10-minute cache TTL,
// which Lighthouse flags as "Use efficient cache lifetimes" (~10
// MiB of starfields and JS modules). A client-side service worker
// caches assets aggressively, so repeat visits skip the network for
// anything that hasn't changed.
//
// Strategy
//   `assets/`  — cache-first (textures, vendored libs, geojson)
//   JS / CSS   — stale-while-revalidate (returns cached, fetches in
//                background, swaps on next nav)
//   HTML       — network-first with cached fallback (so a fresh
//                deploy is always picked up when online)
//
// Versioning: bumping `CACHE_VERSION` invalidates the old cache on
// the next install. The current value should be advanced any time a
// release introduces breaking asset changes that older clients
// would otherwise serve from cache (a renamed file etc.).

const CACHE_VERSION = 'v1';
const CACHE_NAME    = `fe-model-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Take over on next paint instead of after old tabs close.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k !== CACHE_NAME)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const isAsset = (url) =>
  url.pathname.includes('/assets/') ||
  url.pathname.endsWith('.geojson') ||
  url.pathname.endsWith('.png') ||
  url.pathname.endsWith('.jpg') ||
  url.pathname.endsWith('.jpeg') ||
  url.pathname.endsWith('.webp') ||
  url.pathname.endsWith('.woff') ||
  url.pathname.endsWith('.woff2');

const isCode = (url) =>
  url.pathname.endsWith('.js') ||
  url.pathname.endsWith('.mjs') ||
  url.pathname.endsWith('.css');

const isHtml = (url, req) =>
  req.mode === 'navigate' ||
  url.pathname.endsWith('.html') ||
  url.pathname.endsWith('/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle same-origin GETs. Cross-origin (none right now —
  // three.js is self-hosted) and POST stay on the network path.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAsset(url)) {
    event.respondWith(cacheFirst(req));
  } else if (isCode(url)) {
    event.respondWith(staleWhileRevalidate(req));
  } else if (isHtml(url, req)) {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || networkPromise;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (_) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw _;
  }
}
