// ============================================================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ============================================================================

const CONFIG = {
    appName: 'FoxWeb',
    version: '1.0.3',
    defaultTheme: 'dark',
    enableAnimations: false,
    cacheEnabled: true,
    maxRecentItems: 10,
    dbVersionKey: 'foxweb_db_version_1' // Clave única para esta versión de DB
};

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
    dbHash: null, // Para control de cambios en la base de datos
    lastUpdateCheck: null
};

// ============================================================================
// MANEJO DE RUTAS SPA - AGREGAR AL INICIO DEL ARCHIVO
// ============================================================================

/**
 * Configura el manejo de rutas para SPA
 */
function initSPARouting() {
    // Interceptar clics en enlaces internos
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        const isInternal = href && href.startsWith('/') && !href.startsWith('//');
        const isSameOrigin = link.hostname === window.location.hostname;
        
        if (isInternal && isSameOrigin) {
            e.preventDefault();
            navigateTo(href);
        }
    });
    
    // Manejar navegación con botones atrás/adelante
    window.addEventListener('popstate', function() {
        handleRouteChange();
    });
    
    // Manejar carga inicial
    window.addEventListener('load', function() {
        handleRouteChange();
    });
}

/**
 * Navega a una ruta específica
 */
function navigateTo(path) {
    const route = path.replace(/^\//, '').split('/')[0] || '';
    const routeMap = {
        'programas': 'Programas',
        'sistemas': 'Sistemas',
        'juegos': 'Juegos',
        'extras': 'Extras',
        'apks': 'APKs',
        'apps': 'Programas',
        '': 'Programas'
    };
    
    const tabName = routeMap[route] || 'Programas';
    
    if (AppState.currentTab !== tabName) {
        openTab(tabName);
    }
    
    // Actualizar URL sin recargar
    if (history.pushState) {
        const newUrl = path === '/' ? '/' : path;
        history.pushState({ tab: tabName }, '', newUrl);
    }
}

/**
 * Maneja el cambio de ruta
 */
function handleRouteChange() {
    const path = window.location.pathname;
    const route = path.replace(/^\//, '').split('/')[0] || '';
    
    const routeMap = {
        'programas': 'Programas',
        'sistemas': 'Sistemas',
        'juegos': 'Juegos',
        'extras': 'Extras',
        'apks': 'APKs',
        'apps': 'Programas',
        '': 'Programas'
    };
    
    const tabName = routeMap[route] || 'Programas';
    
    if (AppState.currentTab !== tabName) {
        AppState.currentTab = tabName;
        
        // Si la app ya está inicializada, cambiar de pestaña
        if (!AppState.isLoading && AppState.dbData) {
            openTab(tabName);
        }
    }
}

/**
 * Actualiza la función openTab para usar rutas limpias
 */
function openTab(tabName) {
    if (AppState.currentTab === tabName) return;
    
    AppState.currentTab = tabName;
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-hidden', 'true');
    });
    
    // Mostrar pestaña activa
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-hidden', 'false');
    }
    
    // Actualizar botones de pestañas
    document.querySelectorAll('.tablink').forEach(btn => {
        const tabNameFromBtn = btn.getAttribute('data-tab') || 
                             btn.textContent.trim() ||
                             btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        const isActive = tabNameFromBtn === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
    
    // Actualizar URL
    updateCleanURL(tabName);
    
    // Realizar búsqueda si hay término activo
    if (AppState.currentSearch) {
        setTimeout(performSearch, 50);
    }
    
    // Guardar estado
    saveAppState();
}

/**
 * Actualiza la URL con ruta limpia
 */
function updateCleanURL(tabName) {
    const tabToRoute = {
        'Programas': 'programas',
        'Sistemas': 'sistemas',
        'Juegos': 'juegos',
        'Extras': 'extras',
        'APKs': 'apks'
    };
    
    const route = tabToRoute[tabName] || 'programas';
    const newURL = route === 'programas' ? '/' : `/${route}`;
    
    if (history.pushState) {
        history.pushState({ tab: tabName }, '', newURL);
    }
    
    // Actualizar título
    const tabTitles = {
        'Programas': 'Programas',
        'Sistemas': 'Sistemas Operativos',
        'Juegos': 'Juegos',
        'Extras': 'Extras y Herramientas',
        'APKs': 'APKs para Android'
    };
    
    document.title = `${tabTitles[tabName] || tabName} - ${CONFIG.appName}`;
}

// ============================================================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🚀 ${CONFIG.appName} v${CONFIG.version} inicializando...`);
    
    // Verificar si es primera visita
    checkFirstVisit();
    
    // Verificar características del navegador
    checkBrowserFeatures();
    
    // Inicializar componentes
    initTheme();
    initEventListeners();
    
    // Cargar datos y estado
    loadAppState();
    loadNotifications();
    loadFavorites();
    
    // Inicializar UI
    initUIComponents();
    initAccessibility();
    
    // Inicializar scroll para ocultar pestañas gradualmente
    initScrollHideNav();
    
    // Cargar datos de FoxWebDB
    if (typeof FoxWebDB !== 'undefined') {
        AppState.dbData = FoxWebDB;
        initApp();
    } else {
        // Si no está disponible, cargar data.js
        loadDataScript();
    }
    
    // Mostrar mensaje de bienvenida solo la primera vez
    if (AppState.firstVisit) {
        setTimeout(() => {
            showToast('Bienvenido a FoxWeb', 'info');
            // Marcar que ya no es primera visita
            localStorage.setItem('foxweb_first_visit', 'false');
            AppState.firstVisit = false;
        }, 1000);
    }
});

/**
 * Verifica si es la primera visita del usuario
 */
function checkFirstVisit() {
    const firstVisit = localStorage.getItem('foxweb_first_visit');
    if (firstVisit === 'false') {
        AppState.firstVisit = false;
    } else {
        AppState.firstVisit = true;
    }
}

/**
 * Verifica características del navegador
 */
function checkBrowserFeatures() {
    AppState.voiceSearchSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    AppState.isOffline = !navigator.onLine;
    
    if (AppState.isOffline) {
        showToast('Estás sin conexión. Algunas funciones pueden no estar disponibles.', 'warning');
    }
}

