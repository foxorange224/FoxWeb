'use strict';

// =============================================================================
// FOXWEB MAIN FEATURES - Funcionalidades adicionales (Búsqueda, Pestañas, Modales, UI)
// Este archivo contiene funcionalidades extendidas que dependen de main-core.js
// =============================================================================

// Mapeo de nombres de pestañas a valores cortos para query parameters
const TAB_QUERY_MAP = {
    'Programas': 'programs',
    'Sistemas': 'systems',
    'Juegos': 'games',
    'Extras': 'extras',
    'APKs': 'apks'
};

// Mapeo inverso: de valores de query a nombres de pestañas
const QUERY_TAB_MAP = {
    'programs': 'Programas',
    'systems': 'Sistemas',
    'games': 'Juegos',
    'extras': 'Extras',
    'apks': 'APKs'
};

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// =============================================================================
// PESTAÑAS Y CONTENIDO
// =============================================================================

function renderAllTabs() {
    if (!AppState.dbData) return;
    try {
        TABS_CONFIG.forEach(({ key, id }) => renderTab(id, AppState.dbData[key]));
        setTimeout(() => activateCurrentTab(), 50);
    } catch (error) {
        console.error('Error renderizando pestañas:', error);
        showErrorScreen('Error al renderizar el contenido. Por favor, recarga la página.');
    }
}

function activateCurrentTab() {
    try {
        document.querySelectorAll('.tab-content').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-hidden', 'true'); }); 
        const activeTab = document.getElementById(AppState.currentTab); 
        if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-hidden', 'false'); }
        document.querySelectorAll('.tablink').forEach(btn => { 
            const tabName = btn.getAttribute('data-tab') || btn.textContent.trim() || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]; 
            const isActive = tabName === AppState.currentTab; 
            btn.classList.toggle('active', isActive); 
            btn.setAttribute('aria-selected', isActive); 
        });
        
        updateHash(AppState.currentTab);

        // Si la pestaña es 'Programas' y la página se cargó sin query parameters,
        // nos aseguramos de que la URL esté limpia.
        if (AppState.currentTab === 'Programas' && !AppState.hasInitialHash) {
            if (history.replaceState) {
                const url = new URL(window.location.href);
                // Solo mantener query parameters si existen
                if (!url.searchParams.has('tab')) {
                    history.replaceState(null, null, url.pathname);
                }
            }
        }
    } catch (error) { 
        console.error('Error activando pestaña:', error); 
    }
}

function updateHash(tabName) {
    if (AppState.navigationLock) return; 
    try {
        AppState.navigationLock = true; 
        
        // Obtener el valor corto para query parameter
        const tabValue = TAB_QUERY_MAP[tabName] || tabName.toLowerCase();
        
        // Construir nueva URL con query parameters
        const url = new URL(window.location.href);
        const currentTab = url.searchParams.get('tab');
        const currentPage = url.searchParams.get('page');
        
        // Solo actualizar si la pestaña es diferente
        if (currentTab !== tabValue) {
            url.searchParams.set('tab', tabValue);
            // Resetear página a 1 cuando se cambia de pestaña
            url.searchParams.set('page', '1');
            
            AppState.previousHash = tabName; 
            
            if (history.replaceState) { 
                history.replaceState(null, null, url.toString()); 
            } else { 
                window.location.href = url.toString(); 
            } 
        }
        
        setTimeout(() => { AppState.navigationLock = false; }, 100);
    } catch (error) { 
        console.error('Error actualizando URL:', error); 
        AppState.navigationLock = false; 
    }
}

/**
 * Actualiza el query parameter de página en la URL
 * @param {number} page - Número de página
 */
function updatePageQueryParam(page) {
    try {
        const url = new URL(window.location.href);
        const currentPage = url.searchParams.get('page');
        
        // Solo actualizar si la página es diferente
        if (currentPage !== page.toString()) {
            url.searchParams.set('page', page.toString());
            
            if (history.replaceState) { 
                history.replaceState(null, null, url.toString()); 
            } else { 
                window.location.href = url.toString(); 
            }
        }
    } catch (error) { 
        console.error('Error actualizando query parameter de página:', error); 
    }
}

