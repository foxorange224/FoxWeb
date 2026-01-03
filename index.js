// ===== FUNCIONES PRINCIPALES =====

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load data.js dynamically
  loadDataJS();
  
  // Initialize search functionality
  initSearch();
  
  // Initialize suggestion form
  initSuggestionForm();
  
  // Handle URL hash for tabs
  handleUrlHash();
});

// Function to load data.js safely
function loadDataJS() {
  const script = document.createElement('script');
  script.src = 'data.js?v=' + Date.now();
  script.onload = function() {
    setTimeout(() => {
      if (typeof FoxWebDB !== 'undefined') {
        console.log('✅ FoxWebDB loaded successfully');
        initApp(FoxWebDB);
      } else {
        console.error('❌ FoxWebDB is still undefined');
        showDataLoadError();
      }
    }, 100);
  };
  script.onerror = function() {
    console.error('❌ Failed to load data.js');
    showDataLoadError();
  };
  document.head.appendChild(script);
}

// Initialize the application with data
function initApp(foxWebData) {
  console.log('🎉 Initializing FoxWeb with', foxWebData);
  
  loadTab('Programas', foxWebData.programas);
  loadTab('Sistemas', foxWebData.sistemas);
  loadTab('Juegos', foxWebData.juegos);
  loadTab('Extras', foxWebData.extras);
  loadTab('APKs', foxWebData.apks);
  
  generateDynamicModals(foxWebData);
}

