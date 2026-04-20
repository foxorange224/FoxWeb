'use strict';

// =============================================================================
// FOXWEB MAIN CORE - Configuración, Estado e Inicialización
// Este archivo contiene la funcionalidad principal necesaria para el funcionamiento básico
// =============================================================================

// =============================================================================
// CONFIGURACIÓN Y ESTADO
// =============================================================================

const CONFIG = {
    appName: 'FoxWeb',
    defaultTheme: 'dark',
    enableAnimations: false,
    cacheEnabled: true,
    maxRecentItems: 10,
    dbVersionKey: 'foxweb_db_version_1',
    blogVersionKey: 'foxweb_blog_version_1',
    checkInterval: 30000 // Verificar cada 30 segundos
};

const VALID_TABS = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'];

const CATEGORY_KEYS = ['programas', 'sistemas', 'juegos', 'extras', 'apks'];

const TABS_CONFIG = [
    { key: 'programas', id: 'Programas' },
    { key: 'sistemas', id: 'Sistemas' },
    { key: 'juegos', id: 'Juegos' },
    { key: 'extras', id: 'Extras' },
    { key: 'apks', id: 'APKs' }
];

const ALLOWED_SUGGESTION_DOMAINS = [
    'mediafire.com', 'drive.google.com', 'mega.nz', 'dropbox.com',
    'github.com', 'sourceforge.net', 'gitlab.com'
];

const AppState = {
    currentTab: 'Programas',
    currentSearch: '',
    currentFilter: 'all',
    theme: CONFIG.defaultTheme,
    notifications: [],
    recentItems: [],
    favorites: new Set(),
    isLoading: true,
    isOffline: false,
    voiceSearchSupported: false,
    dbData: null,
    firstVisit: true,
    lastScrollTop: 0,
    searchActive: false,
    dbHash: null,
    lastUpdateCheck: null,
    isHashNavigation: true,
    previousHash: '',
    navigationLock: false,
    currentView: 'cards', // 'cards' or 'compact'
    initialPage: null // Página inicial desde query parameter
};

/** Referencias cacheadas al DOM (se rellenan en primer uso) */
let navElement = null;
let searchSectionElement = null;

// =============================================================================
// INICIALIZACIÓN GLOBAL
// =============================================================================

window.addEventListener('error', function (e) {
    console.error('Error global capturado:', e.error);
    if (e.error && e.error.message && e.error.message.includes('FoxWebDB')) {
        showErrorScreen('Error crítico: No se pudo cargar la base de datos. Por favor, recarga la página.');
    }
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Promesa rechazada no manejada:', e.reason);
    showToast('Error inesperado en la aplicación', 'error');
});

document.addEventListener('DOMContentLoaded', function () {
    try {
        // Check if we're on the main page (downloads)
        const isMainPage = document.getElementById('grid-Programas') !== null;
        
        AppState.hasInitialHash = window.location.search !== '' || window.location.hash !== '';

        checkFirstVisit();
        checkBrowserFeatures();
        initTheme();
        initEventListeners();
        loadAppState();
        loadNotifications();
        loadFavorites();
        initUIComponents();
        initAccessibility();
        initScrollHideNav();

        // Only initialize main app if we're on the main page
        if (isMainPage) {
            if (typeof FoxWebDB !== 'undefined') {
                AppState.dbData = FoxWebDB;
                initApp();
            } else {
                loadDataScript();
            }
        } else {
            // For other pages (like blog), still initialize notification center
            loadNotifications();
            initNotificationCenter();
        }

        if (AppState.firstVisit) {
            setTimeout(() => {
                showToast('Bienvenido a FoxWeb', 'info');
                localStorage.setItem('foxweb_first_visit', 'false');
                AppState.firstVisit = false;
            }, 1000);
        }
    } catch (error) {
        console.error('Error crítico en DOMContentLoaded:', error);
        showErrorScreen('Error crítico al cargar la aplicación. Por favor, recarga la página.');
    }
});

// =============================================================================
// VISITA Y NAVEGADOR
// =============================================================================

function checkFirstVisit() {
    const firstVisit = localStorage.getItem('foxweb_first_visit');
    if (firstVisit === 'false') {
        AppState.firstVisit = false;
    }
    
    // Check for returning user - show welcome back notification
    const lastVisit = localStorage.getItem('foxweb_last_visit');
    const now = Date.now();
    
    if (lastVisit) {
        const timeSinceLastVisit = now - parseInt(lastVisit);
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours
        
        // If user hasn't visited in more than 1 day, show welcome back
        if (timeSinceLastVisit > oneDay) {
            setTimeout(() => {
                showToast('¡Bienvenido de nuevo! Explora el nuevo contenido.', 'info');
            }, 2000);
        }
    }
    
    localStorage.setItem('foxweb_last_visit', now.toString());
}

function checkBrowserFeatures() {
    AppState.voiceSearchSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    AppState.isOffline = !navigator.onLine;
    if (AppState.isOffline) {
        showToast('Estás sin conexión. Algunas funciones pueden no estar disponibles.', 'warning');
    }
}

function loadModals() {
    fetch('/database/modals.html?v=' + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const modalsContainer = document.getElementById('modales-container');
            if (modalsContainer) {
                modalsContainer.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Error al cargar modals.html:', error);
            showToast('Error al cargar algunos componentes. Por favor, recarga la página.', 'error');
        });
}

// =============================================================================
// CARGA DE DATOS
// =============================================================================

