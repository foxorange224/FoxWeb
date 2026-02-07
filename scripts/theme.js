// 1. Aplicar tema guardado al cargar la página
const initialTheme = localStorage.getItem('foxweb_theme') || 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);

// 2. Función para controlar los iconos por JS
window.syncIcons = function() {
    const theme = document.documentElement.getAttribute('data-theme');
    const btn = document.getElementById('themeToggle');

    if (btn) {
        const moon = btn.querySelector('.fa-moon');
        const sun = btn.querySelector('.fa-sun');

        if (moon && sun) {
            // Si es oscuro, mostramos el sol para cambiar a claro
            // Si es claro, mostramos la luna para cambiar a oscuro
            moon.style.display = (theme === 'dark') ? 'none' : 'inline-block';
            sun.style.display = (theme === 'dark') ? 'inline-block' : 'none';
        }
    }
};

// 3. Delegación de eventos para el botón
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#themeToggle');
    if (!btn) return;

    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Cambiar atributo y guardar
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('foxweb_theme', newTheme);

    // Ejecutar el cambio visual de los iconos
    window.syncIcons();
});
