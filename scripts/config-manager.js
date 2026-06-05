'use strict';

/**
 * CONFIGURATION MANAGER FOR FOXWEB
 * Handles the configuration modal, saving/loading settings from localStorage
 */

const ConfigManager = {
    // Default values
    defaults: {
        theme: 'light',
        view: 'cards',
        itemsPerPage: 32,
        username: 'Usuario',
            categories: ['Programas', 'Sistemas', 'Juegos', 'Extras', 'APKs'],
            primaryColor: '#ff5e00'
    },

    // Load all settings
    loadSettings() {
        return {
            theme: localStorage.getItem('foxweb_theme') || this.defaults.theme,
            view: localStorage.getItem('foxweb_view') || this.defaults.view,
            itemsPerPage: parseInt(localStorage.getItem('foxweb_items_per_page')) || this.defaults.itemsPerPage,
            username: localStorage.getItem('foxweb_username') || this.defaults.username,
            categories: JSON.parse(localStorage.getItem('foxweb_categories') || JSON.stringify(this.defaults.categories)),
            primaryColor: localStorage.getItem('foxweb_primary_color') || this.defaults.primaryColor
        };
    },

    // Fill the modal fields with current settings
    fillModal() {
        const settings = this.loadSettings();
        
        const usernameEl = document.getElementById('cfgUsername');
        if (usernameEl) {
            usernameEl.value = settings.username;
        }

        const itemsPerPageEl = document.getElementById('cfgItemsPerPage');
        if (itemsPerPageEl) {
            itemsPerPageEl.value = settings.itemsPerPage;
        }
        
        const customCursorToggleEl = document.getElementById('cfgCustomCursorToggle');
        if (customCursorToggleEl) {
            customCursorToggleEl.checked = settings.custom_cursor;
        }
        
        const primaryColorEl = document.getElementById('cfgPrimaryColor');
        const primaryColorHexEl = document.getElementById('cfgPrimaryColorHex');
        if (primaryColorEl) {
            primaryColorEl.value = settings.primaryColor;
            if (primaryColorHexEl) primaryColorHexEl.textContent = settings.primaryColor;
        }

        // Tabs
        document.querySelectorAll('.cfg-tab-checkbox').forEach(cb => {
            cb.checked = settings.categories.includes(cb.value);
        });

        // Trigger updates for buttons
        if (typeof window.setCfgTheme === 'function') window.setCfgTheme(settings.theme);
        if (typeof window.setCfgView === 'function') window.setCfgView(settings.view);
        if (typeof window.setCfgPrimaryColor === 'function') window.setCfgPrimaryColor(settings.primaryColor);
    },

    initListeners() {
        const settings = this.loadSettings();
        
        const usernameEl = document.getElementById('cfgUsername');
        if (usernameEl) {
            usernameEl.addEventListener('input', (e) => {
                localStorage.setItem('foxweb_username', e.target.value.trim());
            });
        }

        const itemsPerPageEl = document.getElementById('cfgItemsPerPage');
        if (itemsPerPageEl) {
            itemsPerPageEl.addEventListener('change', (e) => {
                localStorage.setItem('foxweb_items_per_page', e.target.value);
            });
        }
        
        const customCursorToggleEl = document.getElementById('cfgCustomCursorToggle');
        if (customCursorToggleEl) {
            customCursorToggleEl.addEventListener('change', (e) => {
                localStorage.setItem('foxweb_custom_cursor', e.target.checked);
            });
        }
        
        const primaryColorEl = document.getElementById('cfgPrimaryColor');
        if (primaryColorEl) {
            primaryColorEl.addEventListener('input', (e) => {
                const color = e.target.value;
                const primaryColorHexEl = document.getElementById('cfgPrimaryColorHex');
                if (primaryColorHexEl) primaryColorHexEl.textContent = color;
                window.setCfgPrimaryColor(color);
            });
        }

        // Tabs
        document.querySelectorAll('.cfg-tab-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const selectedTabs = [];
                document.querySelectorAll('.cfg-tab-checkbox:checked').forEach(c => selectedTabs.push(c.value));
                localStorage.setItem('foxweb_categories', JSON.stringify(selectedTabs));
            });
        });
    },

    save(settings) {
        localStorage.setItem('foxweb_theme', settings.theme);
        localStorage.setItem('foxweb_view', settings.view);
        localStorage.setItem('foxweb_items_per_page', settings.itemsPerPage);
        localStorage.setItem('foxweb_username', settings.username);
        localStorage.setItem('foxweb_categories', JSON.stringify(settings.categories));
        localStorage.setItem('foxweb_configured', 'true');
        localStorage.setItem('foxweb_first_visit', 'false');
    }
};

