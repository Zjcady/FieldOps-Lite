// FieldOps Service Worker — offline caching & photo queue
const CACHE_NAME = "fieldops-v1";
const OFFLINE_URLS = ["/", "/jobs", "/crew", "/customers"];
const DB_NAME = "fieldops-offline";
const STORE_NAME = "photo-queue";

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
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else if (event.request.mode === "navigate") {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/login") || url.pathname.startsWith("/signup")) {
      return; // Don't cache auth pages
    }
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

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function uploadPendingPhotos() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const items = await new Promise((resolve, reject) => {
      // Limit to 50 items to avoid excessive memory usage (#53,#60)
      const req = store.getAll(null, 50);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const item of items) {
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("caption", item.caption || "");
        formData.append("category", item.category || "progress");
        if (item.lat) formData.append("lat", String(item.lat));
        if (item.lng) formData.append("lng", String(item.lng));

        const res = await fetch(`/api/jobs/${item.jobId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          // Remove from queue
          const deleteTx = db.transaction(STORE_NAME, "readwrite");
          deleteTx.objectStore(STORE_NAME).delete(item.id);
        }
      } catch {
        console.log("[SW] Failed to upload queued photo, will retry later");
      }
    }
  } catch {
    console.log("[SW] No pending photos or DB error");
  }
}