function renderTab(tabId, items) {
    const grid = document.getElementById(`grid-${tabId}`); 
    if (!grid) return; 
    try {
        // Si el sistema de paginación está disponible, usarlo
        if (window.PaginationSystem && window.PaginationSystem.renderTab) {
            window.PaginationSystem.renderTab(tabId);
            return;
        }

        // Fallback: renderizado sin paginación
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
        // Get current view mode from grid class
        const viewMode = grid.classList.contains('compact-view') ? 'compact' : 'cards';
        const fragment = document.createDocumentFragment(); 
        items.forEach((item, index) => { 
            const itemId = `${tabId.toLowerCase()}_${index}`; 
            const card = createContentCard(item, tabId, itemId, viewMode); 
            if (card) fragment.appendChild(card); 
        }); 
        grid.appendChild(fragment); 
        initContentCardsEvents();
    } catch (error) {
        console.error(`Error renderizando pestaña ${tabId}:`, error); 
        grid.innerHTML = `
            <div class="empty-state" role="status">
                <i class="fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                <h3>Error cargando contenido</h3>
                <p>Intenta recargar la página.</p>
            </div>
        `;
    }
}

function createContentCard(item, category, itemId, viewMode = 'cards') {
    try {
        // Always use manual card creation for consistent behavior
        return createCardManually(item, category, itemId, viewMode);
    } catch (error) { 
        console.error('Error creando card:', error); 
        return null; 
    }
}

function createCardFromTemplate(template, item, category, itemId) {
    try {
        const clone = template.content.cloneNode(true); 
        const card = clone.querySelector('.content-card'); 
        if (!card) return createCardManually(item, category, itemId); 
        card.dataset.id = itemId; 
        card.dataset.category = category.toLowerCase(); 
        card.dataset.type = getItemType(item); 
        const icon = card.querySelector('.card-icon i'); 
        if (icon) { icon.className = item.icon; }
        const titleText = card.querySelector('.card-title-text'); 
        const mainBadge = card.querySelector('.main-badge'); 
        if (titleText) { titleText.textContent = item.name; }
        if (mainBadge && item.badges && item.badges.length > 0) { mainBadge.textContent = item.badges[0]; } else if (mainBadge) { mainBadge.style.display = 'none'; }
        const description = card.querySelector('.card-description'); 
        if (description) { description.textContent = item.info; }
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
        if (favoriteBtn) { favoriteBtn.onclick = () => toggleFavorite(itemId); updateFavoriteIcon(favoriteBtn, itemId); }
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
        const cardFooter = card.querySelector('.card-footer'); 
        if (downloadBtn && cardFooter) { 
            if (item.modal && item.modal !== 'null') { 
                downloadBtn.onclick = () => openModal(item.modal); 
            } else if (item.enlace && item.enlace !== '#') { 
                downloadBtn.onclick = () => window.open(item.enlace, '_blank'); 
            } else { 
                downloadBtn.disabled = true; 
                downloadBtn.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i> No disponible'; 
            }
            // Añadir badge de seguridad si existe
            if (item.security && item.security.verified) {
                const securityDiv = document.createElement('div'); 
                securityDiv.className = 'security-badge'; 
                securityDiv.title = item.security.note || 'Archivo verificado por el equipo de FoxWeb';
                const shieldIcon = document.createElement('i'); 
                shieldIcon.className = 'fa-solid fa-shield-check';
                securityDiv.appendChild(shieldIcon);
                const verifiedText = document.createTextNode(' Verificado'); 
                securityDiv.appendChild(verifiedText);
                cardFooter.appendChild(securityDiv);
            }
        }
        return card;
    } catch (error) { 
        console.error('Error creando card desde template:', error); 
        return createCardManually(item, category, itemId); 
    }
}