function loadDataScript() {
    fetch('/database/data.json?v=' + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            AppState.dbData = data;
            updateCounters();
            initApp();
        })
        .catch(error => {
            console.error('Error al cargar o parsear data.json:', error);
            showErrorScreen('Error al cargar la Base de Datos. Por favor, recarga la página.');
        });
}
// Iconos por defecto por categoría
const DEFAULT_ICONS = {
    programas: 'fa-solid fa-cube',
    sistemas: 'fa-solid fa-desktop',
    juegos: 'fa-solid fa-gamepad',
    extras: 'fa-solid fa-star',
    apks: 'fa-solid fa-mobile-android'
};

// Normalizar datos con valores por defecto
function normalizeDataItem(item, category) {
    return {
        name: item.name || 'Sin título',
        icon: item.icon || DEFAULT_ICONS[category] || 'fa-solid fa-folder',
        info: item.info || 'Descripción no disponible',
        enlace: item.enlace || '#',
        modal: item.modal || null,
        badges: item.badges || []
    };
}

function normalizeAllData(dbData) {
    if (!dbData) return dbData;
    const normalized = {};
    CATEGORY_KEYS.forEach(category => {
        if (dbData[category] && Array.isArray(dbData[category])) {
            normalized[category] = dbData[category].map(item => normalizeDataItem(item, category));
        } else {
            normalized[category] = [];
        }
    });
    return normalized;
}

function initApp() {
    try {
        if (!AppState.dbData) {
            showErrorScreen('No se pudo cargar la base de datos. Por favor, recarga la página.');
            return;
        }
        // Normalizar datos antes de usar
        AppState.dbData = normalizeAllData(AppState.dbData);
        checkForNewContent();
        hideLoading();
        determineInitialTabFromHash();
        // Inicializar modos de vista antes de renderizar
        initAllViewModes();
        renderAllTabs();
        initSearch();
        loadModals();
        initModals();
        // Verificar modal en URL después de cargar modales
        checkUrlForModal();
        initNotificationCenter();
        initFloatingButtons();
        initSidebar();
        initCounters();
        // Iniciar verificación del blog
        initBlogCheck();
        AppState.isLoading = false;
        saveAppState();
    } catch (error) {
        console.error('Error crítico en initApp:', error);
        showErrorScreen('Error crítico al inicializar la aplicación. Por favor, recarga la página.');
    }
}

function determineInitialTabFromHash() {
    try {
        // Leer query parameters en lugar de hash
        const url = new URL(window.location.href);
        const tabParam = url.searchParams.get('tab');
        const pageParam = url.searchParams.get('page');
        
        console.log('[DEBUG] determineInitialTabFromHash - tabParam:', tabParam, 'pageParam:', pageParam);
        
        // Mapeo inverso: de valores de query a nombres de pestañas
        const QUERY_TAB_MAP = {
            'programs': 'Programas',
            'systems': 'Sistemas',
            'games': 'Juegos',
            'extras': 'Extras',
            'apks': 'APKs'
        };
        
        // Verificar si hay un tab válido en query parameters
        if (tabParam && QUERY_TAB_MAP[tabParam]) {
            AppState.currentTab = QUERY_TAB_MAP[tabParam];
            AppState.previousHash = AppState.currentTab;
            
            // Si hay un parámetro de página, guardarlo en AppState para usarlo después
            if (pageParam && !isNaN(parseInt(pageParam, 10))) {
                AppState.initialPage = parseInt(pageParam, 10);
                console.log('[DEBUG] determineInitialTabFromHash - AppState.initialPage establecido a:', AppState.initialPage);
            }
            return;
        }
        
        // Si no hay tab válido, usar 'Programas' por defecto
        AppState.currentTab = 'Programas';
        AppState.previousHash = 'Programas';
        
        // Si hay query parameters pero no son válidos, limpiar la URL
        if (tabParam) {
            if (history.replaceState) {
                history.replaceState(null, null, url.pathname);
            }
        }
    } catch (error) {
        console.error('Error determinando pestaña inicial:', error);
        AppState.currentTab = 'Programas';
        AppState.previousHash = 'Programas';
    }
}

// =============================================================================
// VERIFICACIÓN DE CONTENIDO NUEVO
// =============================================================================

function checkForNewContent() {
    if (!AppState.dbData) return;
    
    try {
        const currentHash = calculateDBHash(AppState.dbData);
        AppState.dbHash = currentHash;
        
        const savedHash = localStorage.getItem(CONFIG.dbVersionKey);
        
        // Primera vez: guardar el hash actual y los datos sin mostrar notificación
        if (!savedHash) {
            localStorage.setItem(CONFIG.dbVersionKey, currentHash);
            cacheDBData(AppState.dbData);
            console.log('Base de datos inicializada');
            return;
        }
        
        // Si el hash es diferente, verificar si hay contenido nuevo
        if (currentHash !== savedHash) {
            console.log('¡Se detectaron cambios en la base de datos!');
            
            const oldData = getCachedDBData();
            const newData = AppState.dbData;
            
            // Si no hay datos antiguos, no podemos detectar contenido nuevo
            if (!oldData) {
                localStorage.setItem(CONFIG.dbVersionKey, currentHash);
                cacheDBData(newData);
                console.log('No hay datos antiguos para comparar');
                return;
            }
            
            const changes = calculateContentChanges(oldData, newData);
            
            // Solo mostrar notificación si realmente hay contenido nuevo
            if (changes.totalNew > 0) {
                createNewContentNotification(changes);
                if (changes.totalNew === 1) {
                    showToast('¡Se ha agregado 1 nuevo contenido!', 'info');
                } else {
                    showToast(`¡Se han agregado ${changes.totalNew} nuevos contenidos!`, 'info');
                }
                // Mostrar notificación del navegador si está permitida
                console.log('Verificando notificaciones - Permission:', Notification.permission);
                if ('Notification' in window && Notification.permission === 'granted') {
                    console.log('Intentando mostrar notificación push...');
                    const notificationTitle = changes.totalNew === 1 ? 'Nuevo contenido en FoxWeb' : `${changes.totalNew} nuevos contenidos en FoxWeb`;
                    const notificationBody = changes.totalNew === 1 ? 'Se ha agregado 1 nuevo programa al catálogo.' : `Se han agregado ${changes.totalNew} nuevos programas al catálogo.`;
                    try {
                        const notif = new Notification(notificationTitle, {
                            body: notificationBody,
                            icon: '/assets/icon.webp',
                            badge: '/assets/icon.webp',
                            tag: 'new-content',
                            requireInteraction: false
                        });
                        console.log('Notificación mostrada exitosamente');
                    } catch (e) {
                        console.error('Error mostrando notificación:', e);
                    }
                } else if ('Notification' in window && Notification.permission === 'denied') {
                    console.log('Notificaciones denegadas por el usuario');
                }
                console.log('Nuevo contenido detectado:', changes);
            } else {
                console.log('Los cambios en la base de datos no son contenido nuevo (puede que se haya eliminado o modificado)');
            }
            
            // Actualizar el hash y la caché
            localStorage.setItem(CONFIG.dbVersionKey, currentHash);
            cacheDBData(newData);
        } else {
            console.log('La base de datos está actualizada');
        }
    } catch (error) {
        console.error('Error verificando contenido nuevo:', error);
    }
}

