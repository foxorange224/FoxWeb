// FoxWeb Profile Tracker - Tracks user activity for profile page

(function() {
    'use strict';
    
    const CONFIG = {
        maxHistoryItems: 50,
        statsKey: 'foxweb_stats',
        historyKey: 'foxweb_download_history',
        favoritesKey: 'foxweb_favorites'
    };
    
    function getCategoryFromCard(card) {
        const grid = card?.closest('.content-grid');
        if (!grid) return 'Unknown';
        
        const gridId = grid.id.replace('grid-', '');
        
        const categoryMap = {
            'Programas': 'Programas',
            'Sistemas': 'Sistemas',
            'Juegos': 'Juegos',
            'Extras': 'Extras',
            'APKs': 'APKs'
        };
        
        return categoryMap[gridId] || 'Unknown';
    }
    
    function getFavoritesList() {
        try {
            const favNames = JSON.parse(localStorage.getItem(CONFIG.favoritesKey)) || [];
            if (typeof favNames[0] === 'string') {
                return favNames.map(f => {
                    const [name, category] = f.split('_');
                    return { name, category };
                });
            }
            return favNames;
        } catch (e) {
            return [];
        }
    }
    
    function updateFavoriteIcon(btn, isFavorite) {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            icon.style.color = isFavorite ? '#ff4757' : '';
        }
    }
    
    function updateAllFavoriteIcons() {
        const favorites = getFavoritesList();
        const cards = document.querySelectorAll('.content-card');
        
        cards.forEach(card => {
            const name = card.querySelector('.card-title-text')?.textContent;
            const category = getCategoryFromCard(card);
            const favBtn = card.querySelector('.card-action-btn');
            
            const isFav = favorites.some(f => f.name === name && f.category === category);
            if (favBtn && isFav) {
                updateFavoriteIcon(favBtn, true);
            }
        });
    }
    
    function addToHistory(name, category) {
        try {
            let history = JSON.parse(localStorage.getItem(CONFIG.historyKey)) || [];
            
            history = history.filter(item => !(item.name === name && item.category === category));
            
            history.unshift({
                name: name,
                category: category,
                date: new Date().toISOString(),
                url: window.location.href
            });
            
            if (history.length > CONFIG.maxHistoryItems) {
                history = history.slice(0, CONFIG.maxHistoryItems);
            }
            
            localStorage.setItem(CONFIG.historyKey, JSON.stringify(history));
        } catch (e) {
            console.error('Error adding to history:', e);
        }
    }
    
    function incrementStat(name, category) {
        try {
            let stats = JSON.parse(localStorage.getItem(CONFIG.statsKey)) || {};
            
            const key = name + '_' + category;
            stats[key] = (stats[key] || 0) + 1;
            
            localStorage.setItem(CONFIG.statsKey, JSON.stringify(stats));
        } catch (e) {
            console.error('Error incrementing stat:', e);
        }
    }
    
    function toggleFavorite(name, category, btn) {
        try {
            let favorites = getFavoritesList();
            
            const exists = favorites.some(f => f.name === name && f.category === category);
            
            if (exists) {
                favorites = favorites.filter(f => !(f.name === name && f.category === category));
                showToast('Eliminado de favoritos', 'info');
                updateFavoriteIcon(btn, false);
            } else {
                favorites.push({ name, category });
                showToast('Agregado a favoritos', 'success');
                updateFavoriteIcon(btn, true);
            }
            
            localStorage.setItem(CONFIG.favoritesKey, JSON.stringify(favorites.map(f => f.name + '_' + f.category)));
        } catch (e) {
            console.error('Error toggling favorite:', e);
        }
    }
    
    function showToast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log('[' + type + '] ' + message);
        }
    }
    
    function initTracker() {
        if (!document.getElementById('grid-Programas')) {
            return;
        }
        
        document.addEventListener('click', function(e) {
            const card = e.target.closest('.content-card');
            const downloadBtn = e.target.closest('.download-btn');
            
            if (downloadBtn && card) {
                const name = card.querySelector('.card-title-text')?.textContent;
                const category = getCategoryFromCard(card);
                
                if (name) {
                    addToHistory(name, category);
                    incrementStat(name, category);
                }
            }
            
            const favBtn = e.target.closest('.card-action-btn');
            if (favBtn && card) {
                const name = card.querySelector('.card-title-text')?.textContent;
                const category = getCategoryFromCard(card);
                
                if (name) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(name, category, favBtn);
                }
            }
        }, true);
        
        setTimeout(function() {
            updateAllFavoriteIcons();
        }, 1500);
    }
    
    document.addEventListener('DOMContentLoaded', initTracker);
    
    window.ProfileTracker = {
        addToHistory: addToHistory,
        incrementStat: incrementStat,
        toggleFavorite: toggleFavorite,
        updateFavoriteIcons: updateAllFavoriteIcons
    };
})();