function createCardManually(item, category, itemId, viewMode = 'cards') {
    try {
        const card = document.createElement('div'); 
        card.className = 'content-card'; 
        card.dataset.id = itemId; 
        card.dataset.category = category.toLowerCase(); 
        card.dataset.type = getItemType(item); 
        
        const showCopyLink = !(item.modal && item.modal !== 'null') && item.enlace && item.enlace !== '#'; 
        const mainBadge = item.badges && item.badges.length > 0 ? item.badges[0] : null; 
        const remainingBadges = item.badges && item.badges.length > 1 ? item.badges.slice(1) : []; 
        
        if (viewMode === 'compact') {
            // Vista compacta: [icono] [fav] Nombre Badge Descripcion -------- [Copiar] [Detalles] [Abrir enlace]
            const showCopyLink = item.enlace && item.enlace !== '#';
            const hasModal = item.modal && item.modal !== 'null';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">
                        <i class="${escapeHtml(item.icon)}" aria-hidden="true"></i>
                    </div>
                    <div class="card-actions">
                        <button class="card-action-btn favorite-btn" aria-label="Agregar a favoritos" title="Favorito">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    ${mainBadge ? `<span class="main-badge">${escapeHtml(mainBadge)}</span>` : ''}
                    <h3 class="card-title">
                        <span class="card-title-text">${escapeHtml(item.name)}</span>
                    </h3>
                    <p class="card-description">${escapeHtml(item.info)}</p>
                </div>
                <div class="card-footer">
                    ${showCopyLink ? `
                    <button class="download-btn copy-link-btn" data-item-id="${escapeHtml(itemId)}" title="Copiar enlace">
                        <i class="fa-solid fa-link"></i>
                    </button>` : ''}
                    ${hasModal ? `
                    <button class="download-btn details-btn" data-modal="${escapeHtml(item.modal)}">
                        <i class="fa-solid fa-circle-info"></i><span>Detalles</span>
                    </button>` : ''}
                    ${item.enlace && item.enlace !== '#' ? `
                    <button class="download-btn" data-url="${escapeHtml(item.enlace)}">
                        <i class="fa-solid fa-download"></i><span>Abrir</span>
                    </button>` : ''}
                    ${!item.enlace && !item.modal ? `
                    <button class="download-btn" disabled>
                        <i class="fa-solid fa-ban"></i><span>No disponible</span>
                    </button>` : ''}
                </div>
            `;
            
            // Event listeners para vista compacta (evita XSS en onclick)
            const copyLinkBtn = card.querySelector('.copy-link-btn');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', () => copyItemLink(itemId));
            }
            
            const detailsBtn = card.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => openModal(item.modal));
            }
            
            const downloadBtn = card.querySelector('.download-btn[data-url]');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => window.open(item.enlace, '_blank'));
            }
        } else {
            // Vista de tarjetas normal
            const hasModal = item.modal && item.modal !== 'null';
            const showCopyLink = item.enlace && item.enlace !== '#';
            
            // Escapar contenido dinámico para prevenir XSS
            const safeName = escapeHtml(item.name);
            const safeInfo = escapeHtml(item.info);
            const safeIcon = escapeHtml(item.icon);
            const safeModal = item.modal ? escapeHtml(item.modal) : '';
            const safeEnlace = item.enlace ? escapeHtml(item.enlace) : '';
            const safeBadge = mainBadge ? escapeHtml(mainBadge) : '';
            const safeRemainingBadges = remainingBadges.map(b => escapeHtml(b));
            const safeSecurityNote = item.security && item.security.note ? escapeHtml(item.security.note) : '';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">
                        <i class="${safeIcon}" aria-hidden="true"></i>
                    </div>
                    <div class="card-actions">
                        <button class="card-action-btn favorite-btn" aria-label="Agregar a favoritos" title="Favorito">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                        ${showCopyLink ? `
                        <button class="card-action-btn" 
                                data-item-id="${escapeHtml(itemId)}" 
                                aria-label="Copiar enlace">
                            <i class="fa-solid fa-link"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">
                        <span class="card-title-text">${safeName}</span>
                        ${safeBadge ? `<span class="main-badge">${safeBadge}</span>` : ''}
                    </h3>
                    <p class="card-description">${safeInfo}</p>
                    ${safeRemainingBadges.length > 0 ? `
                    <div class="card-badges">
                        ${safeRemainingBadges.map(b => `<span class="item-badge">${b}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    ${hasModal ? `
                    <button class="download-btn details-btn" data-modal="${safeModal}">
                        <i class="fa-solid fa-circle-info"></i>Detalles
                    </button>` : ''}
                    ${item.enlace && item.enlace !== '#' ? `
                    <button class="download-btn" ${hasModal ? '' : 'style="flex:1"'} data-url="${safeEnlace}">
                        <i class="fa-solid fa-download"></i>
                        ${hasModal ? 'Abrir enlace' : 'Descargar'}
                    </button>` : (!hasModal ? `
                    <button class="download-btn" disabled style="flex:1">
                        <i class="fa-solid fa-ban"></i>No disponible
                    </button>` : '')}
                    ${item.security && item.security.verified ? `
                    <div class="security-badge" title="${safeSecurityNote || 'Archivo verificado'}">
                        <i class="fa-solid fa-shield-check"></i> Verificado
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Añadir event listeners para vista normal (evita XSS en onclick)
            const copyLinkBtn = card.querySelector('.card-action-btn');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', () => copyItemLink(itemId));
            }
            
            const detailsBtn = card.querySelector('.details-btn');
            if (detailsBtn && hasModal) {
                detailsBtn.addEventListener('click', () => openModal(item.modal));
            }
            
            const mainDownloadBtn = card.querySelector('.download-btn[data-url]');
            if (mainDownloadBtn && !mainDownloadBtn.disabled && item.enlace && item.enlace !== '#') {
                mainDownloadBtn.addEventListener('click', () => window.open(item.enlace, '_blank'));
            }
        }
        
        return card;
    } catch (error) {
        console.error('Error creando card manualmente:', error);
        return null;
    }
}

function getItemType(item) {
    if (item.badges && item.badges.some(b => b.toLowerCase().includes('juego'))) return 'juego';
    if (item.badges && item.badges.some(b => b.toLowerCase().includes('sistema'))) return 'sistema';
    if (item.badges && item.badges.some(b => b.toLowerCase().includes('apk'))) return 'apk';
    if (item.badges && item.badges.some(b => b.toLowerCase().includes('driver') || b.toLowerCase().includes('utilidad'))) return 'utilidad';
    return 'standard';
}

// =============================================================================
// BÚSQUEDA
// =============================================================================

function initSearch() { 
    const searchInput = document.getElementById('mainSearch'); 
    const clearBtn = document.getElementById('clearSearch'); 
    if (!searchInput || !clearBtn) return; 
    try { 
        searchInput.addEventListener('input', debounce(performSearch, 150)); 
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
        if (AppState.currentSearch) { 
            searchInput.value = AppState.currentSearch; 
            clearBtn.style.display = 'flex'; 
            performSearch(); 
        } 
    } catch (error) { 
        console.error('Error inicializando búsqueda:', error); 
    } 
}

function updateSearchState() {
    try {
        if (!searchSectionElement || !navElement) {
            navElement = document.querySelector('.main-nav');
            searchSectionElement = document.querySelector('.search-section');
        }

        if (!searchSectionElement || !navElement) return;

        if (AppState.searchActive) {
            searchSectionElement.classList.add('active-search');
            navElement.classList.add('search-active');
        } else {
            searchSectionElement.classList.remove('active-search');
            navElement.classList.remove('search-active');
        }
    } catch (error) {
        console.error('Error actualizando estado de búsqueda:', error);
    }
}

function performSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    const activeTab = AppState.currentTab; // Usamos currentTab que es el que usa tu AppState
    
    // Actualizar estado de búsqueda
    AppState.currentSearch = query;
    AppState.searchActive = query.length > 0;
    
    // Si el sistema de paginación está disponible, usarlo
    if (window.PaginationSystem && window.PaginationSystem.renderTab) {
        // Disparar evento de cambio de búsqueda
        document.dispatchEvent(new CustomEvent('searchChanged', { 
            detail: { query: query, tabId: activeTab } 
        }));
        return;
    }
    
    // Fallback: búsqueda sin paginación
    const grid = document.getElementById(`grid-${activeTab}`);
    if (!grid) return;

    const cards = grid.querySelectorAll('.content-card, .card'); // Buscamos ambos por si acaso
    let hasResults = false;

    cards.forEach(card => {
        // Buscamos el texto dentro del título y la descripción
        const title = card.querySelector('.card-title-text')?.textContent.toLowerCase() || "";
        const desc = card.querySelector('.card-description')?.textContent.toLowerCase() || "";

        if (title.includes(query) || desc.includes(query)) {
            card.style.display = ""; // Mostramos
            card.classList.remove('hidden');
            hasResults = true;
        } else {
            card.style.display = "none"; // Ocultamos
            card.classList.add('hidden');
        }
    });

    // Actualizar contador del span
    const countElement = document.getElementById(`count-${activeTab}`);
    if (countElement) {
        const visibleCount = grid.querySelectorAll('.content-card:not([style*="display: none"]), .card:not(.hidden)').length;
        countElement.textContent = `(${visibleCount})`;
    }

    // Gestionar mensaje de "No encontrado"
    handleSearchEmptyState(activeTab, !hasResults, query);
}

function clearSearch() {
    const searchInput = document.getElementById('mainSearch');
    const clearBtn = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.value = '';
        AppState.currentSearch = '';
    }
    if (clearBtn) clearBtn.style.display = 'none';

    performSearch(); // Al estar vacío, mostrará todo de nuevo
    updateCounters(); // Restaura los números totales
}

function handleSearchEmptyState(tabId, isEmpty, query) {
    const grid = document.getElementById(`grid-${tabId}`);
    if (!grid) return;

    let msg = grid.querySelector('.no-results-msg');
    if (isEmpty && query !== '') {
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'no-results-msg';
            msg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-dim);';
            grid.appendChild(msg);
        }
        // Actualizar el mensaje con el query actual
        msg.innerHTML = `<i class="fa-solid fa-face-frown"></i> No hay resultados de "${query}"`;
    } else if (msg) {
        msg.remove();
    }
}

function openTab(tabName) {
    if (AppState.navigationLock || AppState.currentTab === tabName) return; 
    try {
        AppState.currentTab = tabName; 
        document.querySelectorAll('.tab-content').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-hidden', 'true'); }); 
        const activeTab = document.getElementById(tabName); 
        if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-hidden', 'false'); }
        document.querySelectorAll('.tablink').forEach(btn => { 
            const tabNameFromBtn = btn.getAttribute('data-tab') || btn.textContent.trim() || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]; 
            const isActive = tabNameFromBtn === tabName; 
            btn.classList.toggle('active', isActive); 
            btn.setAttribute('aria-selected', isActive); 
        }); 
        updateHash(tabName); 
        if (AppState.currentSearch) { setTimeout(performSearch, 50); }
        saveAppState();
        
        // Disparar evento personalizado para cambio de pestaña
        document.dispatchEvent(new CustomEvent('tabChanged', { 
            detail: { tabId: tabName } 
        }));
    } catch (error) { 
        console.error(`Error abriendo pestaña ${tabName}:`, error); 
    }
}

// =============================================================================
// SCROLL
// =============================================================================

function initScrollHideNav() {
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

function handleScroll() {
    try {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (!navElement || !searchSectionElement) {
            navElement = document.querySelector('.main-nav');
            searchSectionElement = document.querySelector('.search-section');
        }

        if (!navElement || !searchSectionElement) return;

        if (window.innerWidth <= 768) {
            const scrollDifference = currentScrollTop - AppState.lastScrollTop;
            if (scrollDifference > 10 && currentScrollTop > 100) {
                navElement.classList.add('hidden-by-search');
                searchSectionElement.classList.add('hiding-nav');
            } else if (scrollDifference < -10) {
                navElement.classList.remove('hidden-by-search');
                searchSectionElement.classList.remove('hiding-nav');
            }
        }

        AppState.lastScrollTop = currentScrollTop;
    } catch (error) {
        console.error('Error manejando scroll:', error);
    }
}

// =============================================================================
// MODALES Y SUGERENCIAS
// =============================================================================

function initModals() {
    try {
        document.addEventListener('click', (e) => {
            // Find the closest parent with the class 'modal' that is currently displayed
            const openModalElement = e.target.closest('.modal[style*="display: flex"]');
            
            // If an open modal exists and the click target is exactly that modal element (the backdrop)
            if (openModalElement && e.target === openModalElement) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        initSuggestionForm();
    } catch (error) {
        console.error('Error inicializando modales:', error);
    }
}

// Variable para guardar el elemento que abrió el modal (para devolver el foco al cerrar)
let focusedElementBeforeModal = null;

function openModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal ${modalId} no encontrado`);
            return;
        }
        
        // Guardar el elemento activo actual antes de abrir el modal
        focusedElementBeforeModal = document.activeElement;
        
        // Crear backdrop si no existe
        let backdrop = modal.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.setAttribute('role', 'presentation');
            modal.insertBefore(backdrop, modal.firstChild);
            
            // Cerrar modal al hacer clic en el backdrop
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    closeModal(modalId);
                }
            });
        }
        
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        modal.removeAttribute('inert');
        document.body.style.overflow = 'hidden';
        
        // Enfocar elemento enfocable dentro del modal
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        } else {
            // Si no hay elementos enfocables, enfocar el modal mismo
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }
        
        // Agregar listener para trapping de foco dentro del modal
        modal.addEventListener('keydown', handleModalKeyDown);
        
        if (modalId === 'sugerenciaModal') {
            initSuggestionForm();
        }
    } catch (error) {
        console.error('Error abriendo modal:', error);
    }
}

