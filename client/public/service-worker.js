/* eslint-disable */

const CACHE_NAME = "expense-share-cache-v1";
const APP_SHELL = ["/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration && "navigationPreload" in self.registration) {
          await self.registration.navigationPreload.enable();
        }
      } catch (_) {}

      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event && event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignore calls to external origins and API endpoints
  if (url.origin !== self.location.origin) return;
  if (/^\/api\b/.test(url.pathname)) return;

  // App Shell-style routing for navigations
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;
          return await fetch(request);
        } catch (e) {
          return await caches.match("/index.html");
        }
      })()
    );
    return;
  }

  // Cache-first for static assets; network-first for others
  if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchAndCache = fetch(request).then((response) => {
          const cacheControl = response.headers.get("Cache-Control") || "";
          if (
            response &&
            response.ok &&
            response.type === "basic" &&
            !/no-store/i.test(cacheControl)
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
        return cached || fetchAndCache;
      })
    );
  } else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cacheControl = response.headers.get("Cache-Control") || "";
          if (
            response &&
            response.ok &&
            response.type === "basic" &&
            !/no-store/i.test(cacheControl)
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
