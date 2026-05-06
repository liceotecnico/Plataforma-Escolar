const CACHE_NAME = 'plataforma-ltt-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: cachear archivos estáticos
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('SW: cacheando archivos');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejas
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, caché como fallback
self.addEventListener('fetch', function(event) {
  // Solo manejar GET y misma origen
  if (event.request.method !== 'GET') return;
  
  // Para Supabase (API) siempre ir a red
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Guardar copia en caché si es válido
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(function() {
        // Sin red: usar caché
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