/**
 * Carga el script data.js si no está disponible
 */
function loadDataScript() {
    console.log('📦 Cargando data.js...');
    
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = function() {
        if (typeof FoxWebDB !== 'undefined') {
            AppState.dbData = FoxWebDB;
            initApp();
        } else {
            showErrorScreen('No se pudo cargar la base de datos. Por favor, recarga la página.');
        }
    };
    script.onerror = function() {
        showErrorScreen('Error al cargar la Base de Datos. Por favor, recarga la página.');
    };
    document.head.appendChild(script);
}

/**
 * Inicializa la aplicación principal
 */
function initApp() {
    console.log('🎯 Inicializando aplicación...');
    
    // Verificar que la base de datos esté cargada
    if (!AppState.dbData) {
        showErrorScreen('No se pudo cargar la base de datos. Por favor, recarga la página.');
        return;
    }
    
    // Verificar si hay contenido nuevo
    checkForNewContent();
    
    // Ocultar overlay de carga
    hideLoading();
    
    // Determinar la pestaña inicial desde la URL
    determineInitialTabFromURL();
    
    // Renderizar contenido
    renderAllTabs();
    
    // Inicializar búsqueda
    initSearch();
    
    // Inicializar modales
    initModals();
    
    // Inicializar notificaciones
    initNotificationCenter();
    
    // Inicializar botones flotantes
    initFloatingButtons();
    
    // Inicializar sidebar
    initSidebar();
    
    // Inicializar contadores
    initCounters();
    
    // Marcar como cargado
    AppState.isLoading = false;
    saveAppState();
    
    console.log('✅ Aplicación inicializada correctamente');
}

/**
 * Determina la pestaña inicial desde la URL
 */
function determineInitialTabFromURL() {
    const path = window.location.pathname;
    const hash = window.location.hash.substring(1);
    
    // Primero verificar hash (para compatibilidad hacia atrás)
    if (hash) {
        const validHashTabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'];
        if (validHashTabs.includes(hash)) {
            AppState.currentTab = hash;
            // Actualizar URL a ruta limpia
            setTimeout(() => updateCleanURL(hash), 100);
            return;
        }
    }
    
    // Verificar pathname
    const pathSegments = path.split('/').filter(segment => segment);
    
    if (pathSegments.length > 0) {
        const route = pathSegments[0].toLowerCase();
        
        // Mapear rutas a nombres de pestañas
        const routeMap = {
            'programas': 'Programas',
            'sistemas': 'Sistemas', 
            'juegos': 'Juegos',
            'extras': 'Extras',
            'apks': 'APKs',
            'apps': 'Programas'
        };
        
        if (routeMap[route]) {
            AppState.currentTab = routeMap[route];
        }
    }
    
    // Si no hay ruta válida, usar valor por defecto
    if (!AppState.currentTab || !['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'].includes(AppState.currentTab)) {
        AppState.currentTab = 'Programas';
    }
}

/**
 * Verifica si hay contenido nuevo comparando con la última versión guardada
 */
function checkForNewContent() {
    if (!AppState.dbData) return;
    
    // Calcular hash actual de la base de datos
    const currentHash = calculateDBHash(AppState.dbData);
    AppState.dbHash = currentHash;
    
    // Obtener hash guardado anteriormente
    const savedHash = localStorage.getItem(CONFIG.dbVersionKey);
    
    // Si es primera visita (no hay hash guardado), guardar el hash actual y salir
    if (!savedHash) {
        console.log('👋 Usuario nuevo, guardando hash inicial');
        localStorage.setItem(CONFIG.dbVersionKey, currentHash);
        return;
    }
    
    // Comparar hashes
    if (currentHash !== savedHash) {
        console.log('🆕 ¡Se detectaron cambios en la base de datos!');
        
        // Calcular diferencias
        const oldData = getCachedDBData();
        const newData = AppState.dbData;
        const changes = calculateContentChanges(oldData, newData);
        
        if (changes.totalNew > 0) {
            // Crear notificación de contenido nuevo
            createNewContentNotification(changes);
            
            // Mostrar toast informativo
            if (changes.totalNew === 1) {
                showToast('¡Se ha agregado 1 nuevo contenido!', 'info');
            } else {
                showToast(`¡Se han agregado ${changes.totalNew} nuevos contenidos!`, 'info');
            }
        }
        
        // Actualizar hash guardado
        localStorage.setItem(CONFIG.dbVersionKey, currentHash);
        
        // Actualizar caché de datos
        cacheDBData(newData);
    } else {
        console.log('✅ La base de datos está actualizada');
    }
}

/**
 * Calcula un hash simple para la base de datos
 */
function calculateDBHash(dbData) {
    if (!dbData) return '';
    
    const hashData = {
        programas: dbData.programas ? dbData.programas.length : 0,
        sistemas: dbData.sistemas ? dbData.sistemas.length : 0,
        juegos: dbData.juegos ? dbData.juegos.length : 0,
        extras: dbData.extras ? dbData.extras.length : 0,
        apks: dbData.apks ? dbData.apks.length : 0,
        timestamp: new Date().toISOString().split('T')[0]
    };
    
    const hashString = JSON.stringify(hashData);
    return btoa(hashString);
}

/**
 * Obtiene los datos de la base de datos cacheados
 */
function getCachedDBData() {
    try {
        const cached = localStorage.getItem(`${CONFIG.dbVersionKey}_data`);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Error obteniendo datos cacheados:', error);
        return null;
    }
}

/**
 * Guarda los datos de la base de datos en caché
 */