// Función para manejar teclado dentro del modal (focus trapping)
function handleModalKeyDown(e) {
    const modal = e.currentTarget;
    
    // Manejar Escape para cerrar modal
    if (e.key === 'Escape') {
        closeModal(modal.id);
        return;
    }
    
    // Manejar Tab para trapping de foco
    if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Si Shift+Tab y estamos en el primer elemento, ir al último
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
        // Si Tab y estamos en el último elemento, ir al primero
        else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
}

function closeModal(modalId) {
    try {
        const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal[style*="display: flex"]');
        if (!modal) return;
        
        // Remover listener de teclado
        modal.removeEventListener('keydown', handleModalKeyDown);
        
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
        document.body.style.overflow = '';
        
        // Devolver el foco al elemento que abrió el modal
        if (focusedElementBeforeModal && focusedElementBeforeModal.focus) {
            focusedElementBeforeModal.focus();
            focusedElementBeforeModal = null;
        }
    } catch (error) {
        console.error('Error cerrando modal:', error);
    }
}

function checkUrlForModal() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const modalParam = urlParams.get('modal');
        if (modalParam) {
            openModal(modalParam);
            // Limpiar la URL
            if (history.replaceState) {
                history.replaceState(null, null, window.location.pathname);
            }
        }
    } catch (error) {
        console.error('Error verificando modal en URL:', error);
    }
}