// =============================================================================
// VERIFICACIÓN DE CONTENIDO DEL BLOG
// =============================================================================

// Variable para almacenar los posts del blog cacheados
let cachedBlogPosts = null;

// Función para calcular el hash de los posts del blog
function calculateBlogHash(posts) {
    if (!posts || !Array.isArray(posts)) return '';
    try {
        return btoa(posts.length.toString());
    } catch (error) {
        return Date.now().toString();
    }
}

// Función para verificar si hay nuevo contenido en el blog
async function checkForNewBlogContent() {
    try {
        const response = await fetch('/database/posts.json?v=' + Date.now());
        if (!response.ok) throw new Error('Error fetching posts.json');
        
        const posts = await response.json();
        const currentHash = calculateBlogHash(posts);
        const savedHash = localStorage.getItem(CONFIG.blogVersionKey);
        
        // Primera vez: guardar el hash sin mostrar notificación
        if (!savedHash) {
            localStorage.setItem(CONFIG.blogVersionKey, currentHash);
            cachedBlogPosts = posts;
            console.log('Blog inicializado');
            return;
        }
        
        // Si hay un hash diferente, verificar si hay nuevos posts
        if (currentHash !== savedHash) {
            console.log('¡Se detectaron cambios en el blog!');
            
            // Contar posts nuevos (comparando títulos)
            const oldTitles = cachedBlogPosts ? cachedBlogPosts.map(p => p.title) : [];
            const newTitles = posts.map(p => p.title);
            const newPosts = newTitles.filter(t => !oldTitles.includes(t));
            
            if (newPosts.length > 0) {
                // Crear notificación de nuevo contenido del blog
                const notification = {
                    id: Date.now(),
                    type: 'info',
                    title: '¡Nuevo artículo en el Blog!',
                    message: newPosts.length === 1 
                        ? `Se ha publicado: "${newPosts[0]}"`
                        : `Se han publicado ${newPosts.length} nuevos artículos`,
                    date: new Date().toISOString(),
                    read: false
                };
                
                AppState.notifications.unshift(notification);
                if (AppState.notifications.length > 50) {
                    AppState.notifications = AppState.notifications.slice(0, 50);
                }
                saveNotifications();
                updateNotificationBadge();
                
                showToast(newPosts.length === 1 
                    ? '¡Nuevo artículo en el Blog!' 
                    : `¡${newPosts.length} nuevos artículos en el Blog!`, 'info');
                
                // Mostrar notificación del navegador si está permitida
                if ('Notification' in window && Notification.permission === 'granted') {
                    const blogNotificationTitle = newPosts.length === 1 ? 'Nuevo artículo en el Blog de FoxWeb' : `${newPosts.length} nuevos artículos en el Blog de FoxWeb`;
                    const blogNotificationBody = newPosts.length === 1 ? `Se ha publicado: "${newPosts[0]}"` : `Se han publicado ${newPosts.length} nuevos artículos.`;
                    new Notification(blogNotificationTitle, {
                        body: blogNotificationBody,
                        icon: '/assets/icon.webp',
                        badge: '/assets/icon.webp',
                        tag: 'new-blog-content',
                        requireInteraction: false
                    });
                }
                
                console.log('Nuevos posts detectados:', newPosts);
            }
            
            localStorage.setItem(CONFIG.blogVersionKey, currentHash);
            cachedBlogPosts = posts;
        }
    } catch (error) {
        console.error('Error verificando contenido del blog:', error);
    }
}

// Función para iniciar la verificación periódica del blog
function initBlogCheck() {
    // Verificar inmediatamente
    checkForNewBlogContent();
    
    // Verificar cada intervalo configurado
    setInterval(checkForNewBlogContent, CONFIG.checkInterval);
}

function calculateDBHash(dbData) {
    if (!dbData) return '';
    try {
        // Solo usamos los conteos de elementos, sin timestamp para evitar falsos positivos
        const hashData = {
            programas: dbData.programas ? dbData.programas.length : 0,
            sistemas: dbData.sistemas ? dbData.sistemas.length : 0,
            juegos: dbData.juegos ? dbData.juegos.length : 0,
            extras: dbData.extras ? dbData.extras.length : 0,
            apks: dbData.apks ? dbData.apks.length : 0
        };
        return btoa(JSON.stringify(hashData));
    } catch (error) {
        return Date.now().toString();
    }
}