// Load a single tab
function loadTab(tabId, items) {
  const tab = document.getElementById(tabId);
  if (!tab) return;
  
  if (!items || items.length === 0) {
    tab.innerHTML = `
      <div class="content-container">
        <div class="content-header">
          <h2><i class="fa-solid fa-folder"></i>${getTabTitle(tabId)}</h2>
          <p>${getTabDescription(tabId)}</p>
        </div>
        <div style="text-align:center;padding:50px;color:var(--text-dim);">
          <i class="fa-solid fa-box-open" style="font-size:3em;"></i>
          <p style="margin-top:15px;">No hay contenido disponible en esta categoría.</p>
        </div>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="content-container">
      <div class="content-header">
        <h2><i class="fa-solid fa-folder"></i>${getTabTitle(tabId)}</h2>
        <p>${getTabDescription(tabId)}</p>
      </div>
      <div class="content-grid" id="grid-${tabId}">
  `;
  
  items.forEach((item, index) => {
    const itemId = `${tabId.toLowerCase()}_${index}`;
    html += generateItemHTML(item, tabId, itemId);
  });
  
  html += `
      </div>
      ${getTabFooter(tabId)}
    </div>
  `;
  
  tab.innerHTML = html;
}

// Generate HTML for a single item
function generateItemHTML(item, category, itemId) {
  let buttonHTML = '';
  let badgesHTML = '';
  
  if (item.badges && item.badges.length > 0) {
    badgesHTML = item.badges.map(badge => `<span class="item-badge">${badge}</span>`).join('');
  }
  
  if (item.modal && item.modal !== 'null' && item.modal !== '') {
    buttonHTML = `<button onclick="openModal('${item.modal}')" class="download-btn"><i class="fa-solid fa-download"></i>Descargar</button>`;
  } else if (item.enlace && item.enlace !== '#' && item.enlace !== '') {
    buttonHTML = `<a href="${item.enlace}" class="download-btn" target="_blank"><i class="fa-solid fa-download"></i>Descargar</a>`;
  } else {
    buttonHTML = `<button class="download-btn" disabled><i class="fa-solid fa-ban"></i>No disponible</button>`;
  }
  
  const searchText = `${item.name.toLowerCase()} ${item.info.toLowerCase()} ${item.badges ? item.badges.join(' ').toLowerCase() : ''}`;
  
  return `
    <div class="content-item" data-search="${searchText}" data-id="${itemId}">
      <div class="item-header">
        <div class="item-icon"><i class="${item.icon}"></i></div>
        <div>
          <h3 class="item-title">${item.name}</h3>
        </div>
      </div>
      <p class="item-description">${item.info}</p>
      ${badgesHTML ? `<div class="item-meta">${badgesHTML}</div>` : ''}
      ${buttonHTML}
    </div>
  `;
}

// Get tab title
function getTabTitle(tabId) {
  const titles = {
    'Programas': 'Programas Esenciales',
    'Sistemas': 'Sistemas y Recuperación',
    'Juegos': 'Juegos Clásicos y Ligeros',
    'Extras': 'Extras y Utilidades',
    'APKs': 'APKs para Android'
  };
  return titles[tabId] || tabId;
}

// Get tab description
function getTabDescription(tabId) {
  const descriptions = {
    'Programas': 'Software fundamental, optimizado y con enlaces de larga duración',
    'Sistemas': 'Distribuciones Linux, herramientas de rescate y utilidades de sistema para mantenimiento',
    'Juegos': 'Títulos atemporales que funcionan en cualquier equipo, sin requerimientos excesivos',
    'Extras': 'Drivers, personalización, mantenimiento y herramientas especializadas para tu PC',
    'APKs': 'Aplicaciones útiles, juegos y alternativas ligeras para tu dispositivo móvil'
  };
  return descriptions[tabId] || '';
}

// Get tab footer
function getTabFooter(tabId) {
  if (tabId === 'Juegos') {
    return '<p class="password-notice"><i class="fa-solid fa-key"></i>Contraseña para archivos comprimidos en esta sección: <strong>foxorange224</strong></p>';
  } else if (tabId === 'Sistemas') {
    return '<div style="text-align:center;margin-top:40px;color:var(--text-dim);font-size:0.9em;"><i class="fa-solid fa-circle-info"></i>Algunas ISOs requieren crear un USB booteable con herramientas como <strong>Rufus</strong> o <strong>BalenaEtcher</strong>.</div>';
  } else if (tabId === 'APKs') {
    return '<div style="text-align:center;margin-top:40px;color:var(--text-dim);font-size:0.9em;"><i class="fa-solid fa-shield-alt"></i>Recuerda activar la opción <strong>"Instalar aplicaciones desconocidas"</strong> en los ajustes de tu Android para instalar APKs.</div>';
  } else if (tabId === 'Extras') {
    return '<div style="text-align:center;margin-top:40px;color:var(--text-dim);font-size:0.9em;"><i class="fa-solid fa-lightbulb"></i><strong>Consejo:</strong> Los drivers son específicos para cada sistema operativo. Asegúrate de descargar la versión correcta (32-bit o 64-bit).</div>';
  }
  return '';
}

// Generate dynamic modals
function generateDynamicModals(foxWebData) {
  const container = document.getElementById('modales-container');
  if (!container || !foxWebData.modales) return;
  
  Object.keys(foxWebData.modales).forEach(modalId => {
    const modal = foxWebData.modales[modalId];
    let buttonsHTML = '';
    
    if (modal.botones && modal.botones.length > 0) {
      modal.botones.forEach(boton => {
        const color = boton.color || 'bit-64';
        buttonsHTML += `<a href="${boton.enlace}" class="modal-btn ${color}" target="_blank"><i class="${boton.icono}"></i>${boton.texto}</a>`;
      });
    }
    
    const modalHTML = `
      <div id="${modalId}" class="modal">
        <div class="modal-content">
          <span class="close" onclick="closeModal('${modalId}')">&times;</span>
          <i class="${modal.icono || 'fa-solid fa-download'}" style="font-size:3em;color:var(--primary);margin-bottom:15px;"></i>
          <h2 style="margin-bottom:10px;color:var(--primary);">${modal.titulo}</h2>
          <p style="color:var(--text-dim);margin-bottom:20px;">${modal.descripcion}</p>
          <div class="modal-buttons-container">${buttonsHTML}</div>
          ${modal.nota ? `
          <div style="margin-top:20px;padding:15px;background:rgba(255,69,0,0.05);border-radius:8px;border-left:3px solid var(--primary);">
            <p style="margin:0;font-size:0.9em;color:var(--text-dim);"><i class="fa-solid fa-circle-info"></i>${modal.nota}</p>
          </div>` : ''}
        </div>
      </div>
    `;
    
    container.innerHTML += modalHTML;
  });
}

// Show data load error
function showDataLoadError() {
  const tabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'];
  tabs.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab) {
      tab.innerHTML = `
        <div class="content-container">
          <div style="text-align:center;padding:50px;color:#ff6b6b;">
            <i class="fa-solid fa-exclamation-triangle" style="font-size:3em;"></i>
            <h3>Error al cargar los datos</h3>
            <p>No se pudo cargar la base de datos. Por favor, recarga la página.</p>
            <button onclick="location.reload()" class="download-btn" style="margin-top:20px;">
              <i class="fa-solid fa-rotate"></i>Recargar página
            </button>
          </div>
        </div>
      `;
    }
  });
}

