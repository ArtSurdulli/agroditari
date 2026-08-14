const CACHE_VERSION = "agroditari-v1";
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const NAV_CACHE = `${CACHE_VERSION}-nav`;
const KNOWN_CACHES = [ASSET_CACHE, NAV_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("agroditari-") && !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.svg"
  );
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever handle same-origin GET requests. Everything else (POSTs, server
  // actions, cross-origin) is left completely untouched.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch the API layer or NextAuth — auth/session and interactive
  // reads must always hit the network so data is never stale or cross-user.
  if (url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, NAV_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});