function cacheDBData(dbData) {
    try {
        const cacheData = {
            programas: dbData.programas ? dbData.programas.map(p => p.name) : [],
            sistemas: dbData.sistemas ? dbData.sistemas.map(s => s.name) : [],
            juegos: dbData.juegos ? dbData.juegos.map(j => j.name) : [],
            extras: dbData.extras ? dbData.extras.map(e => e.name) : [],
            apks: dbData.apks ? dbData.apks.map(a => a.name) : [],
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`${CONFIG.dbVersionKey}_data`, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error guardando caché de datos:', error);
    }
}

/**
 * Calcula los cambios entre la versión antigua y nueva de la base de datos
 */
function calculateContentChanges(oldData, newData) {
    const changes = {
        programas: 0,
        sistemas: 0,
        juegos: 0,
        extras: 0,
        apks: 0,
        totalNew: 0
    };
    
    if (!oldData) {
        return changes;
    }
    
    const categories = ['programas', 'sistemas', 'juegos', 'extras', 'apks'];
    
    categories.forEach(category => {
        if (oldData[category] && newData[category]) {
            const oldNames = oldData[category] || [];
            const newNames = newData[category] ? newData[category].map(item => item.name) : [];
            
            const newItems = newNames.filter(name => !oldNames.includes(name));
            changes[category] = newItems.length;
            changes.totalNew += newItems.length;
            
            if (newItems.length > 0) {
                console.log(`📥 ${newItems.length} nuevos en ${category}:`, newItems);
            }
        }
    });
    
    return changes;
}

/**
 * Crea una notificación de contenido nuevo
 */
function createNewContentNotification(changes) {
    if (changes.totalNew === 0) return;
    
    let message = '';
    let title = '';
    
    if (changes.totalNew === 1) {
        const categories = ['programas', 'sistemas', 'juegos', 'extras', 'apks'];
        const categoryWithChange = categories.find(cat => changes[cat] > 0);
        
        let categoryName = '';
        switch(categoryWithChange) {
            case 'programas': categoryName = 'programa'; break;
            case 'sistemas': categoryName = 'sistema'; break;
            case 'juegos': categoryName = 'juego'; break;
            case 'extras': categoryName = 'extra'; break;
            case 'apks': categoryName = 'APK'; break;
            default: categoryName = 'contenido';
        }
        
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
        
        if (changeList.length > 0) {
            message = `Se han agregado ${changeList.join(', ')}.`;
        } else {
            message = `Se han agregado ${changes.totalNew} nuevos contenidos.`;
        }
    }
    
    const newNotification = {
        id: Date.now(),
        type: 'info',
        title: title,
        message: message,
        date: new Date().toISOString(),
        read: false
    };
    
    AppState.notifications.unshift(newNotification);
    
    if (AppState.notifications.length > 50) {
        AppState.notifications = AppState.notifications.slice(0, 50);
    }
    
    saveNotifications();
    updateNotificationBadge();
    
    console.log('🔔 Notificación creada:', newNotification);
}

/**
 * Inicializa los componentes de UI
 */
function initUIComponents() {
    updateNotificationBadge();
    initDynamicTitle();
}

// ============================================================================
// RENDERIZADO DE CONTENIDO
// ============================================================================

/**
 * Renderiza todas las pestañas
 */
function renderAllTabs() {
    if (!AppState.dbData) return;
    
    const tabs = [
        { key: 'programas', id: 'Programas' },
        { key: 'sistemas', id: 'Sistemas' },
        { key: 'juegos', id: 'Juegos' },
        { key: 'extras', id: 'Extras' },
        { key: 'apks', id: 'APKs' }
    ];
    
    tabs.forEach(({ key, id }) => {
        renderTab(id, AppState.dbData[key]);
    });
    
    setTimeout(() => activateCurrentTab(), 50);
}

/**
 * Activa la pestaña actual en la UI
 */
function activateCurrentTab() {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-hidden', 'true');
    });
    
    const activeTab = document.getElementById(AppState.currentTab);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-hidden', 'false');
    }
    
    document.querySelectorAll('.tablink').forEach(btn => {
        const tabName = btn.getAttribute('data-tab') || 
                       btn.textContent.trim() ||
                       btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        const isActive = tabName === AppState.currentTab;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
}

/**
 * Renderiza una pestaña específica
 */
function renderTab(tabId, items) {
    const grid = document.getElementById(`grid-${tabId}`);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" role="status">
                <i class="fa-solid fa-box-open" aria-hidden="true"></i>
                <h3>No hay contenido disponible</h3>
                <p>Pronto agregaremos más ${tabId.toLowerCase()}.</p>
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
        const itemId = `${tabId.toLowerCase()}_${index}`;
        const card = createContentCard(item, tabId, itemId);
        fragment.appendChild(card);
    });
    
    grid.appendChild(fragment);
    
    initContentCardsEvents();
}

/**
 * Crea una card de contenido
 */
function createContentCard(item, category, itemId) {
    const template = document.getElementById('contentCardTemplate');
    if (template) {
        return createCardFromTemplate(template, item, category, itemId);
    }
    
    return createCardManually(item, category, itemId);
}

/**
 * Crea una card usando el template
 */
function createCardFromTemplate(template, item, category, itemId) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.content-card');
    
    if (!card) return createCardManually(item, category, itemId);
    
    card.dataset.id = itemId;
    card.dataset.category = category.toLowerCase();
    card.dataset.type = getItemType(item);
    
    const icon = card.querySelector('.card-icon i');
    if (icon) {
        icon.className = item.icon;
    }
    
    const titleText = card.querySelector('.card-title-text');
    const mainBadge = card.querySelector('.main-badge');
    
    if (titleText) {
        titleText.textContent = item.name;
    }
    
    if (mainBadge && item.badges && item.badges.length > 0) {
        mainBadge.textContent = item.badges[0];
    } else if (mainBadge) {
        mainBadge.style.display = 'none';
    }
    
    const description = card.querySelector('.card-description');
    if (description) {
        description.textContent = item.info;
    }
    
    const badgesContainer = card.querySelector('.card-badges');
    if (badgesContainer && item.badges && item.badges.length > 1) {
        for (let i = 1; i < item.badges.length; i++) {
            const badge = document.createElement('span');
            badge.className = 'item-badge';
            badge.textContent = item.badges[i];
            badge.setAttribute('role', 'listitem');
            badgesContainer.appendChild(badge);
        }
    }
    
    const favoriteBtn = card.querySelector('.card-action-btn:nth-child(1)');
    if (favoriteBtn) {
        favoriteBtn.onclick = () => toggleFavorite(itemId);
        updateFavoriteIcon(favoriteBtn, itemId);
    }
    
    const copyLinkBtn = card.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        if (item.modal && item.modal !== 'null') {
            copyLinkBtn.style.display = 'none';
            copyLinkBtn.remove();
        } else if (item.enlace && item.enlace !== '#') {
            copyLinkBtn.onclick = () => copyItemLink(itemId);
        } else {
            copyLinkBtn.style.display = 'none';
            copyLinkBtn.remove();
        }
    }
    
    const downloadBtn = card.querySelector('.download-btn');
    if (downloadBtn) {
        if (item.modal && item.modal !== 'null') {
            downloadBtn.onclick = () => openModal(item.modal);
        } else if (item.enlace && item.enlace !== '#') {
            downloadBtn.onclick = () => window.open(item.enlace, '_blank');
        } else {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i> No disponible';
        }
    }
    
    return card;
}