// =============================================================================
// FORMULARIO DE SUGERENCIAS
// =============================================================================

function initSuggestionForm() {
    const form = document.getElementById('suggestionForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitSuggestion();
    });
}

function submitSuggestion() {
    const form = document.getElementById('suggestionForm');
    if (!form) return;
    
    const nombre = document.getElementById('suggestionName')?.value.trim() || '';
    const email = document.getElementById('suggestionEmail')?.value.trim() || '';
    const tipo = document.getElementById('suggestionType')?.value || 'programa';
    const mensaje = document.getElementById('suggestionMessage')?.value.trim() || '';
    
    if (!mensaje) {
        showToast('Por favor, escribe tu sugerencia', 'warning');
        return;
    }
    
    // Validar email si se proporciona
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Por favor, introduce un email válido', 'warning');
        return;
    }
    
    // Simular envío (en un sitio real, esto enviaría a un servidor)
    const suggestion = {
        nombre: nombre || 'Anónimo',
        email: email || 'No proporcionado',
        tipo,
        mensaje,
        fecha: new Date().toISOString()
    };
    
    console.log('Sugerencia enviada:', suggestion);
    
    // Mostrar mensaje de éxito
    showToast('¡Gracias por tu sugerencia! La Tendremos en cuenta.', 'success');
    
    // Cerrar modal y resetear formulario
    closeModal('sugerenciaModal');
    form.reset();
}

