        document.addEventListener('DOMContentLoaded', function () {
            const currentUrl = window.location.href;
            const urlElement = document.getElementById('currentUrl');
            if (currentUrl && !currentUrl.endsWith('/404.html') && currentUrl !== window.location.origin + '/') {
                urlElement.innerHTML = `<i class="fa-solid fa-link"></i> URL: ${currentUrl}`;
                urlElement.style.display = 'block';
            } else {
                urlElement.style.display = 'none';
            }
        });
