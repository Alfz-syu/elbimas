/* Service worker Elbimas — cache-first utk aset statis, network-first utk
   navigasi dgn fallback /offline. API & data privat TIDAK pernah di-cache. */
const VERSION = "v1";
const STATIC_CACHE = `elbimas-static-${VERSION}`;
const PAGE_CACHE = `elbimas-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/budgets",
  "/goals",
  "/debts",
  "/recurring",
  "/settings",
  "/reports",
];

function isPrivatePage(url) {
  return PRIVATE_PREFIXES.some(
    (prefix) =>
      url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Data API (termasuk data keuangan privat): selalu network, tanpa cache.
  if (url.pathname.startsWith("/api/")) return;

  // Aset statis ber-hash: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Navigasi halaman: network-first → cache → /offline.
  // Halaman privat berisi data keuangan → TIDAK di-cache, hanya fallback offline.
  if (request.mode === "navigate") {
    const cacheable = !isPrivatePage(url);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && cacheable) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          cacheable
            ? caches
                .match(request)
                .then((cached) => cached ?? caches.match(OFFLINE_URL))
            : caches.match(OFFLINE_URL)
        )
    );
  }
});
