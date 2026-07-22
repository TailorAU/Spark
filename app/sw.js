/* Tailor Education service worker — offline-first family app shell. */
const CACHE = "spark-v19";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./family.json",
  "./js/data.js",
  "./js/auth.js",
  "./children.enc.json",
  "./js/engine.js",
  "./js/store.js",
  "./js/sprites.js",
  "./js/curriculum.js",
  "./js/calendar.js",
  "./js/printpack.js",
  "./content.json",
  "./js/fx.js",
  "./js/worksheets.js",
  "./js/app.js",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache the optional live PLG API calls.
  if (url.pathname.includes("/api/spark/")) return;
  // Cache-first for the app shell, network fallback that refreshes the cache.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res.ok && url.origin === location.origin) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});
