// FoxWeb Service Worker - Funcionalidad Offline
const BASE_NAME = 'foxweb-dynamic';
let currentVersion = '1';
let currentCacheName = BASE_NAME + '-v1';

async function getVersion() {
  try {
    const response = await fetch('/version.json');
    const data = await response.json();
    currentVersion = data.version || '1';
    currentCacheName = BASE_NAME + '-v' + currentVersion;
    return { version: currentVersion, cacheName: currentCacheName };
  } catch (e) {
    console.log('[SW] Error leyendo version.json, usando default');
    return { version: '1', cacheName: BASE_NAME + '-v1' };
  }
}

// Archivos críticos para caché offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/downloads.html',
  '/assets/css/main.css',
  '/assets/css/bg-main.css',
  '/assets/icon.webp',
  '/assets/logo.webp',
  '/components/header.html',
  '/components/footer.html'
];

/**
 * Instalación del Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    getVersion().then(({ cacheName }) => {
      return caches.open(cacheName)
        .then((cache) => {
          console.log('[SW] Cacheando archivos estáticos en:', cacheName);
          return cache.addAll(STATIC_ASSETS);
        })
        .then(() => self.skipWaiting())
        .catch((err) => console.error('[SW] Error en instalación:', err));
    })
  );
});

/**
 * Activación del Service Worker - Manejo de versiones
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    getVersion().then(({ version, cacheName }) => {
      console.log('[SW] Nueva versión:', version, 'cache:', cacheName);
      
      // Open cache for current version
      return caches.open(cacheName)
        .then(() => {
          // Delete old caches
          return caches.keys()
            .then((keys) => {
              const oldKeys = keys.filter((key) => {
                // Keep caches with current version, delete others
                if (key === cacheName || key === 'foxweb-static-v1') return false;
                if (key.startsWith(BASE_NAME) && key.includes('-' + version)) return false;
                return key.startsWith(BASE_NAME) || key === 'foxweb-static-v1';
              });
              
              return Promise.all(
                oldKeys.map((key) => {
                  console.log('[SW] Eliminando cache antiguo:', key);
                  return caches.delete(key);
                })
              );
            });
        })
        .then(() => self.clients.claim())
        .catch((e) => {
          console.log('[SW] Error en activación:', e);
          return self.clients.claim();
        });
    })
  );
});

/**
 * Muestra la página offline cuando no hay conexión
 */
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
<script>(function() { var e = localStorage.getItem("foxweb_theme") || "dark"; document.documentElement.setAttribute("data-theme", e) })()</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="format-detection" content="telephone=no, address=no, email=no">
<meta name="robots" content="noindex, follow">
<title>FoxWeb | Sin Conexión</title>
<meta name="description" content="No hay conexión a internet. FoxWeb requiere conexión para funcionar correctamente.">
<meta name="theme-color" content="#FF4500">
<meta name="author" content="FoxOrange224">
<link rel="icon" type="image/png" href="/assets/favicon-96x96.png" sizes="96x96">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="shortcut icon" href="/assets/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FoxWeb">
<meta name="mobile-web-app-capable" content="yes">
<meta name="msapplication-TileColor" content="#FF4500">
<meta name="msapplication-TileImage" content="/assets/icon.webp">
<meta name="msapplication-config" content="browserconfig.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="/assets/css/main.css">
<link rel="stylesheet" href="/assets/css/bg-main.css">
<style>
.offline-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.offline-icon {
  font-size: 80px;
  color: var(--primary);
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.offline-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 10px;
}

.offline-message {
  font-size: 1.1rem;
  color: var(--text-dim);
  margin-bottom: 30px;
  max-width: 500px;
}

.offline-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.offline-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: background 0.2s;
}

.offline-btn:hover {
  background: var(--primary-hover);
}

.offline-btn.secondary {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border);
}

.offline-btn.secondary:hover {
  background: var(--bg-tab);
}

.offline-tips {
  margin-top: 40px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  max-width: 500px;
}

