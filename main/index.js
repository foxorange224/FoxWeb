const CONFIG = { appName: 'FoxWeb', version: '1.0.4', defaultTheme: 'dark', enableAnimations: false, cacheEnabled: true, maxRecentItems: 10, dbVersionKey: 'foxweb_db_version_1' }; const AppState = { currentTab: 'Programas', currentSearch: '', currentFilter: 'all', theme: CONFIG.defaultTheme, notifications: [], recentItems: [], favorites: new Set(), isLoading: true, isOffline: false, voiceSearchSupported: false, dbData: null, firstVisit: true, lastScrollTop: 0, searchActive: false, dbHash: null, lastUpdateCheck: null, isHashNavigation: true, previousHash: '', navigationLock: false }; window.addEventListener('error', function (e) { console.error('Error global capturado:', e.error); if (e.error && e.error.message && e.error.message.includes('FoxWebDB')) { showErrorScreen('Error crítico: No se pudo cargar la base de datos. Por favor, recarga la página.'); } }); window.addEventListener('unhandledrejection', function (e) { console.error('Promesa rechazada no manejada:', e.reason); showToast('Error inesperado en la aplicación', 'error'); }); document.addEventListener('DOMContentLoaded', function () {
    console.log(`🚀 ${CONFIG.appName} v${CONFIG.version} inicializando...`); try {
        checkFirstVisit(); checkBrowserFeatures(); initTheme(); initEventListeners(); loadAppState(); loadNotifications(); loadFavorites(); initUIComponents(); initAccessibility(); initScrollHideNav(); if (typeof FoxWebDB !== 'undefined') { AppState.dbData = FoxWebDB; initApp(); } else { loadDataScript(); }
        if (AppState.firstVisit) { setTimeout(() => { showToast('Bienvenido a FoxWeb', 'info'); localStorage.setItem('foxweb_first_visit', 'false'); AppState.firstVisit = false; }, 1000); }
        console.log('✅ DOM cargado correctamente');
    } catch (error) { console.error('Error crítico en DOMContentLoaded:', error); showErrorScreen('Error crítico al cargar la aplicación. Por favor, recarga la página.'); }
}); function checkFirstVisit() { const firstVisit = localStorage.getItem('foxweb_first_visit'); if (firstVisit === 'false') { AppState.firstVisit = false; } }
function checkBrowserFeatures() { AppState.voiceSearchSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window; AppState.isOffline = !navigator.onLine; if (AppState.isOffline) { showToast('Estás sin conexión. Algunas funciones pueden no estar disponibles.', 'warning'); } }
function loadDataScript() { console.log('📦 Cargando data.js...'); const script = document.createElement('script'); script.src = 'data.js'; script.onload = function () { if (typeof FoxWebDB !== 'undefined') { AppState.dbData = FoxWebDB; initApp(); } else { showErrorScreen('No se pudo cargar la base de datos. Por favor, recarga la página.'); } }; script.onerror = function () { showErrorScreen('Error al cargar la Base de Datos. Por favor, recarga la página.'); }; document.head.appendChild(script); }
function initApp() {
    console.log('🎯 Inicializando aplicación...'); try {
        if (!AppState.dbData) { showErrorScreen('No se pudo cargar la base de datos. Por favor, recarga la página.'); return; }
        checkForNewContent(); hideLoading(); determineInitialTabFromHash(); renderAllTabs(); initSearch(); initModals(); initNotificationCenter(); initFloatingButtons(); initSidebar(); initCounters(); AppState.isLoading = false; saveAppState(); console.log('✅ Aplicación inicializada correctamente');
    } catch (error) { console.error('Error crítico en initApp:', error); showErrorScreen('Error crítico al inicializar la aplicación. Por favor, recarga la página.'); }
}
function determineInitialTabFromHash() {
    try {
        const hash = window.location.hash.substring(1); if (hash) { const validTabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs']; if (validTabs.includes(hash)) { AppState.currentTab = hash; AppState.previousHash = hash; return; } }
        AppState.currentTab = 'Programas'; window.location.hash = '#Programas'; AppState.previousHash = 'Programas';
    } catch (error) { console.error('Error determinando pestaña inicial:', error); AppState.currentTab = 'Programas'; window.location.hash = '#Programas'; AppState.previousHash = 'Programas'; }
}
function checkForNewContent() {
    if (!AppState.dbData) return; try {
        const currentHash = calculateDBHash(AppState.dbData); AppState.dbHash = currentHash; const savedHash = localStorage.getItem(CONFIG.dbVersionKey); if (!savedHash) { localStorage.setItem(CONFIG.dbVersionKey, currentHash); return; }
        if (currentHash !== savedHash) {
            console.log('🆕 ¡Se detectaron cambios en la base de datos!'); const oldData = getCachedDBData(); const newData = AppState.dbData; const changes = calculateContentChanges(oldData, newData); if (changes.totalNew > 0) { createNewContentNotification(changes); if (changes.totalNew === 1) { showToast('¡Se ha agregado 1 nuevo contenido!', 'info'); } else { showToast(`¡Se han agregado ${changes.totalNew} nuevos contenidos!`, 'info'); } }
            localStorage.setItem(CONFIG.dbVersionKey, currentHash); cacheDBData(newData);
        } else { console.log('✅ La base de datos está actualizada'); }
    } catch (error) { console.error('Error verificando contenido nuevo:', error); }
}
function calculateDBHash(dbData) { if (!dbData) return ''; try { const hashData = { programas: dbData.programas ? dbData.programas.length : 0, sistemas: dbData.sistemas ? dbData.sistemas.length : 0, juegos: dbData.juegos ? dbData.juegos.length : 0, extras: dbData.extras ? dbData.extras.length : 0, apks: dbData.apks ? dbData.apks.length : 0, timestamp: new Date().toISOString().split('T')[0] }; const hashString = JSON.stringify(hashData); return btoa(hashString); } catch (error) { return Date.now().toString(); } }
function getCachedDBData() { try { const cached = localStorage.getItem(`${CONFIG.dbVersionKey}_data`); return cached ? JSON.parse(cached) : null; } catch (error) { console.error('Error obteniendo datos cacheados:', error); return null; } }
function cacheDBData(dbData) { try { const cacheData = { programas: dbData.programas ? dbData.programas.map(p => p.name) : [], sistemas: dbData.sistemas ? dbData.sistemas.map(s => s.name) : [], juegos: dbData.juegos ? dbData.juegos.map(j => j.name) : [], extras: dbData.extras ? dbData.extras.map(e => e.name) : [], apks: dbData.apks ? dbData.apks.map(a => a.name) : [], timestamp: new Date().toISOString() }; localStorage.setItem(`${CONFIG.dbVersionKey}_data`, JSON.stringify(cacheData)); } catch (error) { console.error('Error guardando caché de datos:', error); } }
function calculateContentChanges(oldData, newData) {
    const changes = { programas: 0, sistemas: 0, juegos: 0, extras: 0, apks: 0, totalNew: 0 }; if (!oldData) { return changes; }
    const categories = ['programas', 'sistemas', 'juegos', 'extras', 'apks']; categories.forEach(category => { if (oldData[category] && newData[category]) { const oldNames = oldData[category] || []; const newNames = newData[category] ? newData[category].map(item => item.name) : []; const newItems = newNames.filter(name => !oldNames.includes(name)); changes[category] = newItems.length; changes.totalNew += newItems.length; if (newItems.length > 0) { console.log(`📥 ${newItems.length} nuevos en ${category}:`, newItems); } } }); return changes;
}
function createNewContentNotification(changes) {
    if (changes.totalNew === 0) return; let message = ''; let title = ''; if (changes.totalNew === 1) {
        const categories = ['programas', 'sistemas', 'juegos', 'extras', 'apks']; const categoryWithChange = categories.find(cat => changes[cat] > 0); let categoryName = ''; switch (categoryWithChange) { case 'programas': categoryName = 'programa'; break; case 'sistemas': categoryName = 'sistema'; break; case 'juegos': categoryName = 'juego'; break; case 'extras': categoryName = 'extra'; break; case 'apks': categoryName = 'APK'; break; default: categoryName = 'contenido'; }
        title = '¡Nuevo contenido disponible!'; message = `Se ha agregado 1 nuevo ${categoryName}. ¡Échale un vistazo!`;
    } else { title = '¡Nuevos contenidos disponibles!'; const changeList = []; if (changes.programas > 0) changeList.push(`${changes.programas} programa${changes.programas > 1 ? 's' : ''}`); if (changes.sistemas > 0) changeList.push(`${changes.sistemas} sistema${changes.sistemas > 1 ? 's' : ''}`); if (changes.juegos > 0) changeList.push(`${changes.juegos} juego${changes.juegos > 1 ? 's' : ''}`); if (changes.extras > 0) changeList.push(`${changes.extras} extra${changes.extras > 1 ? 's' : ''}`); if (changes.apks > 0) changeList.push(`${changes.apks} APK${changes.apks > 1 ? 's' : ''}`); if (changeList.length > 0) { message = `Se han agregado ${changeList.join(', ')}.`; } else { message = `Se han agregado ${changes.totalNew} nuevos contenidos.`; } }
    const newNotification = { id: Date.now(), type: 'info', title: title, message: message, date: new Date().toISOString(), read: false }; AppState.notifications.unshift(newNotification); if (AppState.notifications.length > 50) { AppState.notifications = AppState.notifications.slice(0, 50); }
    saveNotifications(); updateNotificationBadge();
}
function initUIComponents() { updateNotificationBadge(); }
function renderAllTabs() { if (!AppState.dbData) return; try { const tabs = [{ key: 'programas', id: 'Programas' }, { key: 'sistemas', id: 'Sistemas' }, { key: 'juegos', id: 'Juegos' }, { key: 'extras', id: 'Extras' }, { key: 'apks', id: 'APKs' }]; tabs.forEach(({ key, id }) => { renderTab(id, AppState.dbData[key]); }); setTimeout(() => activateCurrentTab(), 50); } catch (error) { console.error('Error renderizando pestañas:', error); showErrorScreen('Error al renderizar el contenido. Por favor, recarga la página.'); } }
function activateCurrentTab() {
    try {
        document.querySelectorAll('.tab-content').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-hidden', 'true'); }); const activeTab = document.getElementById(AppState.currentTab); if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-hidden', 'false'); }
        document.querySelectorAll('.tablink').forEach(btn => { const tabName = btn.getAttribute('data-tab') || btn.textContent.trim() || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]; const isActive = tabName === AppState.currentTab; btn.classList.toggle('active', isActive); btn.setAttribute('aria-selected', isActive); }); updateHash(AppState.currentTab);
    } catch (error) { console.error('Error activando pestaña:', error); }
}
function updateHash(tabName) {
    if (AppState.navigationLock) return; try {
        AppState.navigationLock = true; const newHash = `#${tabName}`; const currentHash = window.location.hash; if (currentHash !== newHash) { AppState.previousHash = tabName; if (history.replaceState) { history.replaceState(null, null, newHash); } else { window.location.hash = newHash; } }
        setTimeout(() => { AppState.navigationLock = false; }, 100);
    } catch (error) { console.error('Error actualizando hash:', error); AppState.navigationLock = false; }
}
function renderTab(tabId, items) {
    const grid = document.getElementById(`grid-${tabId}`); if (!grid) return; try {
        grid.innerHTML = ''; if (!items || items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" role="status">
                    <i class="fa-solid fa-box-open" aria-hidden="true"></i>
                    <h3>No hay contenido disponible</h3>
                    <p>Pronto agregaremos más ${tabId.toLowerCase()}.</p>
                </div>
            `; return;
        }
        const fragment = document.createDocumentFragment(); items.forEach((item, index) => { const itemId = `${tabId.toLowerCase()}_${index}`; const card = createContentCard(item, tabId, itemId); if (card) fragment.appendChild(card); }); grid.appendChild(fragment); initContentCardsEvents();
    } catch (error) {
        console.error(`Error renderizando pestaña ${tabId}:`, error); grid.innerHTML = `
            <div class="empty-state" role="status">
                <i class="fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                <h3>Error cargando contenido</h3>
                <p>Intenta recargar la página.</p>
            </div>
        `;
    }
}
function createContentCard(item, category, itemId) {
    try {
        const template = document.getElementById('contentCardTemplate'); if (template) { return createCardFromTemplate(template, item, category, itemId); }
        return createCardManually(item, category, itemId);
    } catch (error) { console.error('Error creando card:', error); return null; }
}
function createCardFromTemplate(template, item, category, itemId) {
    try {
        const clone = template.content.cloneNode(true); const card = clone.querySelector('.content-card'); if (!card) return createCardManually(item, category, itemId); card.dataset.id = itemId; card.dataset.category = category.toLowerCase(); card.dataset.type = getItemType(item); const icon = card.querySelector('.card-icon i'); if (icon) { icon.className = item.icon; }
        const titleText = card.querySelector('.card-title-text'); const mainBadge = card.querySelector('.main-badge'); if (titleText) { titleText.textContent = item.name; }
        if (mainBadge && item.badges && item.badges.length > 0) { mainBadge.textContent = item.badges[0]; } else if (mainBadge) { mainBadge.style.display = 'none'; }
        const description = card.querySelector('.card-description'); if (description) { description.textContent = item.info; }
        const badgesContainer = card.querySelector('.card-badges'); if (badgesContainer && item.badges && item.badges.length > 1) { for (let i = 1; i < item.badges.length; i++) { const badge = document.createElement('span'); badge.className = 'item-badge'; badge.textContent = item.badges[i]; badge.setAttribute('role', 'listitem'); badgesContainer.appendChild(badge); } }
        const favoriteBtn = card.querySelector('.card-action-btn:nth-child(1)'); if (favoriteBtn) { favoriteBtn.onclick = () => toggleFavorite(itemId); updateFavoriteIcon(favoriteBtn, itemId); }
        const copyLinkBtn = card.querySelector('.copy-link-btn'); if (copyLinkBtn) { if (item.modal && item.modal !== 'null') { copyLinkBtn.style.display = 'none'; copyLinkBtn.remove(); } else if (item.enlace && item.enlace !== '#') { copyLinkBtn.onclick = () => copyItemLink(itemId); } else { copyLinkBtn.style.display = 'none'; copyLinkBtn.remove(); } }
        const downloadBtn = card.querySelector('.download-btn'); if (downloadBtn) { if (item.modal && item.modal !== 'null') { downloadBtn.onclick = () => openModal(item.modal); } else if (item.enlace && item.enlace !== '#') { downloadBtn.onclick = () => window.open(item.enlace, '_blank'); } else { downloadBtn.disabled = true; downloadBtn.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i> No disponible'; } }
        return card;
    } catch (error) { console.error('Error creando card desde template:', error); return createCardManually(item, category, itemId); }
}
function createCardManually(item, category, itemId) {
    try {
        const card = document.createElement('div'); card.className = 'content-card'; card.dataset.id = itemId; card.dataset.category = category.toLowerCase(); card.dataset.type = getItemType(item); const showCopyLink = !(item.modal && item.modal !== 'null') && item.enlace && item.enlace !== '#'; const mainBadge = item.badges && item.badges.length > 0 ? item.badges[0] : null; const remainingBadges = item.badges && item.badges.length > 1 ? item.badges.slice(1) : []; card.innerHTML = `
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
                    </button>`: ''}
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
                </div>`: ''}
            </div>
            
            <div class="card-footer">
                ${getDownloadButtonHTML(item, itemId)}
            </div>
        `; return card;
    } catch (error) {
        console.error('Error creando card manualmente:', error); const errorCard = document.createElement('div'); errorCard.className = 'content-card'; errorCard.innerHTML = `
            <div class="card-content">
                <h3 class="card-title">Error cargando contenido</h3>
                <p class="card-description">No se pudo cargar este elemento.</p>
            </div>
        `; return errorCard;
    }
}
function getDownloadButtonHTML(item, itemId) {
    try {
        if (item.modal && item.modal !== 'null') {
            return `
                <button class="download-btn" onclick="openModal('${item.modal}')" aria-label="Abrir enlace de ${item.name}">
                    <i class="fa-solid fa-download" aria-hidden="true"></i>
                    Abrir enlace
                </button>
            `;
        } else if (item.enlace && item.enlace !== '#') {
            return `
                <a href="${item.enlace}" 
                   class="download-btn" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   aria-label="Abrir enlace ${item.name}">
                    <i class="fa-solid fa-download" aria-hidden="true"></i>
                    Abrir enlace
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
    } catch (error) {
        console.error('Error generando botón de descarga:', error); return `
            <button class="download-btn disabled" disabled>
                <i class="fa-solid fa-ban" aria-hidden="true"></i>
                Error
            </button>
        `;
    }
}
function getItemType(item) { try { const name = item.name ? item.name.toLowerCase() : ''; const badges = item.badges ? item.badges.join(' ').toLowerCase() : ''; if (badges.includes('portable') || name.includes('portable')) return 'portable'; if (badges.includes('ligero') || badges.includes('light')) return 'light'; if (badges.includes('open source')) return 'opensource'; if (badges.includes('gratuito') || badges.includes('free')) return 'free'; return 'standard'; } catch (error) { return 'standard'; } }
function initSearch() { const searchInput = document.getElementById('mainSearch'); const clearBtn = document.getElementById('clearSearch'); if (!searchInput || !clearBtn) return; try { searchInput.addEventListener('input', debounce(performSearch, 300)); clearBtn.addEventListener('click', clearSearch); searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSearch(); if (e.key === 'Enter') performSearch(); }); searchInput.addEventListener('input', () => { const hasValue = searchInput.value.trim() !== ''; clearBtn.style.display = hasValue ? 'flex' : 'none'; AppState.searchActive = hasValue; updateSearchState(); }); searchInput.addEventListener('focus', () => { AppState.searchActive = true; updateSearchState(); }); searchInput.addEventListener('blur', () => { if (searchInput.value.trim() === '') { AppState.searchActive = false; updateSearchState(); } }); if (AppState.currentSearch) { searchInput.value = AppState.currentSearch; clearBtn.style.display = 'flex'; performSearch(); } } catch (error) { console.error('Error inicializando búsqueda:', error); } }
function updateSearchState() { try { const searchSection = document.querySelector('.search-section'); const nav = document.querySelector('.main-nav'); if (!searchSection || !nav) return; if (AppState.searchActive) { searchSection.classList.add('active-search'); nav.classList.add('search-active'); } else { searchSection.classList.remove('active-search'); nav.classList.remove('search-active'); } } catch (error) { console.error('Error actualizando estado de búsqueda:', error); } }
function performSearch() { try { const searchInput = document.getElementById('mainSearch'); if (!searchInput) return; const term = searchInput.value.toLowerCase().trim(); AppState.currentSearch = term; const currentGrid = document.getElementById(`grid-${AppState.currentTab}`); if (!currentGrid) return; const items = currentGrid.querySelectorAll('.content-card'); let visibleCount = 0; items.forEach(item => { const title = item.querySelector('.card-title-text')?.textContent.toLowerCase() || ''; const description = item.querySelector('.card-description')?.textContent.toLowerCase() || ''; const badges = Array.from(item.querySelectorAll('.item-badge, .main-badge')).map(b => b.textContent.toLowerCase()).join(' '); const matchesSearch = !term || title.includes(term) || description.includes(term) || badges.includes(term); const matchesFilter = AppState.currentFilter === 'all' || item.dataset.type === AppState.currentFilter; item.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none'; if (matchesSearch && matchesFilter) visibleCount++; }); showNoResults(visibleCount === 0 && term !== ''); saveAppState(); } catch (error) { console.error('Error realizando búsqueda:', error); } }
function clearSearch() {
    try {
        const searchInput = document.getElementById('mainSearch'); const clearBtn = document.getElementById('clearSearch'); if (searchInput) { searchInput.value = ''; searchInput.focus(); }
        if (clearBtn) { clearBtn.style.display = 'none'; }
        AppState.searchActive = false; updateSearchState(); performSearch();
    } catch (error) { console.error('Error limpiando búsqueda:', error); }
}
function showNoResults(show) {
    try {
        const currentGrid = document.getElementById(`grid-${AppState.currentTab}`); if (!currentGrid) return; let noResults = currentGrid.nextElementSibling; if (!noResults || !noResults.classList.contains('no-results')) {
            noResults = document.createElement('div'); noResults.className = 'no-results'; noResults.setAttribute('role', 'status'); noResults.innerHTML = `
                <i class="fa-solid fa-search" aria-hidden="true"></i>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            `; currentGrid.parentNode.insertBefore(noResults, currentGrid.nextSibling);
        }
        noResults.style.display = show ? 'block' : 'none';
    } catch (error) { console.error('Error mostrando mensaje de no resultados:', error); }
}
function openTab(tabName) {
    if (AppState.navigationLock || AppState.currentTab === tabName) return; try {
        AppState.currentTab = tabName; document.querySelectorAll('.tab-content').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-hidden', 'true'); }); const activeTab = document.getElementById(tabName); if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-hidden', 'false'); }
        document.querySelectorAll('.tablink').forEach(btn => { const tabNameFromBtn = btn.getAttribute('data-tab') || btn.textContent.trim() || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]; const isActive = tabNameFromBtn === tabName; btn.classList.toggle('active', isActive); btn.setAttribute('aria-selected', isActive); }); updateHash(tabName); if (AppState.currentSearch) { setTimeout(performSearch, 50); }
        saveAppState();
    } catch (error) { console.error(`Error abriendo pestaña ${tabName}:`, error); }
}
function initScrollHideNav() { let ticking = false; window.addEventListener('scroll', function () { if (!ticking) { window.requestAnimationFrame(function () { handleScroll(); ticking = false; }); ticking = true; } }); }
function handleScroll() {
    try {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop; const nav = document.querySelector('.main-nav'); const searchSection = document.querySelector('.search-section'); if (!nav || !searchSection) return; if (window.innerWidth <= 768) { const scrollDifference = currentScrollTop - AppState.lastScrollTop; if (scrollDifference > 10 && currentScrollTop > 100) { nav.classList.add('hidden-by-search'); searchSection.classList.add('hiding-nav'); } else if (scrollDifference < -10) { nav.classList.remove('hidden-by-search'); searchSection.classList.remove('hiding-nav'); } }
        AppState.lastScrollTop = currentScrollTop;
    } catch (error) { console.error('Error manejando scroll:', error); }
}
function initModals() { try { document.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) { closeModal(); } }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); } }); initSuggestionForm(); } catch (error) { console.error('Error inicializando modales:', error); } }
function openModal(modalId) {
    try {
        const modal = document.getElementById(modalId); if (!modal) { console.warn(`Modal ${modalId} no encontrado`); return; }
        modal.style.display = 'flex'; modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (focusable) focusable.focus(); if (modalId === 'sugerenciaModal') { resetSuggestionForm(); }
    } catch (error) { console.error(`Error abriendo modal ${modalId}:`, error); }
}
function closeModal(modalId) {
    try {
        if (modalId) { const modal = document.getElementById(modalId); if (modal) { modal.style.display = 'none'; modal.setAttribute('aria-hidden', 'true'); } } else { document.querySelectorAll('.modal[style*="display: flex"]').forEach(modal => { modal.style.display = 'none'; modal.setAttribute('aria-hidden', 'true'); }); }
        document.body.style.overflow = '';
    } catch (error) { console.error('Error cerrando modal:', error); }
}
function initSuggestionForm() { const form = document.getElementById('sugerenciaForm'); if (!form) return; form.addEventListener('submit', handleSuggestionSubmit); }
function handleSuggestionSubmit(e) {
    e.preventDefault(); try {
        const nombre = document.getElementById('nombreSugerencia').value.trim(); const descripcion = document.getElementById('descripcionSugerencia').value.trim(); const categoria = document.getElementById('categoriaSugerencia').value; const enlace = document.getElementById('enlaceSugerencia').value.trim(); const web = document.getElementById('webSugerencia').value.trim(); const email = document.getElementById('emailSugerencia').value.trim(); if (!nombre || !descripcion || !categoria || !enlace) { showToast('Por favor, completa todos los campos requeridos.', 'error'); return; }
        if (!isValidUrl(enlace)) { showToast('Por favor, ingresa una URL válida.', 'error'); return; }
        if (!isAllowedDomain(enlace)) { showToast('Solo se aceptan enlaces de MediaFire, Google Drive, MEGA, Dropbox, GitHub, SourceForge o enlaces HTTPS directos.', 'warning'); return; }
        showSuggestionConfirmation(); saveSuggestionLocal({ nombre, descripcion, categoria, enlace, web, email, fecha: new Date().toISOString(), estado: 'pendiente' }); openGitHubIssue(nombre, descripcion, categoria, enlace, web, email);
    } catch (error) { console.error('Error enviando sugerencia:', error); showToast('Error al enviar la sugerencia. Por favor, inténtalo de nuevo.', 'error'); }
}
function isValidUrl(url) { try { new URL(url); return true; } catch { return false; } }
function isAllowedDomain(url) { const allowedDomains = ['mediafire.com', 'drive.google.com', 'mega.nz', 'dropbox.com', 'github.com', 'sourceforge.net', 'gitlab.com']; try { const urlObj = new URL(url); return allowedDomains.some(domain => urlObj.hostname.includes(domain)) || urlObj.protocol === 'https:'; } catch { return false; } }
function showSuggestionConfirmation() { try { const form = document.getElementById('formularioSugerencia'); const confirmation = document.getElementById('confirmacionSugerencia'); if (form && confirmation) { form.style.display = 'none'; confirmation.style.display = 'block'; } } catch (error) { console.error('Error mostrando confirmación:', error); } }
function resetSuggestionForm() { try { const form = document.getElementById('sugerenciaForm'); const formContainer = document.getElementById('formularioSugerencia'); const confirmation = document.getElementById('confirmacionSugerencia'); if (form) form.reset(); if (formContainer) formContainer.style.display = 'block'; if (confirmation) confirmation.style.display = 'none'; } catch (error) { console.error('Error reseteando formulario:', error); } }
function saveSuggestionLocal(suggestion) {
    try {
        let suggestions = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || []; suggestion.id = Date.now(); suggestions.push(suggestion); if (suggestions.length > 100) { suggestions = suggestions.slice(-100); }
        localStorage.setItem('foxweb_sugerencias', JSON.stringify(suggestions));
    } catch (error) { console.error('Error guardando sugerencia:', error); }
}
function openGitHubIssue(nombre, descripcion, categoria, enlace, web, email) {
    try {
        const title = `[SUGERENCIA] ${nombre}`; const body = `
## 🆕 Sugerencia para FoxWeb

**Nombre:** ${nombre}

**Descripción:** ${descripcion}

**Categoría:** ${categoria}

**Enlace de descarga:** ${enlace}

${web ? `**Sitio web oficial:** ${web}\n\n` : ''}
${email ? `**Email del sugerente:** ${email}\n\n` : ''}
**Fecha de sugerencia:** ${new Date().toLocaleString('es-ES')}

---
*Sugerencia enviada desde [FoxWeb](https://foxweb.pages.dev)*
        `; const encodedTitle = encodeURIComponent(title); const encodedBody = encodeURIComponent(body); const issueUrl = `https://github.com/foxorange224/foxorange224.github.io/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=sugerencia`; setTimeout(() => { window.open(issueUrl, '_blank'); }, 1000);
    } catch (error) { console.error('Error abriendo issue de GitHub:', error); showToast('Error al abrir GitHub. Por favor, inténtalo manualmente.', 'error'); }
}
function loadFavorites() { try { const favorites = JSON.parse(localStorage.getItem('foxweb_favorites')) || []; AppState.favorites = new Set(favorites); } catch (error) { console.error('Error cargando favoritos:', error); AppState.favorites = new Set(); } }
function saveFavorites() { try { const favoritesArray = Array.from(AppState.favorites); localStorage.setItem('foxweb_favorites', JSON.stringify(favoritesArray)); } catch (error) { console.error('Error guardando favoritos:', error); } }
function toggleFavorite(itemId) {
    try {
        if (AppState.favorites.has(itemId)) { AppState.favorites.delete(itemId); showToast('Removido de favoritos', 'info'); } else { AppState.favorites.add(itemId); showToast('Agregado a favoritos', 'success'); }
        updateFavoriteIconForItem(itemId); saveFavorites(); saveAppState();
    } catch (error) { console.error('Error alternando favorito:', error); showToast('Error al actualizar favoritos', 'error'); }
}
function updateFavoriteIconForItem(itemId) { try { const btn = document.querySelector(`.content-card[data-id="${itemId}"] .card-action-btn:first-child`); if (!btn) return; updateFavoriteIcon(btn, itemId); } catch (error) { console.error('Error actualizando icono de favorito:', error); } }
function updateFavoriteIcon(button, itemId) { try { const icon = button.querySelector('i'); if (!icon) return; const isFavorite = AppState.favorites.has(itemId); icon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'; icon.style.color = isFavorite ? '#ff4757' : ''; } catch (error) { console.error('Error actualizando icono:', error); } }
function copyItemLink(itemId) {
    try {
        const item = findItemById(itemId); if (!item) { showToast('No se pudo encontrar el item', 'error'); return; }
        let urlToCopy = ''; if (item.modal && item.modal !== 'null') { showToast('Este contenido no tiene enlace directo para copiar', 'warning'); return; } else if (item.enlace && item.enlace !== '#') { urlToCopy = item.enlace; } else { showToast('Este item no tiene enlace para copiar', 'warning'); return; }
        navigator.clipboard.writeText(urlToCopy).then(() => showToast('Enlace copiado al portapapeles', 'success')).catch(err => {
            console.error('Error copiando al portapapeles:', err); const textArea = document.createElement('textarea'); textArea.value = urlToCopy; document.body.appendChild(textArea); textArea.select(); try { document.execCommand('copy'); showToast('Enlace copiado al portapapeles', 'success'); } catch (e) { showToast('Error copiando enlace', 'error'); }
            document.body.removeChild(textArea);
        });
    } catch (error) { console.error('Error copiando enlace:', error); showToast('Error al copiar enlace', 'error'); }
}
function findItemById(itemId) { try { if (!AppState.dbData) return null; const [category, index] = itemId.split('_'); const categories = { 'programas': AppState.dbData.programas, 'sistemas': AppState.dbData.sistemas, 'juegos': AppState.dbData.juegos, 'extras': AppState.dbData.extras, 'apks': AppState.dbData.apks }; const categoryData = categories[category]; if (!categoryData || !categoryData[parseInt(index)]) return null; return categoryData[parseInt(index)]; } catch (error) { console.error('Error buscando item:', error); return null; } }
function initTheme() { try { const savedTheme = localStorage.getItem('foxweb_theme') || CONFIG.defaultTheme; setTheme(savedTheme); const themeToggle = document.getElementById('themeToggle'); if (themeToggle) { themeToggle.addEventListener('click', toggleTheme); } } catch (error) { console.error('Error inicializando tema:', error); } }
function toggleTheme() { try { const newTheme = AppState.theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); } catch (error) { console.error('Error alternando tema:', error); } }
function setTheme(theme) {
    try {
        AppState.theme = theme; document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('foxweb_theme', theme); const themeToggle = document.getElementById('themeToggle'); if (themeToggle) { const icons = themeToggle.querySelectorAll('i'); icons[0].style.display = theme === 'dark' ? 'none' : 'block'; icons[1].style.display = theme === 'dark' ? 'block' : 'none'; }
        saveAppState();
    } catch (error) { console.error('Error estableciendo tema:', error); }
}
function loadNotifications() { try { const saved = localStorage.getItem('foxweb_notifications'); if (saved) { AppState.notifications = JSON.parse(saved); } else { AppState.notifications = [{ id: 1, type: 'info', title: 'Bienvenido a FoxWeb', message: 'Gracias por usar nuestro centro de descargas.', date: new Date().toISOString(), read: false }, { id: 2, type: 'info', title: 'Contraseña importante', message: 'Recuerda usar la contraseña: foxorange224', date: new Date(Date.now() - 3600000).toISOString(), read: false }]; } } catch (error) { console.error('Error cargando notificaciones:', error); AppState.notifications = []; } }
function initNotificationCenter() { const notificationBtn = document.getElementById('notificationBtn'); const notificationCenter = document.getElementById('notificationCenter'); if (!notificationBtn || !notificationCenter) return; try { notificationBtn.addEventListener('click', toggleNotificationCenter); document.addEventListener('click', (e) => { if (!notificationCenter.contains(e.target) && !notificationBtn.contains(e.target)) { closeNotificationCenter(); } }); } catch (error) { console.error('Error inicializando centro de notificaciones:', error); } }
function toggleNotificationCenter() { try { const center = document.getElementById('notificationCenter'); if (!center) return; if (center.getAttribute('aria-hidden') === 'true') { openNotificationCenter(); } else { closeNotificationCenter(); } } catch (error) { console.error('Error alternando centro de notificaciones:', error); } }
function openNotificationCenter() { try { const center = document.getElementById('notificationCenter'); if (!center) return; center.setAttribute('aria-hidden', 'false'); center.classList.add('show'); markNotificationsAsRead(); renderNotifications(); } catch (error) { console.error('Error abriendo centro de notificaciones:', error); } }
function closeNotificationCenter() { try { const center = document.getElementById('notificationCenter'); if (!center) return; center.setAttribute('aria-hidden', 'true'); center.classList.remove('show'); } catch (error) { console.error('Error cerrando centro de notificaciones:', error); } }
function markNotificationsAsRead() { try { AppState.notifications.forEach(notif => { notif.read = true; }); updateNotificationBadge(); saveNotifications(); } catch (error) { console.error('Error marcando notificaciones como leídas:', error); } }
function updateNotificationBadge() { try { const badge = document.querySelector('.notification-badge'); if (!badge) return; const unreadCount = AppState.notifications.filter(n => !n.read).length; badge.textContent = unreadCount; badge.style.display = unreadCount > 0 ? 'flex' : 'none'; } catch (error) { console.error('Error actualizando badge de notificaciones:', error); } }
function renderNotifications() {
    const container = document.querySelector('.notification-list'); if (!container) return; try {
        container.innerHTML = ''; if (AppState.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty" role="status">
                    <i class="fa-solid fa-bell-slash" aria-hidden="true"></i>
                    <p>No hay notificaciones</p>
                </div>
            `; return;
        }
        const sortedNotifications = [...AppState.notifications].sort((a, b) => new Date(b.date) - new Date(a.date)); sortedNotifications.forEach(notification => { const notificationEl = createNotificationElement(notification); container.appendChild(notificationEl); });
    } catch (error) {
        console.error('Error renderizando notificaciones:', error); container.innerHTML = `
            <div class="notification-empty" role="status">
                <i class="fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                <p>Error cargando notificaciones</p>
            </div>
        `;
    }
}
function createNotificationElement(notification) {
    try {
        const div = document.createElement('div'); div.className = `notification-item ${notification.read ? '' : 'new'}`; div.setAttribute('role', 'listitem'); const icon = getNotificationIcon(notification.type); const time = formatNotificationTime(notification.date); div.innerHTML = `
            <i class="notification-icon ${icon.class}" aria-hidden="true"></i>
            <div class="notification-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
                <small>${time}</small>
            </div>
        `; return div;
    } catch (error) { console.error('Error creando elemento de notificación:', error); const div = document.createElement('div'); div.className = 'notification-item'; div.innerHTML = '<p>Error cargando notificación</p>'; return div; }
}
function getNotificationIcon(type) { const icons = { info: { class: 'fa-solid fa-info-circle', color: '#007bff' }, success: { class: 'fa-solid fa-check-circle', color: '#28a745' }, warning: { class: 'fa-solid fa-exclamation-triangle', color: '#ffc107' }, error: { class: 'fa-solid fa-times-circle', color: '#dc3545' } }; return icons[type] || icons.info; }
function formatNotificationTime(dateString) { try { const date = new Date(dateString); const now = new Date(); const diffMs = now - date; const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000); if (diffMins < 1) return 'Ahora mismo'; if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`; if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`; if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`; return date.toLocaleDateString('es-ES'); } catch (error) { return 'Fecha desconocida'; } }
function saveNotifications() { try { localStorage.setItem('foxweb_notifications', JSON.stringify(AppState.notifications)); } catch (error) { console.error('Error guardando notificaciones:', error); } }
function initEventListeners() {
    try {
        const scrollTopBtn = document.getElementById('scrollTopBtn'); if (scrollTopBtn) { scrollTopBtn.addEventListener('click', scrollToTop); window.addEventListener('scroll', () => { const show = window.scrollY > 500; scrollTopBtn.classList.toggle('show', show); }); }
        window.addEventListener('hashchange', handleHashChange); window.addEventListener('online', () => { AppState.isOffline = false; showToast('Conexión restablecida', 'success'); }); window.addEventListener('offline', () => { AppState.isOffline = true; showToast('Estás sin conexión', 'warning'); });
    } catch (error) { console.error('Error inicializando event listeners:', error); }
}
function handleHashChange() { try { if (AppState.navigationLock) return; const hash = window.location.hash.substring(1); const validTabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs']; if (hash && validTabs.includes(hash) && hash !== AppState.currentTab) { AppState.currentTab = hash; openTab(hash); } } catch (error) { console.error('Error manejando cambio de hash:', error); } }
function initAccessibility() {
    try {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); const searchInput = document.getElementById('mainSearch'); if (searchInput) { searchInput.focus(); searchInput.select(); } }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openModal('sugerenciaModal'); }
            if (e.ctrlKey || e.metaKey) { const tabKeys = { '1': 'Programas', '2': 'Sistemas', '3': 'Juegos', '4': 'Extras', '5': 'APKs' }; if (tabKeys[e.key] && tabKeys[e.key] !== AppState.currentTab) { e.preventDefault(); openTab(tabKeys[e.key]); } }
        }); document.querySelectorAll('[tabindex]').forEach(el => { el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } }); });
    } catch (error) { console.error('Error inicializando accesibilidad:', error); }
}
function initFloatingButtons() { try { const collaboratorsBtn = document.querySelector('.collaborators-btn'); if (collaboratorsBtn) { console.log('✅ Botón flotante de colaboradores listo'); } } catch (error) { console.error('Error inicializando botones flotantes:', error); } }
function initSidebar() { try { document.querySelectorAll('.quick-action-btn').forEach(btn => { if (btn.onclick) return; if (btn.textContent.includes('Sugerir')) { btn.onclick = () => openModal('sugerenciaModal'); } else if (btn.textContent.includes('Donar')) { btn.onclick = () => openModal('donateModal'); } }); } catch (error) { console.error('Error inicializando sidebar:', error); } }
function initCounters() { try { updateCounters(); } catch (error) { console.error('Error inicializando contadores:', error); } }
function updateCounters() { if (!AppState.dbData) return; try { const totalItems = Object.values(AppState.dbData).reduce((sum, arr) => sum + arr.length, 0); const counters = { 'programas': AppState.dbData.programas.length, 'sistemas': AppState.dbData.sistemas.length, 'juegos': AppState.dbData.juegos.length, 'extras': AppState.dbData.extras.length, 'apks': AppState.dbData.apks.length, 'total': totalItems }; document.querySelectorAll('[data-counter]').forEach(el => { const counterType = el.dataset.counter; if (counters[counterType] !== undefined) { el.textContent = counters[counterType]; } }); } catch (error) { console.error('Error actualizando contadores:', error); } }
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
function scrollToTop() { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (error) { window.scrollTo(0, 0); } }
function showToast(message, type = 'info') {
    try {
        const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.setAttribute('role', 'alert'); toast.setAttribute('aria-live', 'assertive'); const icon = getToastIcon(type); toast.innerHTML = `
            <i class="${icon}" aria-hidden="true"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" aria-label="Cerrar notificación">
                <i class="fa-solid fa-times" aria-hidden="true"></i>
            </button>
        `; document.body.appendChild(toast); setTimeout(() => { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 3000);
    } catch (error) { console.error('Error mostrando toast:', error); }
}
function getToastIcon(type) { const icons = { success: 'fa-solid fa-check-circle', error: 'fa-solid fa-exclamation-circle', warning: 'fa-solid fa-exclamation-triangle', info: 'fa-solid fa-info-circle' }; return icons[type] || icons.info; }
function hideLoading() { try { const overlay = document.getElementById('loadingOverlay'); if (!overlay) return; overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; overlay.setAttribute('aria-busy', 'false'); }, 500); } catch (error) { console.error('Error ocultando overlay de carga:', error); } }
function showErrorScreen(message) {
    try {
        hideLoading(); document.querySelector('.page-container')?.style.setProperty('display', 'none', 'important'); const errorScreen = document.getElementById('errorScreen'); const errorMessage = document.getElementById('errorMessage'); if (errorScreen && errorMessage) {
            errorMessage.textContent = message; errorScreen.classList.add('show'); errorScreen.setAttribute('aria-hidden', 'false'); const retryBtn = document.getElementById('retryBtn'); const reportBtn = document.getElementById('reportBtn'); if (retryBtn) { retryBtn.onclick = function () { location.reload(); }; }
            if (reportBtn) { reportBtn.onclick = function () { closeErrorScreen(); openModal('sugerenciaModal'); }; }
        }
    } catch (error) {
        console.error('Error mostrando pantalla de error:', error); document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <h1 style="color: #ff4500;">⚠️ Error Crítico</h1>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff4500; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
    }
}
function closeErrorScreen() {
    try {
        const errorScreen = document.getElementById('errorScreen'); if (errorScreen) { errorScreen.classList.remove('show'); errorScreen.setAttribute('aria-hidden', 'true'); }
        document.querySelector('.page-container')?.style.removeProperty('display');
    } catch (error) { console.error('Error cerrando pantalla de error:', error); }
}
function loadAppState() { try { const saved = localStorage.getItem('foxweb_state'); if (saved) { const state = JSON.parse(saved); AppState.currentSearch = state.currentSearch || ''; AppState.currentFilter = state.currentFilter || 'all'; AppState.theme = state.theme || CONFIG.defaultTheme; AppState.recentItems = state.recentItems || []; setTheme(AppState.theme); if (AppState.currentSearch) { const searchInput = document.getElementById('mainSearch'); if (searchInput) { searchInput.value = AppState.currentSearch; } } } } catch (error) { console.error('Error cargando estado:', error); } }
function saveAppState() { try { const state = { currentTab: AppState.currentTab, currentSearch: AppState.currentSearch, currentFilter: AppState.currentFilter, theme: AppState.theme, recentItems: AppState.recentItems.slice(-CONFIG.maxRecentItems), lastSaved: new Date().toISOString() }; localStorage.setItem('foxweb_state', JSON.stringify(state)); } catch (error) { console.error('Error guardando estado:', error); } }
function initContentCardsEvents() { }
window.FoxWeb = { state: AppState, config: CONFIG, openTab, openModal, closeModal, toggleTheme, showToast, copyItemLink, toggleFavorite, findItemById, getItemType, showErrorScreen, closeErrorScreen, version: CONFIG.version }; console.log(`✅ FoxWeb v${CONFIG.version} listo con sistema de hash completo`); window.addEventListener('load', function () { if (!AppState.isLoading && AppState.dbData) { determineInitialTabFromHash(); activateCurrentTab(); } });