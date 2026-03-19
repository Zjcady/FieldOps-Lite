// FieldOps Service Worker — offline caching & photo queue
const CACHE_NAME = "fieldops-v1";
const OFFLINE_URLS = ["/", "/jobs", "/crew", "/customers"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for API, cache-first for static
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
  }
});

// Background sync for offline photo uploads
self.addEventListener("sync", (event) => {
  if (event.tag === "photo-upload") {
    event.waitUntil(uploadPendingPhotos());
  }
});

async function uploadPendingPhotos() {
  // Photos queued in IndexedDB will be uploaded when back online
  // This is a placeholder — actual implementation needs IndexedDB integration
  console.log("[SW] Syncing pending photo uploads...");
}
