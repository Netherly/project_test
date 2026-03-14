const IMAGE_CACHE_NAME = "gsse-image-cache-v1";
const STATIC_IMAGE_URLS = ["/gsse-cover.png", "/avatar.jpg"];
const MAX_IMAGE_CACHE_ENTRIES = 150;

const canCacheResponse = (response) =>
  response && (response.ok || response.type === "opaque");

const isImageRequest = (request) => {
  if (request.method !== "GET") return false;

  try {
    const url = new URL(request.url);
    if (request.destination === "image") return true;
    return /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
  } catch (_) {
    return false;
  }
};

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;

  if (overflow <= 0) return;

  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(IMAGE_CACHE_NAME).then((cache) => cache.addAll(STATIC_IMAGE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== IMAGE_CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isImageRequest(request)) return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then(async (response) => {
          if (canCacheResponse(response)) {
            await cache.put(request, response.clone());
            await trimCache(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ENTRIES);
          }
          return response;
        })
        .catch((error) => {
          if (cached) return cached;
          throw error;
        });

      if (cached) {
        event.waitUntil(networkFetch.catch(() => {}));
        return cached;
      }

      return networkFetch;
    })()
  );
});
