document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const dateSlider = document.getElementById('date-slider');
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.querySelector('.close-btn');
    const filmNameSpan = document.getElementById('filmName');
    
    // Глобальные переменные
    let allMovies = []; // Тут будем хранить загруженные фильмы
    let selectedDate = new Date(); // По умолчанию выбрана "Сегодня"

    // --- 1. ГЕНЕРАЦИЯ ДАТ (-3 ... Сегодня ... +3) ---
    function generateDates() {
        dateSlider.innerHTML = '';
        const today = new Date();
        
        // Цикл от -3 до +3
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Форматируем дату для атрибута (YYYY-MM-DD)
            const dateString = date.toISOString().split('T')[0];
            
            // Форматируем для отображения (День недели и Число)
            const dayNumber = date.getDate();
            const monthName = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''); // "ноя", "дек"
            
            // Определяем подпись (Сегодня/Завтра/День недели)
            let dayLabel = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            if (i === 0) dayLabel = 'Сегодня';
            if (i === 1) dayLabel = 'Завтра';
            if (i === -1) dayLabel = 'Вчера';

            // Создаем HTML элемент
            const card = document.createElement('div');
            card.className = `date-card ${i === 0 ? 'active' : ''}`;
            card.setAttribute('data-date', dateString);
            card.innerHTML = `
                <span class="day-name">${dayLabel}</span>
                <span class="day-number">${dayNumber} ${monthName}</span>
            `;

            // Клик по дате
            card.addEventListener('click', () => {
                // Визуальное переключение
                document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                // Фильтрация фильмов
                selectedDate = dateString;
                renderMovies(selectedDate);
            });

            dateSlider.appendChild(card);
        }
        
        // Устанавливаем текущую дату в формате строки для первой загрузки
        selectedDate = today.toISOString().split('T')[0];
    }

    // --- 2. ЗАГРУЗКА И ФИЛЬТРАЦИЯ ФИЛЬМОВ ---
    function renderMovies(dateToFilter) {
        moviesContainer.innerHTML = '';
        
        // Фильтруем: есть ли выбранная дата в массиве dates у фильма?
        const filteredMovies = allMovies.filter(movie => {
            // Если у фильма нет поля dates, показываем его всегда (или скрываем, как решишь)
            if (!movie.dates) return true; 
            return movie.dates.includes(dateToFilter);
        });

        if (filteredMovies.length === 0) {
            moviesContainer.innerHTML = '<div style="text-align:center; padding: 40px; color: #64748b;">На эту дату сеансов нет</div>';
            return;
        }

        filteredMovies.forEach(movie => {
            const cardHTML = createMovieCard(movie);
            moviesContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        // После отрисовки обновляем фильтры категорий (сбрасываем на "Все")
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    }

    fetch('movies.json')
        .then(response => response.json())
        .then(movies => {
            allMovies = movies; // Сохраняем в глобальную переменную
            generateDates();    // Рисуем даты
            renderMovies(selectedDate); // Рисуем фильмы на сегодня
            initFilters();      // Включаем кнопки жанров
        })
        .catch(error => {
            console.error(error);
            moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Ошибка загрузки расписания.</p>';
        });

    // --- 3. HTML ШАБЛОН КАРТОЧКИ ---
    function createMovieCard(movie) {
        const tagsHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
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
                    <div class="row-meta">${tagsHTML}</div>
                    <p class="row-desc">${movie.description}</p>
                </div>
                <div class="row-sessions">
                    <div class="sessions-grid">${sessionsHTML}</div>
                </div>
            </div>
        `;
    }

    // --- 4. ФИЛЬТРЫ ПО КАТЕГОРИЯМ ---
    function initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');
                const rows = document.querySelectorAll('.movie-row');

                rows.forEach(row => {
                    if (filterValue === 'all' || row.dataset.category === filterValue) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 5. МОДАЛКА ---
    moviesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.buy-ticket-btn');
        if (btn) {
            filmNameSpan.textContent = btn.getAttribute('data-film');
            modal.style.display = 'flex';
        }
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});