function resetSuggestionForm() {
    const form = document.getElementById('suggestionForm');
    if (form) form.reset();
}

// =============================================================================
// SUGERENCIA A GITHUB - Enviar sugerencias como Issue
// =============================================================================

function handleSugerenciaSubmit() {
    const nombre = document.getElementById('nombreSugerencia');
    const descripcion = document.getElementById('descripcionSugerencia');
    const categoria = document.getElementById('categoriaSugerencia');
    const enlace = document.getElementById('enlaceSugerencia');
    const web = document.getElementById('webSugerencia');
    const email = document.getElementById('emailSugerencia');
    
    // Validate required fields
    if (!nombre?.value?.trim() || !descripcion?.value?.trim() || 
        !categoria?.value || !enlace?.value?.trim()) {
        showToast('Por favor, completa todos los campos requeridos', 'warning');
        return;
    }
    
    // Validate URL format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(enlace.value.trim())) {
        showToast('Por favor, ingresa un enlace válido (debe empezar por http:// o https://)', 'warning');
        return;
    }
    
    // Validate email if provided
    if (email?.value?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showToast('Por favor, ingresa un email válido', 'warning');
        return;
    }
    
    // Validate web URL if provided
    if (web?.value?.trim() && !urlPattern.test(web.value.trim())) {
        showToast('Por favor, ingresa una URL válida para el sitio oficial', 'warning');
        return;
    }
    
    // Build GitHub issue URL
    const repoUrl = 'https://github.com/foxorange224/FoxWeb/issues/new';
    const title = `[Sugerencia] ${nombre.value.trim()}`;
    const body = encodeURIComponent(
        `## Sugerencia de Contenido\n\n` +
        `**Nombre:** ${nombre.value.trim()}\n\n` +
        `**Categoría:** ${categoria.value}\n\n` +
        `**Descripción:**\n${descripcion.value.trim()}\n\n` +
        `**Enlace de descarga:** ${enlace.value.trim()}\n\n` +
        `${web?.value?.trim() ? `**Sitio oficial:** ${web.value.trim()}\n\n` : ''}` +
        `${email?.value?.trim() ? `**Email de contacto:** ${email.value.trim()}\n\n` : ''}` +
        `---\n` +
        `*Enviado desde FoxWeb - ${new Date().toLocaleDateString('es-ES')}*`
    );
    
    // Show confirmation and open GitHub
    showConfirmationAndRedirect(repoUrl + `?title=${title}&body=${body}`);
}

