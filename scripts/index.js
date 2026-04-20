/* FoxWeb - JS Consolidado para Homepage */
// Combina: modals.js + theme.js + index-recent.js + index-modal-url.js

// Modals (de modals.js)
function loadModals() {
    fetch('/database/modals.html?v=' + Date.now())
    .then(function(response) {
        if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
        return response.text();
    })
    .then(function(html) {
        var container = document.getElementById('modales-container');
        if (container) container.innerHTML = html;
    })
    .catch(function(error) {
        console.error('Error al cargar modals.html:', error);
    });
}

// Función para abrir modal
function openModal(modalId) {
    try {
        var modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('Modal ' + modalId + ' no encontrado');
            return;
        }
        
        // Crear backdrop si no existe
        var backdrop = modal.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
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
        document.body.style.overflow = 'hidden';
        
        // Enfocar elemento enfocable
        var focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    } catch (error) {
        console.error('Error abriendo modal:', error);
    }
}

// Función para cerrar modal
function closeModal(modalId) {
    try {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    } catch (error) {
        console.error('Error cerrando modal:', error);
    }
}

// Las funciones openModal/closeModal se definen en main.js
// No sobrescribimos para evitar conflictos

// Recent items (de index-recent.js)
function loadRecentItems() {
    var container = document.getElementById('recent-items-container');
    if (!container) return;
    
    fetch('/database/data.json?v=' + Date.now())
    .then(function(response) { if (!response.ok) throw new Error('Error cargando datos'); return response.json(); })
    .then(function(data) {
        var allItems = [].concat(
            (data.programas||[]).map(function(i){return Object.assign(i,{category:'Programas',categoryLink:'/downloads?tab=programs&page=1'});}),
            (data.sistemas||[]).map(function(i){return Object.assign(i,{category:'Sistemas',categoryLink:'/downloads?tab=systems&page=1'});}),
            (data.juegos||[]).map(function(i){return Object.assign(i,{category:'Juegos',categoryLink:'/downloads?tab=games&page=1'});}),
            (data.extras||[]).map(function(i){return Object.assign(i,{category:'Extras',categoryLink:'/downloads?tab=extras&page=1'});}),
            (data.apks||[]).map(function(i){return Object.assign(i,{category:'APKs',categoryLink:'/downloads?tab=apks&page=1'});})
        );
        var recentItems = allItems.slice(-4);
        if (recentItems.length === 0) { container.innerHTML = '<p class="no-items">No hay elementos disponibles</p>'; return; }
        container.innerHTML = recentItems.map(function(i){return '<article class="recent-card"><div class="recent-icon"><i class="'+i.icon+'"></i></div><h3>'+i.name+'</h3><p>'+(i.info?i.info.substring(0,80)+(i.info.length>80?'...':''):'')+'</p><a href="'+i.categoryLink+'" class="recent-link">Ver más <i class="fas fa-arrow-right"></i></a></article>';}).join('');
    })
    .catch(function(error) {
        console.error('Error cargando recientes:', error);
        container.innerHTML = '<p class="error-loading">Error al cargar el contenido. <a href="/downloads">Ver catálogo</a></p>';
    });
}

// Modal URL (de index-modal-url.js)
(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var modalParam = urlParams.get('openModal');
    if (!modalParam) return;

    function tryOpenModal(attempts) {
        attempts = attempts || 0;
        var modal = document.getElementById(modalParam);
        if (modal) {
            if (typeof openModal === 'function') openModal(modalParam);
            history.replaceState({}, document.title, window.location.pathname);
        } else if (attempts < 10) {
            setTimeout(function(){ tryOpenModal(attempts+1); }, 100);
        }
    }

    var container = document.getElementById('modales-container');
    if (container && container.innerHTML.trim() === '') {
        fetch('/database/modals.html?v=' + Date.now())
        .then(function(r){ if(!r.ok)throw new Error('HTTP'); return r.text(); })
        .then(function(html){ container.innerHTML = html; setTimeout(tryOpenModal,150); })
        .catch(function(e){ console.error('Error:',e); });
    } else {
        tryOpenModal();
    }
})();

// Init
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
    loadRecentItems();
    // Inicializar botones flotantes (scroll-top)
    if (typeof initFloatingButtons === 'function') {
        initFloatingButtons();
    }
});