.offline-tips h4 {
  color: var(--text-main);
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-tips ul {
  list-style: none;
  text-align: left;
}

.offline-tips li {
  color: var(--text-dim);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-tips li i {
  color: var(--primary);
}
</style>
</head>

<body>
<noscript>
<div style="background: #ff4500; color: white; padding: 15px; text-align: center; font-family: system-ui, sans-serif;">
<strong>⚠️ JavaScript está desactivado</strong><br>
<span style="font-size: 14px;">FoxWeb requiere JavaScript para funcionar correctamente. Por favor, habilita JavaScript en tu navegador para disfrutar de todas las funcionalidades.</span>
</div>
</noscript>

<div class="offline-container">
<div class="offline-icon">
<i class="fa-solid fa-wifi"></i>
</div>
<h1 class="offline-title">Sin Conexión a Internet</h1>
<p class="offline-message">
No hay conexión a internet. FoxWeb requiere conexión para funcionar correctamente.
Por favor, verifica tu conexión e intenta nuevamente.
</p>
<div class="offline-actions">
<button onclick="location.reload()" class="offline-btn">
<i class="fa-solid fa-rotate-right"></i> Reintentar
</button>
<a href="/" class="offline-btn secondary">
<i class="fa-solid fa-house"></i> Ir al Inicio
</a>
</div>
<div class="offline-tips">
<h4><i class="fa-solid fa-lightbulb"></i> ¿Qué puedes hacer?</h4>
<ul>
<li><i class="fa-solid fa-check"></i> Verifica tu conexión Wi-Fi o datos móviles</li>
<li><i class="fa-solid fa-check"></i> Reinicia tu router o módem</li>
<li><i class="fa-solid fa-check"></i> Intenta acceder a otras páginas web</li>
<li><i class="fa-solid fa-check"></i> Si el problema persiste, contacta a tu proveedor de internet</li>
</ul>
</div>
</div>
</body>

</html>`;

async function showOfflinePage() {
  return new Response(OFFLINE_HTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function getCacheName() {
  const { cacheName } = await getVersion();
  return cacheName;
}

/**
 * Estrategia Cache First - Para recursos estáticos
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cacheName = await getCacheName();
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return showOfflinePage();
  }
}

/**
 * Estrategia Network First - Para páginas HTML
 * Siempre fetch fresco, sin cache del browser
 */
async function networkFirst(request) {
  try {
    const freshRequest = new Request(request.url, {
      method: 'GET',
      headers: {},
      mode: 'cors',
      cache: 'no-store'
    });
    const networkResponse = await fetch(freshRequest);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || showOfflinePage();
  }
}

/**
 * Estrategia Stale-While-Revalidate - Para CSS/JS/Assets
 * Sirve cache inmediatamente pero actualiza en background
 */
async function staleWhileRevalidate(request) {
  const cacheName = await getCacheName();
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  }).catch(() => null);
  
  return cachedResponse || fetchPromise || showOfflinePage();
}

/**
 * Manejo de fetch
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // HTML requests - bypass SW cache completely
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request, { cache: 'reload' }));
    return;
  }
  
  // CSS, JS, imágenes, fuentes - Stale-While-Revalidate
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.url.includes('.css') ||
    request.url.includes('.js') ||
    request.url.includes('/assets/')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Otros recursos - Cache First
  event.respondWith(cacheFirst(request));
});

/**
 * Mensajes desde el cliente
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'VERSION_CHANGED') {
    console.log('[SW] Cliente reporta nueva versión:', event.data.version);
    getVersion().then(({ version, cacheName }) => {
      // Open new cache and clean old ones
      caches.open(cacheName).then(() => {
        return caches.keys();
      }).then((keys) => {
        const oldKeys = keys.filter((key) => {
          if (key === cacheName) return false;
          return key.startsWith(BASE_NAME);
        });
        return Promise.all(oldKeys.map((key) => {
          console.log('[SW] Eliminando cache:', key);
          return caches.delete(key);
        }));
      }).then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'RELOAD' });
          });
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    getCacheName().then((cacheName) => {
      caches.open(cacheName).then((cache) => {
        cache.addAll(urls).then(() => {
          console.log('[SW] URLs cacheadas:', urls);
        });
      });
    });
  }
});