/**
 * Crea una card manualmente (fallback)
 */
function createCardManually(item, category, itemId) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.id = itemId;
    card.dataset.category = category.toLowerCase();
    card.dataset.type = getItemType(item);
    
    const showCopyLink = !(item.modal && item.modal !== 'null') && item.enlace && item.enlace !== '#';
    
    const mainBadge = item.badges && item.badges.length > 0 ? item.badges[0] : null;
    const remainingBadges = item.badges && item.badges.length > 1 ? item.badges.slice(1) : [];
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                <i class="${item.icon}" aria-hidden="true"></i>
            </div>
            <div class="card-actions">
                <button class="card-action-btn" 
                        onclick="toggleFavorite('${itemId}')" 
                        aria-label="Marcar como favorito"
                        title="Favorito">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                </button>
                ${showCopyLink ? `
                <button class="card-action-btn copy-link-btn" 
                        onclick="copyItemLink('${itemId}')" 
                        aria-label="Copiar enlace"
                        title="Copiar enlace">
                    <i class="fa-solid fa-link" aria-hidden="true"></i>
                </button>` : ''}
            </div>
        </div>
        
        <div class="card-content">
            <h3 class="card-title">
                <span class="card-title-text">${item.name}</span>
                ${mainBadge ? `<span class="main-badge">${mainBadge}</span>` : ''}
            </h3>
            <p class="card-description">${item.info}</p>
            
            ${remainingBadges.length > 0 ? `
            <div class="card-badges" role="list">
                ${remainingBadges.map(badge => `<span class="item-badge" role="listitem">${badge}</span>`).join('')}
            </div>` : ''}
        </div>
        
        <div class="card-footer">
            ${getDownloadButtonHTML(item, itemId)}
        </div>
    `;
    
    return card;
}

/**
 * Devuelve el HTML del botón de descarga
 */
function getDownloadButtonHTML(item, itemId) {
    if (item.modal && item.modal !== 'null') {
        return `
            <button class="download-btn" onclick="openModal('${item.modal}')" aria-label="Descargar ${item.name}">
                <i class="fa-solid fa-download" aria-hidden="true"></i>
                Descargar
            </button>
        `;
    } else if (item.enlace && item.enlace !== '#') {
        return `
            <a href="${item.enlace}" 
               class="download-btn" 
               target="_blank" 
               rel="noopener noreferrer"
               aria-label="Descargar ${item.name}">
                <i class="fa-solid fa-download" aria-hidden="true"></i>
                Descargar
            </a>
        `;
    } else {
        return `
            <button class="download-btn disabled" disabled aria-label="${item.name} no disponible">
                <i class="fa-solid fa-ban" aria-hidden="true"></i>
                No disponible
            </button>
        `;
    }
}

/**
 * Determina el tipo de item
 */
function getItemType(item) {
    const name = item.name.toLowerCase();
    const badges = item.badges ? item.badges.join(' ').toLowerCase() : '';
    
    if (badges.includes('portable') || name.includes('portable')) return 'portable';
    if (badges.includes('ligero') || badges.includes('light')) return 'light';
    if (badges.includes('open source')) return 'opensource';
    if (badges.includes('gratuito') || badges.includes('free')) return 'free';
    return 'standard';
}

// ============================================================================
// SISTEMA DE BÚSQUEDA
// ============================================================================

/**
 * Inicializa el sistema de búsqueda
 */
function initSearch() {
    const searchInput = document.getElementById('mainSearch');
    const clearBtn = document.getElementById('clearSearch');
    
    if (!searchInput || !clearBtn) return;
    
    searchInput.addEventListener('input', debounce(performSearch, 300));
    clearBtn.addEventListener('click', clearSearch);
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') clearSearch();
        if (e.key === 'Enter') performSearch();
    });
    
    searchInput.addEventListener('input', () => {
        const hasValue = searchInput.value.trim() !== '';
        clearBtn.style.display = hasValue ? 'flex' : 'none';
        
        AppState.searchActive = hasValue;
        updateSearchState();
    });
    
    searchInput.addEventListener('focus', () => {
        AppState.searchActive = true;
        updateSearchState();
    });
    
    searchInput.addEventListener('blur', () => {
        if (searchInput.value.trim() === '') {
            AppState.searchActive = false;
            updateSearchState();
        }
    });
}

/**
 * Actualiza el estado visual de la búsqueda
 */
function updateSearchState() {
    const searchSection = document.querySelector('.search-section');
    const nav = document.querySelector('.main-nav');
    
    if (!searchSection || !nav) return;
    
    if (AppState.searchActive) {
        searchSection.classList.add('active-search');
        nav.classList.add('search-active');
    } else {
        searchSection.classList.remove('active-search');
        nav.classList.remove('search-active');
    }
}

/**
 * Realiza la búsqueda
 */
function performSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    
    const term = searchInput.value.toLowerCase().trim();
    AppState.currentSearch = term;
    
    const currentGrid = document.getElementById(`grid-${AppState.currentTab}`);
    if (!currentGrid) return;
    
    const items = currentGrid.querySelectorAll('.content-card');
    let visibleCount = 0;
    
    items.forEach(item => {
        const title = item.querySelector('.card-title-text')?.textContent.toLowerCase() || '';
        const description = item.querySelector('.card-description')?.textContent.toLowerCase() || '';
        const badges = Array.from(item.querySelectorAll('.item-badge, .main-badge'))
                          .map(b => b.textContent.toLowerCase())
                          .join(' ');
        
        const matchesSearch = !term || 
                             title.includes(term) || 
                             description.includes(term) || 
                             badges.includes(term);
        
        const matchesFilter = AppState.currentFilter === 'all' || 
                             item.dataset.type === AppState.currentFilter;
        
        item.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        if (matchesSearch && matchesFilter) visibleCount++;
    });
    
    showNoResults(visibleCount === 0 && term !== '');
    saveAppState();
}

/**
 * Limpia la búsqueda
 */
function clearSearch() {
    const searchInput = document.getElementById('mainSearch');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    AppState.searchActive = false;
    updateSearchState();
    
    performSearch();
}

/**
 * Muestra mensaje de no resultados
 */
function showNoResults(show) {
    const currentGrid = document.getElementById(`grid-${AppState.currentTab}`);
    if (!currentGrid) return;
    
    let noResults = currentGrid.nextElementSibling;
    
    if (!noResults || !noResults.classList.contains('no-results')) {
        noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.setAttribute('role', 'status');
        noResults.innerHTML = `
            <i class="fa-solid fa-search" aria-hidden="true"></i>
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        currentGrid.parentNode.insertBefore(noResults, currentGrid.nextSibling);
    }
    
    noResults.style.display = show ? 'block' : 'none';
}