// Global functions for the modal buttons
window.setCfgTheme = function(theme) {
    const btnLight = document.getElementById('cfgThemeLight');
    const btnDark = document.getElementById('cfgThemeDark');
    if (btnLight) btnLight.classList.toggle('active', theme === 'light');
    if (btnDark) btnDark.classList.toggle('active', theme === 'dark');
    
    // Apply theme globally
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foxweb_theme', theme);

    // Re-apply primary color to update contrast based on new theme
    const primaryColor = localStorage.getItem('foxweb_primary_color') || ConfigManager.defaults.primaryColor;
    window.setCfgPrimaryColor(primaryColor);
};

window.setCfgPrimaryColor = function(color) {
    // Update primary color
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('foxweb_primary_color', color);
    
    // 1. Contrast for text ON TOP OF primary color (background)
    const contrastColor = getContrastYIQ(color);
    document.documentElement.style.setProperty('--primary-text-color', contrastColor);

    // 2. Contrast for primary color AS TEXT on theme background
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // Improved contrast detection
    const brightness = getBrightness(color);
    if (theme === 'dark') {
        // In dark theme, if primary color is too dark, use white
        document.documentElement.style.setProperty('--primary-accessible', brightness < 150 ? '#ffffff' : color);
    } else {
        // In light theme, if primary color is too light, use black
        document.documentElement.style.setProperty('--primary-accessible', brightness > 200 ? '#000000' : color);
    }
};

function getBrightness(hexcolor) {
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) {
        hexcolor = hexcolor[0] + hexcolor[0] + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2];
    }
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function getContrastYIQ(hexcolor) {
    return getBrightness(hexcolor) >= 128 ? 'black' : 'white';
}

window.setCfgView = function(view) {
    const btnCards = document.getElementById('cfgBtnCards');
    const btnCompact = document.getElementById('cfgBtnCompact');
    if (btnCards) btnCards.classList.toggle('active', view === 'cards');
    if (btnCompact) btnCompact.classList.toggle('active', view === 'compact');
    
    localStorage.setItem('foxweb_view', view);

    // Apply view change to all tabs immediately
    if (typeof VALID_TABS !== 'undefined') {
        VALID_TABS.forEach(tabId => {
            if (typeof setViewMode === 'function') {
                setViewMode(tabId, view);
            }
        });
    }
};

window.cfgSaveAndClose = function() {
    const selectedTabs = [];
    document.querySelectorAll('.cfg-tab-checkbox:checked').forEach(cb => {
        selectedTabs.push(cb.value);
    });

    if (selectedTabs.length === 0) {
        alert('Selecciona al menos una pestaña');
        return;
    }

    const settings = {
        theme: document.documentElement.getAttribute('data-theme') || 'light',
        view: localStorage.getItem('foxweb_view') || 'cards',
        itemsPerPage: document.getElementById('cfgItemsPerPage').value,
        username: document.getElementById('cfgUsername').value.trim(),
            categories: selectedTabs,
            ads_enabled: document.getElementById('cfgAdsToggle').checked
    };

    ConfigManager.save(settings);
    
    if (typeof window.showToast === 'function') {
        window.showToast('Configuración guardada', 'success');
    }

    // Reload page to apply all changes immediately
    setTimeout(() => {
        location.reload();
    }, 1000);
};