function getCachedDBData() {
    try {
        const cached = localStorage.getItem(`${CONFIG.dbVersionKey}_data`);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Error obteniendo datos cacheados:', error);
        return null;
    }
}

function cacheDBData(dbData) {
    try {
        const cacheData = {};
        CATEGORY_KEYS.forEach(key => {
            cacheData[key] = dbData[key] ? dbData[key].map(item => item.name) : [];
        });
        cacheData.timestamp = new Date().toISOString();
        localStorage.setItem(`${CONFIG.dbVersionKey}_data`, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error guardando caché de datos:', error);
    }
}

function calculateContentChanges(oldData, newData) {
    const changes = { programas: 0, sistemas: 0, juegos: 0, extras: 0, apks: 0, totalNew: 0 };
    if (!oldData) return changes;

    CATEGORY_KEYS.forEach(category => {
        if (!oldData[category] || !newData[category]) return;
        const oldNames = oldData[category] || [];
        const newNames = newData[category] ? newData[category].map(item => item.name) : [];
        const newItems = newNames.filter(name => !oldNames.includes(name));
        changes[category] = newItems.length;
        changes.totalNew += newItems.length;
    });
    return changes;
}

function createNewContentNotification(changes) {
    if (changes.totalNew === 0) return;

    let message, title;

    if (changes.totalNew === 1) {
        const categoryWithChange = CATEGORY_KEYS.find(cat => changes[cat] > 0);
        const categoryNames = { programas: 'programa', sistemas: 'sistema', juegos: 'juego', extras: 'extra', apks: 'APK' };
        const categoryName = categoryNames[categoryWithChange] || 'contenido';
        title = '¡Nuevo contenido disponible!';
        message = `Se ha agregado 1 nuevo ${categoryName}. ¡Échale un vistazo!`;
    } else {
        title = '¡Nuevos contenidos disponibles!';
        const changeList = [];
        if (changes.programas > 0) changeList.push(`${changes.programas} programa${changes.programas > 1 ? 's' : ''}`);
        if (changes.sistemas > 0) changeList.push(`${changes.sistemas} sistema${changes.sistemas > 1 ? 's' : ''}`);
        if (changes.juegos > 0) changeList.push(`${changes.juegos} juego${changes.juegos > 1 ? 's' : ''}`);
        if (changes.extras > 0) changeList.push(`${changes.extras} extra${changes.extras > 1 ? 's' : ''}`);
        if (changes.apks > 0) changeList.push(`${changes.apks} APK${changes.apks > 1 ? 's' : ''}`);
        message = changeList.length > 0 ? `Se han agregado ${changeList.join(', ')}.` : `Se han agregado ${changes.totalNew} nuevos contenidos.`;
    }

    const newNotification = {
        id: Date.now(),
        type: 'info',
        title,
        message,
        date: new Date().toISOString(),
        read: false
    };
    AppState.notifications.unshift(newNotification);
    if (AppState.notifications.length > 50) {
        AppState.notifications = AppState.notifications.slice(0, 50);
    }
    saveNotifications();
    updateNotificationBadge();
}

// =============================================================================
// CONTADOR DE ELEMENTOS
// =============================================================================

function updateCounters() {
    if (!AppState.dbData) return;
    try {
        CATEGORY_KEYS.forEach(category => {
            const count = AppState.dbData[category] ? AppState.dbData[category].length : 0;
            const countElement = document.getElementById(`count-${category.charAt(0).toUpperCase() + category.slice(1)}`);
            if (countElement) {
                countElement.textContent = `(${count})`;
            }
        });
    } catch (error) {
        console.error('Error actualizando contadores:', error);
    }
}

function initCounters() {
    updateCounters();
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function initEventListeners() {
    try {
        // Evento de online/offline
        window.addEventListener('online', function() {
            AppState.isOffline = false;
            showToast('Conexión restaurada', 'success');
        });
        
        window.addEventListener('offline', function() {
            AppState.isOffline = true;
            showToast('Sin conexión. Algunas funciones pueden no estar disponibles.', 'warning');
        });
        
        // Evento de popstate para navegación con query parameters
        window.addEventListener('popstate', function() {
            const url = new URL(window.location.href);
            const tabParam = url.searchParams.get('tab');
            
            // Mapeo inverso: de valores de query a nombres de pestañas
            const QUERY_TAB_MAP = {
                'programs': 'Programas',
                'systems': 'Sistemas',
                'games': 'Juegos',
                'extras': 'Extras',
                'apks': 'APKs'
            };
            
            if (tabParam && QUERY_TAB_MAP[tabParam]) {
                const tabName = QUERY_TAB_MAP[tabParam];
                if (tabName !== AppState.currentTab) {
                    openTab(tabName);
                }
            }
        });
        
        // View toggle buttons
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            const buttons = toggle.querySelectorAll('.view-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const view = this.dataset.view;
                    const tabContent = this.closest('.tab-content');
                    if (tabContent) {
                        setViewMode(tabContent.id, view);
                    }
                });
            });
        });
        
    } catch (error) {
        console.error('Error inicializando event listeners:', error);
    }
}

// =============================================================================
// VIEW MODE - Cambio entre vista de tarjetas y compacta
// =============================================================================