function showConfirmationAndRedirect(githubUrl) {
    const formulario = document.getElementById('formularioSugerencia');
    const confirmacion = document.getElementById('confirmacionSugerencia');
    
    if (formulario && confirmacion) {
        formulario.style.display = 'none';
        confirmacion.style.display = 'block';
        
        // Add click handler to the close button to redirect to GitHub
        const closeBtn = confirmacion.querySelector('button');
        if (closeBtn) {
            closeBtn.onclick = function() {
                window.open(githubUrl, '_blank');
                resetSugerenciaForm();
                closeModal('sugerenciaModal');
            };
        }
        
        // Auto-redirect after 3 seconds if user doesn't click
        window.sugerenciaAutoRedirect = setTimeout(function() {
            window.open(githubUrl, '_blank');
            resetSugerenciaForm();
            closeModal('sugerenciaModal');
        }, 3000);
    }
}

function resetSugerenciaForm() {
    // Clear the auto-redirect timeout if exists
    if (window.sugerenciaAutoRedirect) {
        clearTimeout(window.sugerenciaAutoRedirect);
        window.sugerenciaAutoRedirect = null;
    }
    
    // Reset form fields
    const fields = ['nombreSugerencia', 'descripcionSugerencia', 'categoriaSugerencia', 
                    'enlaceSugerencia', 'webSugerencia', 'emailSugerencia'];
    fields.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    // Reset select to default
    const select = document.getElementById('categoriaSugerencia');
    if (select) select.selectedIndex = 0;
    
    // Show form, hide confirmation
    const formulario = document.getElementById('formularioSugerencia');
    const confirmacion = document.getElementById('confirmacionSugerencia');
    if (formulario) formulario.style.display = 'block';
    if (confirmacion) confirmacion.style.display = 'none';
}

// =============================================================================
// UTILIDADES VARIAS
// =============================================================================

// Utilidad debounce para búsquedas
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

// Inicializar componentes flotantes
let floatingButtonsInitialized = false;
let floatingButtonsRetries = 0;
const MAX_FLOATING_BUTTON_RETRIES = 3;

function initFloatingButtons() {
    // Evitar inicialización múltiple
    if (floatingButtonsInitialized) return;
    
    // Máximo de reintentos para evitar bucles infinitos
    if (floatingButtonsRetries >= MAX_FLOATING_BUTTON_RETRIES) {
        floatingButtonsInitialized = true; // Marcar como inicializado para no seguir intentando
        return;
    }
    
    // Usar setTimeout para asegurar que el DOM esté completamente cargado
    setTimeout(function() {
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        
        // Si el botón no existe (página de inicio, etc.), salir
        if (!scrollTopBtn) {
            floatingButtonsRetries++;
            // Solo reintentar si hay oportunidades restantes
            if (floatingButtonsRetries < MAX_FLOATING_BUTTON_RETRIES) {
                setTimeout(initFloatingButtons, 500);
            } else {
                floatingButtonsInitialized = true;
            }
            return;
        }
        
        // Marcar como inicializado exitosamente
        floatingButtonsInitialized = true;
        
        const scrollThreshold = 300;
        let lastScrollY = 0;
        let ticking = false;
        
        function updateScrollButton() {
            const currentScrollY = window.scrollY;
            
            // Si está en la parte superior, ocultar el botón
            if (currentScrollY <= scrollThreshold) {
                scrollTopBtn.classList.remove('show');
                scrollTopBtn.classList.add('hide');
            }
            // Si hace scroll hacia arriba y está visible, ocultar
            else if (currentScrollY < lastScrollY) {
                scrollTopBtn.classList.add('show');
                scrollTopBtn.classList.remove('hide');
            }
            // Si hace scroll hacia abajo y está oculto, mostrar
            else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
                scrollTopBtn.classList.add('show');
                scrollTopBtn.classList.remove('hide');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateScrollButton();
                });
                ticking = true;
            }
        }, { passive: true });
        
        // Click para volver arriba
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        console.log('Botones flotantes inicializados correctamente');
    }, 100);
}

// Inicializar sidebar
function initSidebar() {
    // Aquí puedes agregar funcionalidad para sidebar si lo hay
}

// =============================================================================
// TOASTS Y ERRORES
// =============================================================================

