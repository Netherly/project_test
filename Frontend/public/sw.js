const MEDIA_CACHE_NAME = "gsse-media-cache-v2";
const STATIC_IMAGE_URLS = ["/gsse-cover.png", "/avatar.jpg"];
const MAX_MEDIA_CACHE_ENTRIES = 180;
const MAX_VIDEO_CACHE_SIZE_BYTES = 400 * 1024;

const canCacheResponse = (response) =>
  response && (response.ok || response.type === "opaque");

const isImageRequest = (request, url) => {
  if (request.destination === "image") return true;

  return /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
};

const isCacheableVideoRequest = (request, url) => {
  if (request.headers.has("range")) return false;
  if (url.origin !== self.location.origin) return false;

  return request.destination === "video" && /\.webm$/i.test(url.pathname);
};

const isMediaRequest = (request) => {
  if (request.method !== "GET") return false;

  try {
    const url = new URL(request.url);
    return isImageRequest(request, url) || isCacheableVideoRequest(request, url);
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
    caches.open(MEDIA_CACHE_NAME).then((cache) => cache.addAll(STATIC_IMAGE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== MEDIA_CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isMediaRequest(request)) return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then(async (response) => {
          const shouldCacheImage = isImageRequest(request, url);
          const contentLength = Number(response.headers.get("content-length") || 0);
          const shouldCacheVideo =
            isCacheableVideoRequest(request, url) &&
            (!contentLength || contentLength <= MAX_VIDEO_CACHE_SIZE_BYTES);

          if (canCacheResponse(response) && (shouldCacheImage || shouldCacheVideo)) {
            await cache.put(request, response.clone());
            await trimCache(MEDIA_CACHE_NAME, MAX_MEDIA_CACHE_ENTRIES);
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