function setViewMode(tabId, viewMode) {
    try {
        const tabContent = document.getElementById(tabId);
        if (!tabContent) return;
        
        const grid = tabContent.querySelector('.content-grid');
        if (!grid) return;
        
        // Update state
        AppState.currentView = viewMode;
        
        // Update grid class
        if (viewMode === 'compact') {
            grid.classList.add('compact-view');
        } else {
            grid.classList.remove('compact-view');
        }
        
        // Update toggle buttons
        const toggle = tabContent.querySelector('.view-toggle');
        if (toggle) {
            const buttons = toggle.querySelectorAll('.view-btn');
            buttons.forEach(btn => {
                if (btn.dataset.view === viewMode) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-pressed', 'true');
                } else {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                }
            });
        }
        
        // Re-render the tab with new view mode
        renderTab(tabId, AppState.dbData[getCategoryKey(tabId)]);
        
        // Save preference
        localStorage.setItem('foxweb_view_mode_' + tabId, viewMode);
        
    } catch (error) {
        console.error('Error cambiando modo de vista:', error);
    }
}

function getCategoryKey(tabId) {
    const mapping = {
        'Programas': 'programas',
        'Sistemas': 'sistemas',
        'Juegos': 'juegos',
        'Extras': 'extras',
        'APKs': 'apks'
    };
    return mapping[tabId] || tabId.toLowerCase();
}

function initViewMode(tabId) {
    try {
        // Load saved preference per tab or use global preference from welcome page
        const savedView = localStorage.getItem('foxweb_view_mode_' + tabId);
        const globalView = localStorage.getItem('foxweb_view'); // From welcome page
        const viewMode = savedView || globalView || 'cards';
        setViewMode(tabId, viewMode);
    } catch (error) {
        console.error('Error inicializando modo de vista:', error);
    }
}

function initAllViewModes() {
    VALID_TABS.forEach(tabId => {
        initViewMode(tabId);
    });
}

// =============================================================================
// ACCESIBILIDAD
// =============================================================================

// Función showToast de respaldo (se usa antes de que main-features.js cargue)
// Si la función real está disponible en window, la usa; si no, hace console.log
function showToast(message, type = 'info', persistent) {
    if (window.showToast && window.showToast !== showToast) {
        window.showToast(message, type, persistent);
    } else {
        // Función de respaldo simple
        console.log(`[Toast ${type}]: ${message}`);
    }
}

// Función para cargar mensajes de información
window.loadInfoMessage = function(page) {
    fetch('/database/info/' + page + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.msg && data.msg !== '' && data.type && data.type !== 'none') {
                // Show toast persistently (no auto-close)
                showToast(data.msg, data.type, true);
            }
        })
        .catch(function() {});
};

// Función showErrorScreen de respaldo
function showErrorScreen(message) {
    if (typeof window.showErrorScreen === 'function') {
        window.showErrorScreen(message);
    } else {
        console.error(`[Error Screen]: ${message}`);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <h1 style="color: #ff4500;">Error Crítico</h1>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff4500; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
    }
}

// Función closeErrorScreen de respaldo
function closeErrorScreen() {
    if (typeof window.closeErrorScreen === 'function') {
        window.closeErrorScreen();
    } else {
        const errorScreen = document.getElementById('errorScreen');
        if (errorScreen) {
            errorScreen.classList.remove('show');
        }
    }
}

// Constantes para teclas de acceso rápido
const ACCESSIBILITY_KEYS = {
    HOME: 'h',
    SEARCH: '/',
    ESCAPE: 'Escape'
};

function initAccessibility() {
    try {
        // Mejorar navegación por teclado
        document.addEventListener('keydown', handleAccessibilityKeyDown);
        
        // Asegurar que los skip links funcionen
        initSkipLinks();
        
        // Agregar roles faltantes a elementos interactivos
        enhanceInteractiveRoles();
        
        console.log('Sistema de accesibilidad inicializado');
    } catch (error) {
        console.error('Error inicializando accesibilidad:', error);
    }
}

// Manejador de teclas de acceso rápido (Keyboard Shortcuts)
function handleAccessibilityKeyDown(e) {
    // No interceptar si el foco está en un input o textarea
    const tagName = e.target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
    }
    
    // No interceptar si hay modificadores (excepto para Escape)
    if (e.key !== ACCESSIBILITY_KEYS.ESCAPE && (e.altKey || e.ctrlKey || e.metaKey)) {
        return;
    }
    
    // Tecla Escape - cerrar modales o notificaciones
    if (e.key === ACCESSIBILITY_KEYS.ESCAPE) {
        const openModal = document.querySelector('.modal[style*="display: flex"]');
        if (openModal) {
            closeModal(openModal.id);
            e.preventDefault();
            return;
        }
        
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter && notificationCenter.getAttribute('aria-hidden') !== 'true') {
            closeNotificationCenter();
            e.preventDefault();
            return;
        }
    }
    
    // Tecla / - enfocar búsqueda
    if (e.key === ACCESSIBILITY_KEYS.SEARCH) {
        const searchInput = document.getElementById('mainSearch');
        if (searchInput) {
            searchInput.focus();
            e.preventDefault();
        }
    }
    
    // Tecla h - ir a inicio (home)
    if (e.key === ACCESSIBILITY_KEYS.HOME) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
            e.preventDefault();
        }
    }
}

// Inicializar skip links para navegación por teclado
function initSkipLinks() {
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) return;
    
    // Hacer el skip link visible cuando reciba foco
    skipLink.addEventListener('focus', function() {
        this.style.cssText = "position:absolute;top:0;left:0;z-index:9999;padding:10px 20px;background:var(--primary, #FF4500);color:white;text-decoration:none;font-weight:bold;";
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.cssText = '';
    });
}