function showToast(message, type = 'info', persistent = false) {
    try {
        // Eliminar toast anterior si existe
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="${getToastIcon(type)}" aria-hidden="true"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" aria-label="Cerrar">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        document.body.appendChild(toast);
        if (!persistent) {
            setTimeout(() => { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 3000);
        }
    } catch (error) { 
        console.error('Error mostrando toast:', error); 
    }
}

// Exponer funciones globalmente para que estén disponibles antes de que otros scripts las llamen
window.showToast = showToast;
window.getToastIcon = getToastIcon;
window.showErrorScreen = showErrorScreen;
window.closeErrorScreen = closeErrorScreen;
window.hideLoading = hideLoading;

function getToastIcon(type) { 
    const icons = { 
        success: 'fa-solid fa-check-circle', 
        error: 'fa-solid fa-exclamation-circle', 
        warning: 'fa-solid fa-exclamation-triangle', 
        info: 'fa-solid fa-info-circle',
        check: 'fa-solid fa-check-circle' 
    }; 
    return icons[type] || icons.info; 
}

function hideLoading() { 
    try { 
        const overlay = document.getElementById('loadingOverlay'); 
        if (!overlay) return; 
        overlay.style.display = 'none'; 
        overlay.setAttribute('aria-busy', 'false'); 
    } catch (error) { 
        console.error('Error ocultando overlay de carga:', error); 
    } 
}

function showErrorScreen(message) {
    try {
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
                retryBtn.onclick = function () { location.reload(); }; 
            }
            if (reportBtn) { 
                reportBtn.onclick = function () { closeErrorScreen(); openModal('sugerenciaModal'); }; 
            }
        }
    } catch (error) {
        console.error('Error mostrando pantalla de error:', error); 
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <h1 style="color: #ff4500;"> Error Crítico</h1>
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
        const errorScreen = document.getElementById('errorScreen'); 
        if (errorScreen) { 
            errorScreen.classList.remove('show'); 
            errorScreen.setAttribute('aria-hidden', 'true'); 
        }
        document.querySelector('.page-container')?.style.removeProperty('display');
    } catch (error) { 
        console.error('Error cerrando pantalla de error:', error); 
    }
}

// =============================================================================
// ESTADO DE LA APP
// =============================================================================

function loadAppState() { 
    try { 
        const saved = localStorage.getItem('foxweb_state'); 
        if (saved) { 
            const state = JSON.parse(saved); 
            AppState.currentSearch = state.currentSearch || ''; 
            AppState.currentFilter = state.currentFilter || 'all'; 
            // Theme ya se establece correctamente desde initTheme() usando foxweb_theme
            AppState.recentItems = state.recentItems || []; 
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

function saveAppState() { 
    try { 
        const state = { 
            currentTab: AppState.currentTab, 
            currentSearch: AppState.currentSearch, 
            currentFilter: AppState.currentFilter, 
            // Theme no se guarda aquí - se gestiona单独 via foxweb_theme
            recentItems: AppState.recentItems.slice(-CONFIG.maxRecentItems), 
            lastSaved: new Date().toISOString() 
        }; 
        localStorage.setItem('foxweb_state', JSON.stringify(state)); 
    } catch (error) { 
        console.error('Error guardando estado:', error); 
    } 
}

function initContentCardsEvents() { 
    // Placeholder para eventos de tarjetas de contenido 
}

// =============================================================================
// EXPORTAR API PÚBLICA
// =============================================================================

window.FoxWeb = {
    state: typeof AppState !== 'undefined' ? AppState : null,
    config: typeof CONFIG !== 'undefined' ? CONFIG : null,
    openTab: typeof openTab !== 'undefined' ? openTab : null,
    openModal: typeof openModal !== 'undefined' ? openModal : null,
    closeModal: typeof closeModal !== 'undefined' ? closeModal : null,
    toggleTheme: typeof toggleTheme !== 'undefined' ? toggleTheme : null,
    showToast: typeof showToast !== 'undefined' ? showToast : null,
    copyItemLink: typeof copyItemLink !== 'undefined' ? copyItemLink : null,
    toggleFavorite: typeof toggleFavorite !== 'undefined' ? toggleFavorite : null,
    findItemById: typeof findItemById !== 'undefined' ? findItemById : null,
    getItemType: typeof getItemType !== 'undefined' ? getItemType : null,
    showErrorScreen: typeof showErrorScreen !== 'undefined' ? showErrorScreen : null,
    closeErrorScreen: typeof closeErrorScreen !== 'undefined' ? closeErrorScreen : null
};

/** Alias para funciones globales usadas en HTML */
window.openModal = openModal;
window.closeModal = closeModal;
window.resetSugerenciaForm = resetSugerenciaForm;
window.handleSugerenciaSubmit = handleSugerenciaSubmit;

// Función para actualizar contadores durante búsqueda
function updateCounterOnSearch(tabId) {
    const grid = document.getElementById(`grid-${tabId}`);
    if (!grid) return;
    
    const visibleCards = grid.querySelectorAll('.card:not(.hidden), .program-card:not([style*="display: none"])');
    const count = visibleCards.length;
    
    const countElement = document.getElementById(`count-${tabId}`);
    if (countElement) {
        countElement.textContent = `(${count})`;
    }
}
