function loadModals() {
    fetch('/database/modals.html?v=' + Date.now())
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        const modalsContainer = document.getElementById('modales-container');
        if (modalsContainer) {
            modalsContainer.innerHTML = html;
        }
    })
    .catch(error => {
        console.error('Error al cargar modals.html:', error);
        showToast('Error al cargar algunos componentes. Por favor, recarga la página.', 'error');
    });
}