// ============================================================================
// SISTEMA DE PESTAÑAS - MODIFICADO PARA RUTAS LIMPIAS
// ============================================================================

/**
 * Abre una pestaña específica
 */
function openTab(tabName) {
    if (AppState.currentTab === tabName) return;
    
    AppState.currentTab = tabName;
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-hidden', 'true');
    });
    
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-hidden', 'false');
    }
    
    document.querySelectorAll('.tablink').forEach(btn => {
        const tabNameFromBtn = btn.getAttribute('data-tab') || 
                             btn.textContent.trim() ||
                             btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        const isActive = tabNameFromBtn === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
    
    updateCleanURL(tabName);
    
    if (AppState.currentSearch) {
        setTimeout(performSearch, 50);
    }
    
    saveAppState();
}

/**
 * Actualiza la URL con ruta limpia (sin hash)
 */
function updateCleanURL(tabName) {
    const tabToRoute = {
        'Programas': 'programas',
        'Sistemas': 'sistemas',
        'Juegos': 'juegos',
        'Extras': 'extras',
        'APKs': 'apks'
    };
    
    const route = tabToRoute[tabName] || 'programas';
    const newURL = `/${route}`;
    
    if (history.pushState) {
        history.pushState({ tab: tabName }, '', newURL);
    } else {
        window.location = newURL;
    }
    
    document.title = `${tabName} - ${CONFIG.appName}`;
}

// ============================================================================
// SISTEMA DE SCROLL
// ============================================================================

/**
 * Inicializa el sistema para ocultar pestañas gradualmente al hacer scroll
 */
function initScrollHideNav() {
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

/**
 * Maneja el evento de scroll
 */
function handleScroll() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const nav = document.querySelector('.main-nav');
    const searchSection = document.querySelector('.search-section');
    
    if (!nav || !searchSection) return;
    
    if (window.innerWidth <= 768) {
        const scrollDifference = currentScrollTop - AppState.lastScrollTop;
        
        if (scrollDifference > 10 && currentScrollTop > 100) {
            nav.classList.add('hidden-by-search');
            searchSection.classList.add('hiding-nav');
        } else if (scrollDifference < -10) {
            nav.classList.remove('hidden-by-search');
            searchSection.classList.remove('hiding-nav');
        }
    }
    
    AppState.lastScrollTop = currentScrollTop;
}

// ============================================================================
// SISTEMA DE MODALES
// ============================================================================

/**
 * Inicializa los modales
 */
function initModals() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    initSuggestionForm();
}

/**
 * Abre un modal específico
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal ${modalId} no encontrado`);
        return;
    }
    
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    
    document.body.style.overflow = 'hidden';
    
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
    
    if (modalId === 'sugerenciaModal') {
        resetSuggestionForm();
    }
}

/**
 * Cierra el modal activo
 */
function closeModal(modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    } else {
        document.querySelectorAll('.modal[style*="display: flex"]').forEach(modal => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        });
    }
    
    document.body.style.overflow = '';
}

// ============================================================================
// FORMULARIO DE SUGERENCIAS
// ============================================================================

/**
 * Inicializa el formulario de sugerencias
 */
function initSuggestionForm() {
    const form = document.getElementById('sugerenciaForm');
    if (!form) return;
    
    form.addEventListener('submit', handleSuggestionSubmit);
}

/**
 * Maneja el envío de sugerencias
 */
function handleSuggestionSubmit(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombreSugerencia').value.trim();
    const descripcion = document.getElementById('descripcionSugerencia').value.trim();
    const categoria = document.getElementById('categoriaSugerencia').value;
    const enlace = document.getElementById('enlaceSugerencia').value.trim();
    const web = document.getElementById('webSugerencia').value.trim();
    const email = document.getElementById('emailSugerencia').value.trim();
    
    if (!nombre || !descripcion || !categoria || !enlace) {
        showToast('Por favor, completa todos los campos requeridos.', 'error');
        return;
    }
    
    if (!isValidUrl(enlace)) {
        showToast('Por favor, ingresa una URL válida.', 'error');
        return;
    }
    
    if (!isAllowedDomain(enlace)) {
        showToast('Solo se aceptan enlaces de MediaFire, Google Drive, MEGA, Dropbox, GitHub, SourceForge o enlaces HTTPS directos.', 'warning');
        return;
    }
    
    showSuggestionConfirmation();
    
    saveSuggestionLocal({
        nombre,
        descripcion,
        categoria,
        enlace,
        web,
        email,
        fecha: new Date().toISOString(),
        estado: 'pendiente'
    });
    
    openGitHubIssue(nombre, descripcion, categoria, enlace, web, email);
}

/**
 * Valida una URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Verifica si el dominio está permitido
 */