// Mejorar roles ARIA en elementos interactivos
function enhanceInteractiveRoles() {
    // Asegurar que los botones flotantes tengan roles correctos
    const floatingBtns = document.querySelectorAll('.floating-btn');
    floatingBtns.forEach(btn => {
        if (!btn.getAttribute('role')) {
            btn.setAttribute('role', 'button');
        }
    });
    
    // Asegurar que los grids de contenido tengan aria-label
    const contentGrids = document.querySelectorAll('.content-grid');
    contentGrids.forEach(grid => {
        if (!grid.getAttribute('aria-label')) {
            const categoryName = grid.id.replace('grid-', '');
            grid.setAttribute('aria-label', `Contenido de ${categoryName}`);
        }
    });
}

// Función auxiliar para announcement de cambios dinámicos a lectores de pantalla
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function initUIComponents() {
    updateNotificationBadge();
    
    // Inicializar sistema de paginación si está disponible
    if (window.PaginationSystem && typeof window.PaginationSystem.init === 'function') {
        try {
            window.PaginationSystem.init();
            console.log('[UI] Sistema de paginación inicializado');
        } catch (error) {
            console.error('[UI] Error inicializando paginación:', error);
        }
    }
}

// =============================================================================
// FAVORITOS
// =============================================================================

function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('foxweb_favorites')) || [];
        AppState.favorites = new Set(favorites);
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        AppState.favorites = new Set();
    }
}

function saveFavorites() { 
    try { 
        const favoritesArray = Array.from(AppState.favorites); 
        localStorage.setItem('foxweb_favorites', JSON.stringify(favoritesArray)); 
    } catch (error) { 
        console.error('Error guardando favoritos:', error); 
    } 
}

function toggleFavorite(itemId) {
    try {
        if (AppState.favorites.has(itemId)) { 
            AppState.favorites.delete(itemId); 
            showToast('Removido de favoritos', 'info'); 
        } else { 
            AppState.favorites.add(itemId); 
            showToast('Agregado a favoritos', 'success'); 
        }
        updateFavoriteIconForItem(itemId); 
        saveFavorites(); 
        saveAppState();
    } catch (error) { 
        console.error('Error alternando favorito:', error); 
        showToast('Error al actualizar favoritos', 'error'); 
    }
}

function updateFavoriteIconForItem(itemId) { 
    try { 
        const btn = document.querySelector(`.content-card[data-id="${itemId}"] .card-action-btn:first-child`); 
        if (!btn) return; 
        updateFavoriteIcon(btn, itemId); 
    } catch (error) { 
        console.error('Error actualizando icono de favorito:', error); 
    } 
}

function updateFavoriteIcon(button, itemId) { 
    try { 
        const icon = button.querySelector('i'); 
        if (!icon) return; 
        const isFavorite = AppState.favorites.has(itemId); 
        icon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'; 
        icon.style.color = isFavorite ? '#ff4757' : ''; 
    } catch (error) { 
        console.error('Error actualizando icono:', error); 
    } 
}

function copyItemLink(itemId) {
    try {
        const item = findItemById(itemId); 
        if (!item) { 
            showToast('No se pudo encontrar el item', 'error'); 
            return; 
        }
        
        let urlToCopy = item.enlace || '';
        
        if (item.modal && item.modal !== 'null') { 
            showToast('Este contenido no tiene enlace directo para copiar', 'warning'); 
            return; 
        } 
        
        if (!urlToCopy || urlToCopy === '#') { 
            showToast('Este item no tiene enlace para copiar', 'warning'); 
            return; 
        }
        
        if (urlToCopy.startsWith('/redirect?url=')) {
            urlToCopy = decodeURIComponent(urlToCopy.replace('/redirect?url=', ''));
        }
        
        navigator.clipboard.writeText(urlToCopy).then(() => showToast('Enlace copiado: ' + urlToCopy, 'success')).catch(err => {
            console.error('Error copiando al portapapeles:', err); 
            const textArea = document.createElement('textarea'); 
            textArea.value = urlToCopy; 
            document.body.appendChild(textArea); 
            textArea.select(); 
            try { 
                document.execCommand('copy'); 
                showToast('Enlace copiado: ' + urlToCopy, 'success'); 
            } catch (e) { 
                showToast('Error copiando enlace', 'error'); 
            }
            document.body.removeChild(textArea);
        });
    } catch (error) { 
        console.error('Error copiando enlace:', error); 
        showToast('Error al copiar enlace', 'error'); 
    } 
}

function findItemById(itemId) {
    try {
        if (!AppState.dbData) return null;
        const [category, indexStr] = itemId.split('_');
        if (!CATEGORY_KEYS.includes(category)) return null;
        const categoryData = AppState.dbData[category];
        const index = parseInt(indexStr, 10);
        if (!categoryData || !categoryData[index]) return null;
        return categoryData[index];
    } catch (error) {
        console.error('Error buscando item:', error);
        return null;
    }
}

// =============================================================================
// TEMA
// =============================================================================

function initTheme() {
    try {
        const savedTheme = localStorage.getItem('foxweb_theme') || CONFIG.defaultTheme;
        AppState.theme = savedTheme; // Sync AppState with localStorage
        setTheme(savedTheme);
    } catch (error) {
        console.error('Error inicializando tema:', error);
    }
}

function toggleTheme() { 
    try { 
        // Use ThemeManager from app-init.js if available, otherwise use local logic
        if (typeof window.FoxWeb !== 'undefined' && window.FoxWeb.theme) {
            window.FoxWeb.theme.toggle();
        } else {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        }
    } catch (error) { 
        console.error('Error alternando tema:', error); 
    } 
}

