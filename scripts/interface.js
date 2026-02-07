// panel.js
document.addEventListener("DOMContentLoaded", () => {
    fetch('/blog/panel.html')
    .then(response => response.text())
    .then(data => {
        // Inyectar el HTML en el placeholder del index.html
        document.getElementById('header-placeholder').innerHTML = data;

        // Forzar a JS a ocultar el icono sobrante inmediatamente
        if (typeof window.syncIcons === 'function') {
            window.syncIcons();
        }
    });

    // Carga del footer (opcional)
    fetch('/blog/footer.html')
    .then(res => res.text())
    .then(html => document.getElementById('footer-placeholder').innerHTML = html)
    .catch(() => {});
});