// Tab management
let currentTab = 'Programas';

function openTab(tabName) {
  currentTab = tabName;
  
  const tabContents = document.getElementsByClassName('tab-content');
  const tablinks = document.getElementsByClassName('tablink');
  
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
  }
  
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove('active');
  }
  
  document.getElementById(tabName).classList.add('active');
  
  const activeBtn = Array.from(tablinks).find(btn => 
    btn.getAttribute('onclick') === `openTab('${tabName}')`
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  history.pushState(null, null, `#${tabName}`);
  
  setTimeout(performSearch, 50);
}

// Search functionality
function initSearch() {
  const searchInput = document.getElementById('mainSearch');
  const clearSearchBtn = document.getElementById('clearSearch');
  
  if (!searchInput || !clearSearchBtn) return;
  
  searchInput.addEventListener('input', function() {
    performSearch();
    updateClearButton();
  });
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && searchInput.value) {
      clearSearch();
    }
  });
  
  clearSearchBtn.addEventListener('click', clearSearch);
}

function updateClearButton() {
  const searchInput = document.getElementById('mainSearch');
  const clearSearchBtn = document.getElementById('clearSearch');
  
  if (searchInput.value.trim() !== '') {
    clearSearchBtn.classList.add('visible');
  } else {
    clearSearchBtn.classList.remove('visible');
  }
}

function clearSearch() {
  const searchInput = document.getElementById('mainSearch');
  const clearSearchBtn = document.getElementById('clearSearch');
  
  searchInput.value = '';
  clearSearchBtn.classList.remove('visible');
  performSearch();
  searchInput.focus();
}

