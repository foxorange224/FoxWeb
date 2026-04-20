/**
 * Script para la página about/index.html
 */

// ============================================================================
// SISTEMA DE TEMAS (Funciones globales, pero sin activar el toggle localmente)
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('foxweb_theme') || 'dark';
    setTheme(savedTheme);

    console.log('✅ FoxWeb Documentation loaded');
});

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foxweb_theme', theme);
}

// Modal placeholder (mantener por si se llama desde otros scripts o enlaces)
function showModal(type) {
    const messages = {
        privacy: 'Política de Privacidad',
        terms: 'Términos de Uso',
        cookies: 'Política de Cookies',
        license: 'Licencia MIT'
    };

    alert(`Esta funcionalidad está disponible en la página principal.\n\n${messages[type]}: Visita la página de inicio para ver los detalles.`);
}
