// JARVIS Service Worker — cached alle App-Dateien für Offline-Nutzung.
// Externe CDN-Ressourcen (Three.js, Google Fonts) werden separat im
// Hintergrund aktualisiert (network-first), damit Chess/Air Hockey/
// Checkers/Mini-Golf/Billard online immer die neueste Version bekommen,
// aber offline trotzdem funktionieren, sobald sie einmal geladen wurden.

const CACHE_NAME = "jarvis-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./jarvis-script.js",
  "./jarvis-style.css",
  "./games-script.js",
  "./games-style.css",
  "./chess-script.js",
  "./chess-board3d.js",
  "./chess-style.css",
  "./airhockey-script.js",
  "./airhockey-style.css",
  "./checkers-script.js",
  "./checkers-style.css",
  "./minigolf-script.js",
  "./minigolf-style.css",
  "./billiard-script.js",
  "./billiard-style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // App-eigene Dateien: cache-first, damit es offline sofort funktioniert.
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        }).catch(() => cached);
      })
    );
  } else {
    // Externe Ressourcen (Three.js CDN, Google Fonts, Wetter-API):
    // network-first, mit Cache als Offline-Fallback.
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