function performSearch() {
  const searchInput = document.getElementById('mainSearch');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const activeTab = document.querySelector('.tab-content.active');
  
  if (!activeTab) return;
  
  const gridId = `grid-${currentTab}`;
  const grid = document.getElementById(gridId);
  
  if (!grid) return;
  
  const items = grid.querySelectorAll('.content-item');
  let visibleCount = 0;
  
  items.forEach(item => {
    const searchableText = item.getAttribute('data-search') || '';
    
    if (searchTerm === '' || searchableText.includes(searchTerm)) {
      item.style.display = 'flex';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  let noResults = grid.nextElementSibling;
  
  if (!noResults || !noResults.classList.contains('no-results')) {
    noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <i class="fa-solid fa-search" style="font-size:3em;margin-bottom:15px;color:var(--text-dim);"></i>
      <h3>No se encontraron resultados</h3>
      <p>Intenta con otros términos de búsqueda</p>
    `;
    grid.parentNode.insertBefore(noResults, grid.nextSibling);
  }
  
  noResults.style.display = (visibleCount === 0 && searchTerm !== '') ? 'block' : 'none';
}

// Modal management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const modalContent = modal.querySelector('.modal-content, .info-modal-content, .donate-modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 10);
    
    if (modalId === 'sugerenciaModal') {
      resetSugerenciaForm();
    }
  } else {
    console.warn(`Modal ${modalId} no encontrado`);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
    openModals.forEach(modal => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }
});

// Suggestion form
function initSuggestionForm() {
  const form = document.getElementById('sugerenciaForm');
  if (form) {
    form.addEventListener('submit', submitSuggestion);
  }
}

function validateLink(url) {
  const allowedDomains = [
    'mediafire.com',
    'drive.google.com',
    'mega.nz',
    'dropbox.com',
    'github.com',
    'sourceforge.net',
    'gitlab.com',
    'onedrive.live.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => urlObj.hostname.includes(domain)) || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

function submitSuggestion(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('nombreSugerencia').value.trim();
  const descripcion = document.getElementById('descripcionSugerencia').value.trim();
  const categoria = document.getElementById('categoriaSugerencia').value;
  const enlace = document.getElementById('enlaceSugerencia').value.trim();
  const web = document.getElementById('webSugerencia').value.trim();
  const email = document.getElementById('emailSugerencia').value.trim();
  
  if (!nombre || !descripcion || !categoria || !enlace) {
    alert('Por favor, completa todos los campos requeridos.');
    return;
  }
  
  if (!validateLink(enlace)) {
    alert('⚠️ Enlace no válido. Usa MediaFire, Google Drive, MEGA, Dropbox, GitHub o enlaces HTTPS directos.');
    return;
  }
  
  const submitBtn = document.getElementById('submitSugerencia');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Preparando...';
  submitBtn.disabled = true;
  
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
  
  const tituloCodificado = encodeURIComponent(`[SUGERENCIA] ${nombre}`);
  const cuerpoCodificado = encodeURIComponent(body);
  
  const issueUrl = `https://github.com/foxorange224/foxorange224.github.io/issues/new?title=${tituloCodificado}&body=${cuerpoCodificado}&labels=sugerencia`;
  
  document.getElementById('formularioSugerencia').style.display = 'none';
  document.getElementById('confirmacionSugerencia').style.display = 'block';
  
  setTimeout(() => {
    window.open(issueUrl, '_blank');
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 3000);
  }, 800);
  
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
  
  return false;
}

function saveSuggestionLocal(sugerencia) {
  try {
    let sugerencias = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || [];
    sugerencia.id = Date.now();
    sugerencias.push(sugerencia);
    
    if (sugerencias.length > 100) {
      sugerencias = sugerencias.slice(-100);
    }
    
    localStorage.setItem('foxweb_sugerencias', JSON.stringify(sugerencias));
    console.log('Sugerencia guardada localmente:', sugerencia);
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
  }
}

function resetSugerenciaForm() {
  const form = document.getElementById('sugerenciaForm');
  if (form) form.reset();
  
  document.getElementById('formularioSugerencia').style.display = 'block';
  document.getElementById('confirmacionSugerencia').style.display = 'none';
}

// URL hash handling
function handleUrlHash() {
  const hash = window.location.hash.substring(1);
  const validTabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'];
  const defaultTab = validTabs.includes(hash) ? hash : 'Programas';
  
  openTab(defaultTab);
  updateClearButton();
  
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      showAdminPanel();
    }
  });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
  const hash = window.location.hash.substring(1);
  const validTabs = ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'];
  
  if (validTabs.includes(hash)) {
    openTab(hash);
  }
});

// Admin panel
function showAdminPanel() {
  const password = prompt('Contraseña de administración:');
  if (password === 'foxadmin224') {
    const panel = document.getElementById('adminPanel');
    panel.style.display = 'block';
    panel.innerHTML = loadAdminPanel();
  } else if (password) {
    alert('Contraseña incorrecta');
  }
}

