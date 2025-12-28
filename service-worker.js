// Nombre del cache
const CACHE_NAME = 'foxweb-v1.0';
// Archivos a cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/main.html',
  '/data.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://i.imgur.com/qfsMx7V.png',
  'https://i.imgur.com/5JzgCvZ.png',
  'https://i.imgur.com/qJpo1hb.jpeg'
];

// Instalar Service Worker y cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando cache antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptar peticiones y servir desde cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos en cache, lo devolvemos
        if (response) {
          return response;
        }
        
        // Si no está en cache, lo buscamos en la red
        return fetch(event.request).then(response => {
          // Verificamos que sea una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonamos la respuesta
          const responseToCache = response.clone();
          
          // Agregamos al cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      }).catch(() => {
        // Si falla todo, podemos mostrar una página offline personalizada
        return caches.match('/main.html');
      })
  );
});