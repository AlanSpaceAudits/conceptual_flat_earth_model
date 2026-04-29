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

// KILL SWITCH (S671): the v1 service worker shipped in S669 caused a
// black-screen-on-refresh report. This replacement clears every
// previously installed cache and unregisters itself on activation,
// returning the page to a no-SW baseline. The fetch handler is also
// stripped so requests bypass the worker entirely.
//
// To re-introduce caching later, restore the prior strategy under a
// fresh `CACHE_VERSION` so installed kill-switch workers swap out
// cleanly on activate.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
  })());
});

// No fetch handler — every request bypasses the worker.