function setTheme(theme) {
    try {
        AppState.theme = theme; 
        document.documentElement.setAttribute('data-theme', theme); 
        localStorage.setItem('foxweb_theme', theme); 
        
        // Sync icons using ThemeManager if available
        if (typeof window.FoxWeb !== 'undefined' && window.FoxWeb.theme) {
            window.FoxWeb.theme.syncIcons();
        } else {
            // Fallback to local logic
            const themeToggle = document.getElementById('themeToggle'); 
            if (themeToggle) { 
                const icons = themeToggle.querySelectorAll('i'); 
                try {
                    if (icons && icons.length >= 2) {
                        if (icons[0]) icons[0].style.display = theme === 'dark' ? 'inline-block' : 'none'; 
                        if (icons[1]) icons[1].style.display = theme === 'dark' ? 'none' : 'inline-block'; 
                    } else if (icons && icons.length === 1 && icons[0]) {
                        icons[0].className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
                    }
                } catch (iconErr) {}
            }
        }
    } catch (error) { 
        console.error('Error estableciendo tema:', error); 
    } 
}

// =============================================================================
// NOTIFICACIONES
// =============================================================================

const DEFAULT_NOTIFICATIONS = [
    { id: 1, type: 'info', title: '🎉 Bienvenido a FoxWeb', message: 'Gracias por visitar nuestro centro de descargas. ¡Explora nuestro contenido!', date: new Date().toISOString(), read: false },
    { id: 2, type: 'success', title: '📦 Contenido disponible', message: 'Explora nuestro catálogo con 15 APKs y 17 juegos disponibles.', date: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: 3, type: 'info', title: '💡 Contraseña importante', message: 'Recuerda usar la contraseña: foxorange224', date: new Date(Date.now() - 7200000).toISOString(), read: false }
];

function loadNotifications() {
    try {
        const saved = localStorage.getItem('foxweb_notifications');
        // Si no hay notificaciones guardadas o las notificaciones existentes no tienen el contenido nuevo, usar las predeterminadas
        if (!saved) {
            AppState.notifications = DEFAULT_NOTIFICATIONS.slice();
        } else {
            const parsedNotifications = JSON.parse(saved);
            // Verificar si las notificaciones contienen el contenido nuevo
            const hasNewContent = parsedNotifications.some(n => n.message && n.message.includes('15 APKs'));
            if (!hasNewContent && parsedNotifications.length < 3) {
                AppState.notifications = DEFAULT_NOTIFICATIONS.slice();
            } else {
                AppState.notifications = parsedNotifications;
            }
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        AppState.notifications = DEFAULT_NOTIFICATIONS.slice();
    }
}

function saveNotifications() {
    try {
        localStorage.setItem('foxweb_notifications', JSON.stringify(AppState.notifications));
    } catch (error) {
        console.error('Error guardando notificaciones:', error);
    }
}

// Rutas donde están habilitadas las notificaciones
const NOTIFICATION_ENABLED_ROUTES = ['/', '/downloads', '/blog'];

function isNotificationRouteEnabled() {
    const path = window.location.pathname;
    // Normalizar el path: quitar /index.html y / al final si existe
    let normalizedPath = path;
    if (normalizedPath.endsWith('/index.html')) {
        normalizedPath = normalizedPath.substring(0, normalizedPath.length - 11);
    }
    if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.substring(0, normalizedPath.length - 1);
    }
    
    // Verificar si la ruta actual coincide exactamente con las permitidas
    return NOTIFICATION_ENABLED_ROUTES.some(route => {
        // Coincidencia exacta
        return normalizedPath === route || 
               normalizedPath === route + '/';
    });
}

function initNotificationCenter() { 
    // Verificar si las notificaciones están habilitadas para esta ruta
    if (!isNotificationRouteEnabled()) {
        console.log('Notificaciones deshabilitadas para esta página');
        return;
    }
    
    // Usar MutationObserver para esperar a que el botón de notificaciones esté disponible
    // Esto es necesario porque el panel se carga de forma asíncrona
    const observer = new MutationObserver(function(mutations, obs) {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationCenter = document.getElementById('notificationCenter');
        
        if (notificationBtn && notificationCenter) {
            obs.disconnect();
            setupNotificationCenter(notificationBtn, notificationCenter);
        }
    });
    
    // Observar el body para detectar cuando se agrega el botón
    observer.observe(document.body, { childList: true, subtree: true });
    
    // También intentar inmediatamente por si ya está cargado
    setTimeout(function() {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationCenter = document.getElementById('notificationCenter');
        
        if (notificationBtn && notificationCenter) {
            observer.disconnect();
            setupNotificationCenter(notificationBtn, notificationCenter);
        }
    }, 100);
}

function setupNotificationCenter(notificationBtn, notificationCenter) {
    try {
        // Eliminar listeners anteriores para evitar duplicados
        notificationBtn.removeEventListener('click', toggleNotificationCenter);
        notificationBtn.addEventListener('click', toggleNotificationCenter);
        
        // Cerrar al hacer clic fuera
        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);
        
        console.log('Centro de notificaciones inicializado correctamente');
        
        // Actualizar el badge después de que el panel esté cargado
        updateNotificationBadge();
    } catch (error) {
        console.error('Error inicializando centro de notificaciones:', error);
    }
}

function handleOutsideClick(e) {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationCenter = document.getElementById('notificationCenter');
    
    if (!notificationCenter || !notificationBtn) return;
    
    if (!notificationCenter.contains(e.target) && !notificationBtn.contains(e.target)) {
        closeNotificationCenter();
    }
}

