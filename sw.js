const CACHE_NAME = 'eroica-moto-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './Eroica%20in%20moto%20percorso%20permanente.gpx',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn-icons-png.flaticon.com/512/3196/3196024.png'
];

// Install Event - Precache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell and CDNs');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin API requests (like weather API) to handle them with network-first
  if (event.request.url.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache newly fetched assets if they belong to our origin or trusted CDNs
        if (
          networkResponse.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
           event.request.url.includes('unpkg.com') ||
           event.request.url.includes('cdnjs.cloudflare.com') ||
           event.request.url.includes('fonts.gstatic.com') ||
           event.request.url.includes('cdn.jsdelivr.net') ||
           event.request.url.includes('basemaps.cartocdn.com') ||
           event.request.url.includes('tile.openstreetmap.org') ||
           event.request.url.includes('arcgisonline.com') ||
           event.request.url.includes('tile.opentopomap.org'))
        ) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});
