/* eslint-disable */

// Bump this per release OR inject a build hash from your bundler.
const CACHE = "expense-share-v2025-08-17";

self.addEventListener("install", () => {
  // Make the new SW take control ASAP
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );

      // Optional: navigation preload can speed first paint
      try {
        if ("navigationPreload" in self.registration) {
          await self.registration.navigationPreload.enable();
        }
      } catch {}

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // ignore cross-origin
  if (/^\/api\b/.test(url.pathname)) return; // let API go to network

  // 1) HTML / navigations: always network-first so UI updates immediately
  const isHTMLNav =
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html");
  if (isHTMLNav) {
    event.respondWith(networkFirstHTML(event));
    return;
  }

  // 2) Versioned static assets (immutable): cache-first
  const isHashed =
    /\.[0-9a-f]{8,}\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(
      url.pathname
    );
  if (isHashed) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3) Other same-origin static: network-first with revalidate
  if (
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|json|woff2?)$/i.test(
      url.pathname
    )
  ) {
    event.respondWith(networkFirstGeneric(request));
  }
});

// ---- helpers ----

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request);
  if (resp.ok) cache.put(request, resp.clone()).catch(() => {});
  return resp;
}

async function networkFirstGeneric(request) {
  const cache = await caches.open(CACHE);
  try {
    // bypass HTTP cache so new versions are picked up
    const resp = await fetch(request, { cache: "no-store" });
    if (resp.ok) cache.put(request, resp.clone()).catch(() => {});
    return resp;
  } catch {
    const cached = await cache.match(request);
    return cached ?? Response.error();
  }
}

async function networkFirstHTML(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
  } catch {}

  try {
    // force revalidation of HTML so new UI loads on first visit
    return await fetch(event.request, { cache: "no-store" });
  } catch {
    // offline fallback if you really want one (optional):
    const cache = await caches.open(CACHE);
    return (await cache.match("/index.html")) ?? Response.error();
  }
}