window.cfgApplyItemsPerPage = function() {
    const val = document.getElementById('cfgItemsPerPage').value;
    localStorage.setItem('foxweb_items_per_page', val);
    
    if (typeof window.showToast === 'function') {
        window.showToast('Cambio aplicado, recargando...', 'info');
    }
    
    setTimeout(() => {
        location.reload();
    }, 800);
};

window.cfgExportData = function() {
    const data = {
        username: localStorage.getItem('foxweb_username'),
        favorites: localStorage.getItem('foxweb_favorites'),
        history: localStorage.getItem('foxweb_download_history'),
        stats: localStorage.getItem('foxweb_stats'),
        theme: localStorage.getItem('foxweb_theme'),
        view: localStorage.getItem('foxweb_view'),
        itemsPerPage: localStorage.getItem('foxweb_items_per_page'),
        notifications: localStorage.getItem('foxweb_notifications'),
        categories: localStorage.getItem('foxweb_categories'),
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foxweb-data-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Datos exportados');
};

window.cfgImportData = function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.favorites) localStorage.setItem('foxweb_favorites', data.favorites);
            if (data.history) localStorage.setItem('foxweb_download_history', data.history);
            if (data.stats) localStorage.setItem('foxweb_stats', data.stats);
            if (data.username) localStorage.setItem('foxweb_username', data.username);
            if (data.theme) localStorage.setItem('foxweb_theme', data.theme);
            if (data.view) localStorage.setItem('foxweb_view', data.view);
            if (data.itemsPerPage) localStorage.setItem('foxweb_items_per_page', data.itemsPerPage);
            if (data.notifications) localStorage.setItem('foxweb_notifications', data.notifications);
            if (data.categories) localStorage.setItem('foxweb_categories', data.categories);
            alert('Datos importados');
            location.reload();
        } catch (err) {
            alert('Error al importar');
        }
    };
    reader.readAsText(file);
};

window.cfgClearData = function() {
    if (confirm('¿Borrar todos los datos? Esto no se puede deshacer.')) {
        const keys = ['foxweb_favorites', 'foxweb_download_history', 'foxweb_stats', 'foxweb_notifications', 'foxweb_username', 'foxweb_theme', 'foxweb_view', 'foxweb_categories', 'foxweb_configured', 'foxweb_first_visit', 'foxweb_items_per_page'];
        keys.forEach(k => localStorage.removeItem(k));
        window.location.href = '/welcome';
    }
};

window.handlePanelConfigClick = function() {
    const path = window.location.pathname;
    if (typeof window.openModal === 'function') {
        openModal('configModal');
    } else {
        if (path === '/profile' || path.includes('/profile')) {
            window.location.href = '/profile/config';
        } else {
            window.location.href = '/?config=true';
        }
    }
};

function updatePanelConfigVisibility() {
    const btn = document.getElementById('panelConfigBtn');
    if (!btn) return;
    
    const isProfile = window.location.pathname === '/profile' || window.location.pathname.includes('/profile');
    btn.style.display = isProfile ? 'none' : 'flex';
}

// Initialize visibility and listen for changes
document.addEventListener('DOMContentLoaded', () => {
    updatePanelConfigVisibility();
    const settings = ConfigManager.loadSettings();
    if (typeof window.setCfgPrimaryColor === 'function') {
        window.setCfgPrimaryColor(settings.primaryColor);
    }
});
window.addEventListener('popstate', updatePanelConfigVisibility);
// Also check on intervals or use a MutationObserver if the panel is loaded dynamically
setInterval(updatePanelConfigVisibility, 500);

document.addEventListener('DOMContentLoaded', () => {
    ConfigManager.initListeners();
});