function isAllowedDomain(url) {
    const allowedDomains = [
        'mediafire.com',
        'drive.google.com',
        'mega.nz',
        'dropbox.com',
        'github.com',
        'sourceforge.net',
        'gitlab.com'
    ];
    
    try {
        const urlObj = new URL(url);
        return allowedDomains.some(domain => urlObj.hostname.includes(domain)) || 
               urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Muestra la confirmación de sugerencia
 */
function showSuggestionConfirmation() {
    const form = document.getElementById('formularioSugerencia');
    const confirmation = document.getElementById('confirmacionSugerencia');
    
    if (form && confirmation) {
        form.style.display = 'none';
        confirmation.style.display = 'block';
    }
}

/**
 * Resetea el formulario de sugerencias
 */
function resetSuggestionForm() {
    const form = document.getElementById('sugerenciaForm');
    const formContainer = document.getElementById('formularioSugerencia');
    const confirmation = document.getElementById('confirmacionSugerencia');
    
    if (form) form.reset();
    if (formContainer) formContainer.style.display = 'block';
    if (confirmation) confirmation.style.display = 'none';
}

/**
 * Guarda la sugerencia localmente
 */
function saveSuggestionLocal(suggestion) {
    try {
        let suggestions = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || [];
        suggestion.id = Date.now();
        suggestions.push(suggestion);
        
        if (suggestions.length > 100) {
            suggestions = suggestions.slice(-100);
        }
        
        localStorage.setItem('foxweb_sugerencias', JSON.stringify(suggestions));
        console.log('💾 Sugerencia guardada localmente:', suggestion);
    } catch (error) {
        console.error('Error guardando sugerencia:', error);
    }
}

/**
 * Abre una issue en GitHub
 */
function openGitHubIssue(nombre, descripcion, categoria, enlace, web, email) {
    const title = `[SUGERENCIA] ${nombre}`;
    const body = `
## 🆕 Sugerencia para FoxWeb

**Nombre:** ${nombre}

**Descripción:** ${descripcion}

**Categoría:** ${categoria}

**Enlace de descarga:** ${enlace}

${web ? `**Sitio web oficial:** ${web}\n\n` : ''}
${email ? `**Email del sugerente:** ${email}\n\n` : ''}
**Fecha de sugerencia:** ${new Date().toLocaleString('es-ES')}

---
*Sugerencia enviada desde [FoxWeb](https://foxweb.vercel.app)*
    `;
    
    const encodedTitle = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(body);
    
    const issueUrl = `https://github.com/foxorange224/foxorange224.github.io/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=sugerencia`;
    
    setTimeout(() => {
        window.open(issueUrl, '_blank');
    }, 1000);
}

// ============================================================================
// SISTEMA DE FAVORITOS
// ============================================================================

/**
 * Carga los favoritos desde localStorage
 */
function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('foxweb_favorites')) || [];
        AppState.favorites = new Set(favorites);
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        AppState.favorites = new Set();
    }
}

/**
 * Guarda los favoritos en localStorage
 */
function saveFavorites() {
    try {
        const favoritesArray = Array.from(AppState.favorites);
        localStorage.setItem('foxweb_favorites', JSON.stringify(favoritesArray));
    } catch (error) {
        console.error('Error guardando favoritos:', error);
    }
}

/**
 * Alterna un item como favorito
 */
function toggleFavorite(itemId) {
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
}

/**
 * Actualiza el icono de favorito para un item
 */
function updateFavoriteIconForItem(itemId) {
    const btn = document.querySelector(`.content-card[data-id="${itemId}"] .card-action-btn:first-child`);
    if (!btn) return;
    
    updateFavoriteIcon(btn, itemId);
}

/**
 * Actualiza el icono de favorito
 */
function updateFavoriteIcon(button, itemId) {
    const icon = button.querySelector('i');
    if (!icon) return;
    
    const isFavorite = AppState.favorites.has(itemId);
    icon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    icon.style.color = isFavorite ? '#ff4757' : '';
}

// ============================================================================
// SISTEMA DE COPIAR ENLACE
// ============================================================================

/**
 * Copia el enlace de un item al portapapeles
 */
function copyItemLink(itemId) {
    const item = findItemById(itemId);
    if (!item) {
        showToast('No se pudo encontrar el item', 'error');
        return;
    }
    
    let urlToCopy = '';
    
    if (item.modal && item.modal !== 'null') {
        showToast('Este contenido no tiene enlace directo para copiar', 'warning');
        return;
    } else if (item.enlace && item.enlace !== '#') {
        urlToCopy = item.enlace;
    } else {
        showToast('Este item no tiene enlace para copiar', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(urlToCopy)
        .then(() => showToast('Enlace copiado al portapapeles', 'success'))
        .catch(err => {
            console.error('Error copiando al portapapeles:', err);
            const textArea = document.createElement('textarea');
            textArea.value = urlToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('Enlace copiado al portapapeles', 'success');
            } catch (e) {
                showToast('Error copiando enlace', 'error');
            }
            document.body.removeChild(textArea);
        });
}

// ============================================================================
// INFORMACIÓN DE ITEMS
// ============================================================================

/**
 * Encuentra un item por ID
 */
function findItemById(itemId) {
    if (!AppState.dbData) return null;
    
    const [category, index] = itemId.split('_');
    const categories = {
        'programas': AppState.dbData.programas,
        'sistemas': AppState.dbData.sistemas,
        'juegos': AppState.dbData.juegos,
        'extras': AppState.dbData.extras,
        'apks': AppState.dbData.apks
    };
    
    const categoryData = categories[category];
    if (!categoryData || !categoryData[parseInt(index)]) return null;
    
    return categoryData[parseInt(index)];
}

// ============================================================================
// SISTEMA DE TEMAS
// ============================================================================

/**
 * Inicializa el sistema de temas
 */
function initTheme() {
    const savedTheme = localStorage.getItem('foxweb_theme') || CONFIG.defaultTheme;
    setTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

/**
 * Cambia el tema
 */
function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

/**
 * Establece un tema específico
 */
function setTheme(theme) {
    AppState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foxweb_theme', theme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icons = themeToggle.querySelectorAll('i');
        icons[0].style.display = theme === 'dark' ? 'none' : 'block';
        icons[1].style.display = theme === 'dark' ? 'block' : 'none';
    }
    
    saveAppState();
}

// ============================================================================
// SISTEMA DE NOTIFICACIONES
// ============================================================================

/**
 * Carga las notificaciones
 */
function loadNotifications() {
    try {
        const saved = localStorage.getItem('foxweb_notifications');
        if (saved) {
            AppState.notifications = JSON.parse(saved);
        } else {
            AppState.notifications = [
                {
                    id: 1,
                    type: 'info',
                    title: 'Bienvenido a FoxWeb',
                    message: 'Gracias por usar nuestro centro de descargas.',
                    date: new Date().toISOString(),
                    read: false
                },
                {
                    id: 2,
                    type: 'info',
                    title: 'Contraseña importante',
                    message: 'Recuerda usar la contraseña: foxorange224',
                    date: new Date(Date.now() - 3600000).toISOString(),
                    read: false
                }
            ];
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        AppState.notifications = [];
    }
}

/**
 * Inicializa el centro de notificaciones
 */
function initNotificationCenter() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationCenter = document.getElementById('notificationCenter');
    
    if (!notificationBtn || !notificationCenter) return;
    
    notificationBtn.addEventListener('click', toggleNotificationCenter);
    
    document.addEventListener('click', (e) => {
        if (!notificationCenter.contains(e.target) && !notificationBtn.contains(e.target)) {
            closeNotificationCenter();
        }
    });
}

/**
 * Alterna el centro de notificaciones
 */
function toggleNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (!center) return;
    
    if (center.getAttribute('aria-hidden') === 'true') {
        openNotificationCenter();
    } else {
        closeNotificationCenter();
    }
}

