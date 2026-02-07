            fetch('/database/posts.json')
            .then(response => response.json())
            .then(posts => {
                const lista = document.getElementById('blog-index');
                const buscador = document.getElementById('blogSearch');
                const btnBorrar = document.getElementById('clearSearch');

                // --- Función para dibujar la lista ---
                function renderPosts(filteredPosts) {
                    lista.innerHTML = ''; // Limpiar lista antes de renderizar

                    // Si no hay resultados, mostrar mensaje personalizado
                    if (filteredPosts.length === 0) {
                        lista.innerHTML = `
                        <li style="padding: 40px 20px; color: var(--text-dim); text-align: center; border: none;">
                        <i class="fa-solid fa-circle-xmark" style="display: block; font-size: 2.5rem; margin-bottom: 15px; color: var(--primary);"></i>
                        <strong style="font-size: 1.1rem; display: block; margin-bottom: 5px;">No se encuentra ningun resultado</strong>
                        <span style="font-size: 0.9rem; opacity: 0.7;">Intenta buscar otra cosa o revisa la ortografía.</span>
                        </li>`;
                        return;
                    }

                    // Dibujar cada post encontrado
                    filteredPosts.forEach(post => {
                        const item = document.createElement('li');

                        // Estilos de la fila
                        item.style.borderBottom = "1px solid var(--border)";
                        item.style.padding = "15px 10px";
                        item.style.display = "flex";
                        item.style.alignItems = "center";
                        item.style.transition = "background-color 0.2s ease"; // Un toque de suavidad

                        item.innerHTML = `
                        <i class="fa-solid fa-file-lines" style="color: var(--text-dim); margin-right: 15px;"></i>
                        <a href="${post.url}" style="color: var(--text-main); text-decoration: none; font-size: 1.1rem; flex-grow: 1;">
                        ${post.title}
                        </a>
                        <i class="fa-solid fa-angle-right" style="color: var(--primary); font-size: 0.8rem;"></i>
                        `;

                        // Efecto Hover
                        item.onmouseover = () => { item.style.backgroundColor = "rgba(255,255,255,0.05)"; };
                        item.onmouseout = () => { item.style.backgroundColor = "transparent"; };

                        lista.appendChild(item);
                    });
                }

                // --- Lógica del Buscador ---
                buscador.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();

                    // Mostrar/Ocultar la X según si hay texto
                    btnBorrar.style.display = term.length > 0 ? 'block' : 'none';

                    const filtered = posts.filter(post =>
                    post.title.toLowerCase().includes(term)
                    );

                    renderPosts(filtered);
                });

                // --- Lógica del Botón X (Borrar) ---
                btnBorrar.addEventListener('click', () => {
                    buscador.value = '';             // Limpiar el texto
                    btnBorrar.style.display = 'none';   // Ocultar la X
                    renderPosts(posts);              // Mostrar todos los posts
                    buscador.focus();                // Devolver el cursor al input
                });

                // --- Carga Inicial ---
                renderPosts(posts);
            })
            .catch(err => {
                console.error('Error cargando índice:', err);
                document.getElementById('blog-index').innerHTML =
                `<li style="padding: 20px; color: var(--primary);">Error al cargar los artículos.</li>`;
            });
