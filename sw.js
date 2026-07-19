/* MCAT Mastery — offline cache for installable PWA */
const CACHE = "mcat-mastery-v38-castle-locked";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/config.js",
  "./js/questions.js",
  "./js/questions-extra.js",
  "./js/glyphs.js",
  "./js/campaign.js",
  "./js/engine.js",
  "./js/cloud.js",
  "./js/music.js",
  "./js/element-data.js",
  "./js/periodic-table.js",
  "./js/pwa-install.js",
  "./js/quest.js",
  "./js/explore3d-worlds.js",
  "./js/explore3d.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  // Castle scenes + AI archetype portraits
  "./assets/hero-castle.png",
  "./assets/scenes/castle-photo.jpg",
  "./assets/scenes/castle-lights-night.jpg",
  "./assets/scenes/cathedral-interior.jpg",
  "./assets/scenes/gothic-cathedral.jpg",
  "./assets/scenes/grand-library.jpg",
  "./assets/hero-castle.png",
  "./assets/scenes/moonlit-clouds.jpg",
  "./assets/creatures/cat-ginger.jpg",
  "./assets/chars/portrait-rowan.png",
  "./assets/chars/portrait-sage.png",
  "./assets/chars/portrait-pip.png",
  "./assets/chars/portrait-vesper.png",
  "./assets/chars/portrait-elowen.png",
  "./assets/chars/portrait-cassian.png",
  "./assets/chars/portrait-bramble.png",
  "./assets/chars/portrait-lyra.png",
  "./assets/chars/portrait-groundskeeper.png",
  "./assets/gfx/sticker-owl.svg",
  "./assets/gfx/sticker-wand.svg",
  "./assets/gfx/sticker-potion.svg",
  "./assets/gfx/sticker-hat.svg",
  "./assets/gfx/sticker-stars.svg",
  "./assets/gfx/sticker-ticket.svg",
  "./assets/gfx/sticker-seal.svg",
  "./assets/gfx/sticker-broom.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* optional */
          })
        )
      ).then(() => self.skipWaiting())
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isAudio =
    url.pathname.includes("/audio/") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".wav") ||
    url.pathname.endsWith(".ogg");

  if (isAudio) return;

  const isLargeArt =
    url.pathname.includes("/assets/scenes/") ||
    url.pathname.includes("/assets/creatures/") ||
    (url.pathname.includes("/assets/") &&
      (url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".webp")));

  const networkFirst =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith("/sw.js") ||
    url.pathname.endsWith("/mcat-mastery-game/") ||
    url.pathname.endsWith("/mcat-mastery-game") ||
    url.search.includes("v=") ||
    isLargeArt;

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