/**
 * Abre el centro de notificaciones
 */
function openNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (!center) return;
    
    center.setAttribute('aria-hidden', 'false');
    center.classList.add('show');
    
    markNotificationsAsRead();
    renderNotifications();
}

/**
 * Cierra el centro de notificaciones
 */
function closeNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (!center) return;
    
    center.setAttribute('aria-hidden', 'true');
    center.classList.remove('show');
}

/**
 * Marca las notificaciones como leídas
 */
function markNotificationsAsRead() {
    AppState.notifications.forEach(notif => {
        notif.read = true;
    });
    
    updateNotificationBadge();
    saveNotifications();
}

/**
 * Actualiza el badge de notificaciones
 */
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    const unreadCount = AppState.notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
}

/**
 * Renderiza las notificaciones
 */
function renderNotifications() {
    const container = document.querySelector('.notification-list');
    if (!container) return;
    
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
    
    const sortedNotifications = [...AppState.notifications].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedNotifications.forEach(notification => {
        const notificationEl = createNotificationElement(notification);
        container.appendChild(notificationEl);
    });
}

/**
 * Crea un elemento de notificación
 */
function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.read ? '' : 'new'}`;
    div.setAttribute('role', 'listitem');
    
    const icon = getNotificationIcon(notification.type);
    const time = formatNotificationTime(notification.date);
    
    div.innerHTML = `
        <i class="notification-icon ${icon.class}" aria-hidden="true"></i>
        <div class="notification-content">
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
            <small>${time}</small>
        </div>
    `;
    
    return div;
}

/**
 * Obtiene el icono para el tipo de notificación
 */
function getNotificationIcon(type) {
    const icons = {
        info: { class: 'fa-solid fa-info-circle', color: '#007bff' },
        success: { class: 'fa-solid fa-check-circle', color: '#28a745' },
        warning: { class: 'fa-solid fa-exclamation-triangle', color: '#ffc107' },
        error: { class: 'fa-solid fa-times-circle', color: '#dc3545' }
    };
    return icons[type] || icons.info;
}

/**
 * Formatea el tiempo de la notificación
 */
function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES');
}

/**
 * Guarda las notificaciones
 */
function saveNotifications() {
    try {
        localStorage.setItem('foxweb_notifications', JSON.stringify(AppState.notifications));
    } catch (error) {
        console.error('Error guardando notificaciones:', error);
    }
}

// ============================================================================
// EVENT LISTENERS Y ACCESIBILIDAD
// ============================================================================

/**
 * Inicializa los event listeners principales
 */
function initEventListeners() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', () => {
            const show = window.scrollY > 500;
            scrollTopBtn.classList.toggle('show', show);
        });
    }
    
    window.addEventListener('popstate', handlePopState);
    
    window.addEventListener('online', () => {
        AppState.isOffline = false;
        showToast('Conexión restablecida', 'success');
    });
    
    window.addEventListener('offline', () => {
        AppState.isOffline = true;
        showToast('Estás sin conexión', 'warning');
    });
}

/**
 * Maneja el evento popstate (navegación con botones atrás/adelante)
 */
function handlePopState() {
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    
    if (pathSegments.length > 0) {
        const route = pathSegments[0].toLowerCase();
        
        const routeMap = {
            'programas': 'Programas',
            'sistemas': 'Sistemas', 
            'juegos': 'Juegos',
            'extras': 'Extras',
            'apks': 'APKs',
            'apps': 'Programas'
        };
        
        if (routeMap[route] && routeMap[route] !== AppState.currentTab) {
            AppState.currentTab = routeMap[route];
            openTab(routeMap[route]);
        }
    } else {
        if (AppState.currentTab !== 'Programas') {
            AppState.currentTab = 'Programas';
            openTab('Programas');
        }
    }
}

/**
 * Inicializa la accesibilidad
 */
function initAccessibility() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('mainSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openModal('sugerenciaModal');
        }
        
        if (e.ctrlKey || e.metaKey) {
            const tabKeys = {
                '1': 'Programas',
                '2': 'Sistemas',
                '3': 'Juegos',
                '4': 'Extras',
                '5': 'APKs'
            };
            
            if (tabKeys[e.key] && tabKeys[e.key] !== AppState.currentTab) {
                e.preventDefault();
                openTab(tabKeys[e.key]);
            }
        }
    });
    
    document.querySelectorAll('[tabindex]').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
}

// ============================================================================
// COMPONENTES DE UI
// ============================================================================

/**
 * Inicializa los botones flotantes
 */
function initFloatingButtons() {
    const collaboratorsBtn = document.querySelector('.collaborators-btn');
    if (collaboratorsBtn) {
        console.log('✅ Botón flotante de colaboradores listo');
    }
}

/**
 * Inicializa el sidebar
 */
function initSidebar() {
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        if (btn.onclick) return;
        
        if (btn.textContent.includes('Sugerir')) {
            btn.onclick = () => openModal('sugerenciaModal');
        } else if (btn.textContent.includes('Donar')) {
            btn.onclick = () => openModal('donateModal');
        } else if (btn.textContent.includes('Colaboradores')) {
            btn.onclick = () => openModal('collaboratorsModal');
        }
    });
    
    initSidebarNavigation();
}

/**
 * Inicializa la navegación del sidebar
 */
function initSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                e.preventDefault();
                
                const route = href.substring(1).toLowerCase().replace(/\/$/, '');
                const routeMap = {
                    'programas': 'Programas',
                    'sistemas': 'Sistemas', 
                    'juegos': 'Juegos',
                    'extras': 'Extras',
                    'apks': 'APKs',
                    '': 'Programas'
                };
                
                if (routeMap[route] && routeMap[route] !== AppState.currentTab) {
                    openTab(routeMap[route]);
                }
            }
        });
    });
}

/**
 * Inicializa los contadores animados
 */
function initCounters() {
    updateCounters();
}

/**
 * Actualiza los contadores
 */
function updateCounters() {
    if (!AppState.dbData) return;
    
    const totalItems = Object.values(AppState.dbData).reduce((sum, arr) => sum + arr.length, 0);
    
    const counters = {
        'programas': AppState.dbData.programas.length,
        'sistemas': AppState.dbData.sistemas.length,
        'juegos': AppState.dbData.juegos.length,
        'extras': AppState.dbData.extras.length,
        'apks': AppState.dbData.apks.length,
        'total': totalItems
    };
    
    document.querySelectorAll('[data-counter]').forEach(el => {
        const counterType = el.dataset.counter;
        if (counters[counterType] !== undefined) {
            el.textContent = counters[counterType];
        }
    });
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Función debounce para mejorar rendimiento
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Scroll suave al inicio
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Muestra un toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <i class="${icon}" aria-hidden="true"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" aria-label="Cerrar notificación">
            <i class="fa-solid fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

/**
 * Obtiene el icono para el toast
 */
function getToastIcon(type) {
    const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-exclamation-circle',
        warning: 'fa-solid fa-exclamation-triangle',
        info: 'fa-solid fa-info-circle'
    };
    return icons[type] || icons.info;
}

/**
 * Inicializa el título dinámico
 */
function initDynamicTitle() {
    let originalTitle = document.title;
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            document.title = '¡Vuelve! | FoxWeb';
        } else {
            document.title = originalTitle;
        }
    });
}

/**
 * Ocultar overlay de carga
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-busy', 'false');
    }, 500);
}

// ============================================================================
// PANTALLA DE ERROR CRÍTICO
// ============================================================================

/**
 * Muestra la pantalla de error crítica
 */
function showErrorScreen(message) {
    hideLoading();
    
    document.querySelector('.page-container')?.style.setProperty('display', 'none', 'important');
    
    const errorScreen = document.getElementById('errorScreen');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorScreen && errorMessage) {
        errorMessage.textContent = message;
        errorScreen.classList.add('show');
        errorScreen.setAttribute('aria-hidden', 'false');
        
        const retryBtn = document.getElementById('retryBtn');
        const reportBtn = document.getElementById('reportBtn');
        
        if (retryBtn) {
            retryBtn.onclick = function() {
                location.reload();
            };
        }
        
        if (reportBtn) {
            reportBtn.onclick = function() {
                closeErrorScreen();
                openModal('sugerenciaModal');
            };
        }
    }
}

/**
 * Cierra la pantalla de error crítica
 */
function closeErrorScreen() {
    const errorScreen = document.getElementById('errorScreen');
    if (errorScreen) {
        errorScreen.classList.remove('show');
        errorScreen.setAttribute('aria-hidden', 'true');
    }
    
    document.querySelector('.page-container')?.style.removeProperty('display');
}

// ============================================================================
// MANEJO DEL ESTADO
// ============================================================================

/**
 * Carga el estado de la aplicación
 */
function loadAppState() {
    try {
        const saved = localStorage.getItem('foxweb_state');
        if (saved) {
            const state = JSON.parse(saved);
            
            AppState.currentSearch = state.currentSearch || '';
            AppState.currentFilter = state.currentFilter || 'all';
            AppState.theme = state.theme || CONFIG.defaultTheme;
            AppState.recentItems = state.recentItems || [];
            
            setTheme(AppState.theme);
            
            if (AppState.currentSearch) {
                const searchInput = document.getElementById('mainSearch');
                if (searchInput) {
                    searchInput.value = AppState.currentSearch;
                }
            }
        }
    } catch (error) {
        console.error('Error cargando estado:', error);
    }
}

/**
 * Guarda el estado de la aplicación
 */
function saveAppState() {
    try {
        const state = {
            currentTab: AppState.currentTab,
            currentSearch: AppState.currentSearch,
            currentFilter: AppState.currentFilter,
            theme: AppState.theme,
            recentItems: AppState.recentItems.slice(-CONFIG.maxRecentItems),
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('foxweb_state', JSON.stringify(state));
    } catch (error) {
        console.error('Error guardando estado:', error);
    }
}

// ============================================================================
// INICIALIZACIÓN DE EVENTOS DE LAS CARDS
// ============================================================================

/**
 * Inicializa los eventos de las cards de contenido
 */
function initContentCardsEvents() {
    // Los eventos ya están configurados en createContentCard
}

// ============================================================================
// EXPORTACIÓN GLOBAL
// ============================================================================

// Hacer funciones disponibles globalmente
window.FoxWeb = {
    state: AppState,
    config: CONFIG,
    openTab,
    openModal,
    closeModal,
    toggleTheme,
    showToast,
    copyItemLink,
    toggleFavorite,
    findItemById,
    getItemType,
    showErrorScreen,
    closeErrorScreen,
    updateCleanURL,
    version: CONFIG.version
};

console.log('✅ FoxWeb v' + CONFIG.version + ' listo con rutas limpias');

// Manejar navegación inicial basada en URL
window.addEventListener('load', function() {
    if (!AppState.isLoading && AppState.dbData) {
        determineInitialTabFromURL();
        activateCurrentTab();
    }
});