function loadAdminPanel() {
  const sugerencias = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || [];
  const pendientes = sugerencias.filter(s => s.estado === 'pendiente');
  
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h3><i class="fa-solid fa-shield-alt"></i>Panel de Moderación FoxWeb</h3>
      <button onclick="document.getElementById('adminPanel').style.display='none'" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1.2em;">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `;
  
  if (pendientes.length === 0) {
    html += '<p style="color:var(--text-dim);text-align:center;padding:20px;">No hay sugerencias pendientes</p>';
  } else {
    html += '<h4>Sugerencias Pendientes:</h4>';
    
    pendientes.forEach(sug => {
      const fecha = new Date(sug.fecha).toLocaleDateString('es-ES');
      html += `
        <div class="suggestion-item">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div style="flex:1;">
              <strong style="color:white;">${sug.nombre}</strong>
              <span class="item-badge" style="margin-left:10px;">${sug.categoria}</span>
              <p style="color:var(--text-dim);margin:5px 0;font-size:0.9em;">${sug.descripcion}</p>
              <p style="margin:5px 0;">
                <a href="${sug.enlace}" target="_blank" style="color:var(--primary);font-size:0.9em;">
                  <i class="fa-solid fa-link"></i>${new URL(sug.enlace).hostname}
                </a>
              </p>
              ${sug.email ? `<p style="color:#888;font-size:0.8em;"><i class="fa-solid fa-envelope"></i>${sug.email}</p>` : ''}
              <p style="color:#888;font-size:0.8em;"><i class="fa-solid fa-calendar"></i>${fecha}</p>
            </div>
            <div style="margin-left:15px;">
              <button onclick="approveSuggestion(${sug.id})" style="background:#2ea44f;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;margin-bottom:5px;display:block;width:100%;">
                <i class="fa-solid fa-check"></i>Aprobar
              </button>
              <button onclick="rejectSuggestion(${sug.id})" style="background:#dc3545;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;display:block;width:100%;">
                <i class="fa-solid fa-times"></i>Rechazar
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  html += `
    <div style="margin-top:25px;text-align:center;">
      <button onclick="exportSuggestions()" class="download-btn" style="margin:5px;display:inline-flex;width:auto;">
        <i class="fa-solid fa-download"></i>Exportar CSV
      </button>
      <button onclick="clearOldSuggestions()" class="download-btn alt" style="margin:5px;display:inline-flex;width:auto;">
        <i class="fa-solid fa-trash"></i>Limpiar antiguas
      </button>
    </div>
    <p style="color:var(--text-dim);font-size:0.85em;margin-top:20px;text-align:center;">
      <i class="fa-solid fa-circle-info"></i>${sugerencias.length} sugerencias totales en localStorage
    </p>
  `;
  
  return html;
}

function approveSuggestion(id) {
  let sugerencias = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || [];
  sugerencias = sugerencias.map(s => {
    if (s.id === id) {
      s.estado = 'aprobado';
      s.aprobadoEn = new Date().toISOString();
    }
    return s;
  });
  
  localStorage.setItem('foxweb_sugerencias', JSON.stringify(sugerencias));
  alert('✅ Sugerencia aprobada. Ahora agrégala manualmente a FoxWeb.');
  showAdminPanel();
}

function rejectSuggestion(id) {
  let sugerencias = JSON.parse(localStorage.getItem('foxweb_sugerencias')) || [];
  sugerencias = sugerencias.map(s => {
    if (s.id === id) {
      s.estado = 'rechazado';
      s.rechazadoEn = new Date().toISOString();
    }
    return s;
  });
  
  localStorage.setItem('foxweb_sugerencias', JSON.stringify(sugerencias));
  alert('❌ Sugerencia rechazada.');
  showAdminPanel();
}

// Clean old service workers
function cleanOldServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length > 0) {
        const promises = registrations.map(registration => {
          return registration.unregister();
        });
        
        Promise.all(promises).then(function() {
          if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
              cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
              });
            });
          }
        });
      }
    });
  }
}

// Run on load
cleanOldServiceWorkers();
