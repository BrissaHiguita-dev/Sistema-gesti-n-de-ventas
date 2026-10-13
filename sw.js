// Identificador y versión de la caché local
const CACHE_NAME = 'minidonas-cache-v1';

// Lista de archivos principales requeridos para el funcionamiento fuera de línea / fluido
const urlsToCache = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json'
];

// Evento 1: Instalación del Service Worker y precarga de archivos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precargando archivos esenciales en la caché local...');
      return cache.addAll(urlsToCache);
    })
  );
});

// Evento 2: Activación y eliminación de versiones antiguas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpiando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento 3: Intercepción de peticiones de red para servir desde caché primero (rendimiento nativo)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devuelve la copia guardada en caché o realiza la petición en red si no existe
      return response || fetch(event.request);
    })
  );
});