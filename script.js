document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.querySelector('.close-btn');
    const filmNameSpan = document.getElementById('filmName');
    
    // --- 1. ЗАГРУЗКА ФИЛЬМОВ ИЗ JSON ---
    fetch('movies.json')
        .then(response => response.json())
        .then(movies => {
            moviesContainer.innerHTML = ''; // Очищаем "Загрузка..."
            
            movies.forEach(movie => {
                const cardHTML = createMovieCard(movie);
                moviesContainer.insertAdjacentHTML('beforeend', cardHTML);
            });

            // После того как фильмы загрузились, запускаем логику фильтров и модалок
            initFilters();
            initModalLogic();
        })
        .catch(error => {
            console.error('Ошибка загрузки фильмов:', error);
            moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Не удалось загрузить расписание.</p>';
        });

    // --- 2. ФУНКЦИЯ СОЗДАНИЯ HTML КАРТОЧКИ ---
    function createMovieCard(movie) {
        // Генерируем теги (badges)
        const tagsHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        
        // Генерируем кнопки сеансов
        const sessionsHTML = movie.sessions.map(session => `
            <button class="session-btn buy-ticket-btn" data-film="${movie.title} (${session.time})">
                <span class="session-time">${session.time}</span>
                <span class="session-format" style="${session.isSpecial ? 'color: #f59e0b;' : ''}">${session.format}</span>
            </button>
        `).join('');

        return `
            <div class="movie-row" data-category="${movie.category}">
                <div class="row-poster">
                    <span class="age-badge ${movie.ageClass}">${movie.age}</span>
                    <img src="${movie.poster}" alt="${movie.title}">
                </div>
                <div class="row-info">
                    <h2 class="row-title">${movie.title}</h2>
                    <div class="row-meta">
                        ${tagsHTML}
                    </div>
                    <p class="row-desc">${movie.description}</p>
                </div>
                <div class="row-sessions">
                    <div class="sessions-grid">
                        ${sessionsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    // --- 3. ЛОГИКА ФИЛЬТРОВ ---
    function initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const movieRows = document.querySelectorAll('.movie-row');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                movieRows.forEach(row => {
                    const category = row.getAttribute('data-category');
                    if (filterValue === 'all' || category === filterValue) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 4. ЛОГИКА МОДАЛЬНОГО ОКНА (Делегирование событий) ---
    function initModalLogic() {
        // Используем делегирование, так как кнопки создаются динамически
        moviesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.buy-ticket-btn');
            if (btn) {
                const filmTitle = btn.getAttribute('data-film');
                filmNameSpan.textContent = filmTitle;
                modal.style.display = 'flex';
            }
        });
    }

    // Закрытие модалки
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- 5. ЛОГИКА ДАТ (Визуальная) ---
    const dateCards = document.querySelectorAll('.date-card');
    dateCards.forEach(card => {
        card.addEventListener('click', () => {
            dateCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
});