function toggleNotificationCenter() { 
    try { 
        const center = document.getElementById('notificationCenter'); 
        const btn = document.getElementById('notificationBtn');
        
        if (!center || !btn) {
            console.error('No se encontraron los elementos del centro de notificaciones');
            return; 
        }
        
        // Solicitar permiso de notificaciones del navegador si no está concedido
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    showToast('¡Notificaciones habilitadas! Te avisaremos cuando haya nuevo contenido.', 'success');
                }
            });
        }
        
        // Verificar si el panel está abierto usando la clase 'show' o el estilo
        const isOpen = center.classList.contains('show') || center.style.display === 'flex';
        
        if (isOpen) { 
            closeNotificationCenter(); 
        } else { 
            openNotificationCenter(); 
        } 
    } catch (error) { 
        console.error('Error alternando centro de notificaciones:', error); 
    } 
}

function openNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (!center) return;

    center.style.display = 'flex'; // Aseguramos que exista para el navegador
    center.inert = false;
    center.removeAttribute('aria-hidden');

    // Pequeño delay para la animación
    setTimeout(() => {
        center.classList.add('show');
        center.querySelector('.notification-close')?.focus();
    }, 10);

    markNotificationsAsRead();
    renderNotifications();
}

function closeNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (!center) return;
    
    // Mover el foco fuera del centro de notificaciones antes de ocultarlo
    const notificationBtn = document.querySelector('.notification-btn, [aria-label*="Notificaci"]');
    if (notificationBtn) {
        notificationBtn.focus();
    } else {
        // Si no hay botón de notificaciones, ir al main
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.focus();
    }
    
    center.classList.remove('show');
    
    // Quitar foco y aria-hidden antes de inert para evitar el error de accesibilidad
    center.removeAttribute('aria-hidden');
    center.inert = true;

    // Al terminar la transición, lo quitamos del flujo para liberar los clics
    setTimeout(() => {
        if (!center.classList.contains('show')) {
            center.style.display = 'none';
            center.setAttribute('aria-hidden', 'true');
        }
    }, 300);
}

function markNotificationsAsRead() { 
    try { 
        AppState.notifications.forEach(notif => { notif.read = true; }); 
        updateNotificationBadge(); 
        saveNotifications(); 
    } catch (error) { 
        console.error('Error marcando notificaciones como leídas:', error); 
    } 
}

function updateNotificationBadge() { 
    try { 
        const badge = document.querySelector('.notification-badge'); 
        if (!badge) return; 
        const unreadCount = AppState.notifications.filter(n => !n.read).length; 
        badge.textContent = unreadCount; 
        badge.style.display = unreadCount > 0 ? 'flex' : 'none'; 
    } catch (error) { 
        console.error('Error actualizando badge de notificaciones:', error); 
    } 
}

function renderNotifications() {
    const container = document.querySelector('.notification-list'); 
    if (!container) return; 
    try {
        container.innerHTML = ''; 
        if (AppState.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty" role="status">
                    <i class="fa-solid fa-bell-slash" aria-hidden="true"></i>
                    <p>No hay notificaciones</p>
                </div>
            `; 
            return;
        }
        const sortedNotifications = [...AppState.notifications].sort((a, b) => new Date(b.date) - new Date(a.date)); 
        sortedNotifications.forEach(notification => { 
            const notificationEl = createNotificationElement(notification); 
            container.appendChild(notificationEl); 
        });
    } catch (error) {
        console.error('Error renderizando notificaciones:', error); 
        container.innerHTML = `
            <div class="notification-empty" role="status">
                <i class="fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                <p>Error cargando notificaciones</p>
            </div>
        `;
    }
}

function createNotificationElement(notification) {
    try {
        const div = document.createElement('div'); 
        div.className = `notification-item ${notification.read ? '' : 'new'}`; 
        div.setAttribute('role', 'listitem'); 
        const icon = getNotificationIcon(notification.type); 
        const time = formatNotificationTime(notification.date); 
        div.innerHTML = `
            <i class="notification-icon ${icon.class}" style="color: ${icon.color};" aria-hidden="true"></i>
            <div class="notification-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
                <small>${time}</small>
            </div>
        `; 
        return div;
    } catch (error) { 
        console.error('Error creando elemento de notificación:', error); 
        const div = document.createElement('div'); 
        div.className = 'notification-item'; 
        div.innerHTML = '<p>Error cargando notificación</p>'; 
        return div; 
    }
}

function getNotificationIcon(type) { 
    const icons = { 
        info: { class: 'fa-solid fa-info-circle', color: '#007bff' }, 
        success: { class: 'fa-solid fa-check-circle', color: '#28a745' }, 
        warning: { class: 'fa-solid fa-exclamation-triangle', color: '#ffc107' }, 
        error: { class: 'fa-solid fa-times-circle', color: '#dc3545' } 
    }; 
    return icons[type] || icons.info; 
}

function formatNotificationTime(dateString) { 
    try { 
        const date = new Date(dateString); 
        const now = new Date(); 
        const diffMs = now - date; 
        const diffMins = Math.floor(diffMs / 60000); 
        const diffHours = Math.floor(diffMs / 3600000); 
        const diffDays = Math.floor(diffMs / 86400000); 
        
        // Mostrar hora local si es reciente (menos de 24 horas)
        if (diffMins < 60) {
            if (diffMins < 1) return 'Ahora mismo';
            if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
            return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        }
        
        if (diffHours < 24) {
            return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        }
        
        if (diffDays < 7) {
            return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
        }
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (error) { 
        console.error('Error formateando tiempo:', error); 
        return ''; 
    } 
}

// =============================================================================
// EXPORTAR API PÚBLICA
// =============================================================================

window.FoxWebCore = {
    state: AppState,
    config: CONFIG,
    // Funciones disponibles
    toggleTheme,
    showToast,
    copyItemLink,
    toggleFavorite,
    findItemById,
    showErrorScreen,
    closeErrorScreen
};
