document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const dateSlider = document.getElementById('date-slider');
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.querySelector('.close-btn');
    const filmNameSpan = document.getElementById('filmName');
    
    // Глобальные переменные
    let allMovies = []; 
    let selectedDate = new Date(); 

    // --- 1. ГЕНЕРАЦИЯ ДАТ (-3 ... Сегодня ... +3) ---
    function generateDates() {
        dateSlider.innerHTML = '';
        const today = new Date();
        
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            const dayNumber = date.getDate();
            const monthName = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
            
            let dayLabel = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            if (i === 0) dayLabel = 'Сегодня';
            if (i === 1) dayLabel = 'Завтра';
            if (i === -1) dayLabel = 'Вчера';

            const card = document.createElement('div');
            card.className = `date-card ${i === 0 ? 'active' : ''}`;
            card.setAttribute('data-date', dateString);
            card.innerHTML = `
                <span class="day-name">${dayLabel}</span>
                <span class="day-number">${dayNumber} ${monthName}</span>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                selectedDate = dateString;
                renderMovies(selectedDate);
            });

            dateSlider.appendChild(card);
        }
        selectedDate = today.toISOString().split('T')[0];
    }

    // --- 2. РЕНДЕР ФИЛЬМОВ ---
    function renderMovies(dateToFilter) {
        moviesContainer.innerHTML = '';
        
        const filteredMovies = allMovies.filter(movie => {
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
        
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    }

    fetch('movies.json')
        .then(response => response.json())
        .then(movies => {
            allMovies = movies; 
            generateDates();    
            renderMovies(selectedDate); 
            initFilters();      
        })
        .catch(error => {
            console.error(error);
            moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Ошибка загрузки расписания.</p>';
        });

    // --- 3. СОЗДАНИЕ КАРТОЧКИ (С ЦЕНОЙ) ---
    function createMovieCard(movie) {
        const tagsHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        
        // ОБНОВЛЕННАЯ КНОПКА С ЦЕНОЙ
        const sessionsHTML = movie.sessions.map(session => `
            <button class="session-btn buy-ticket-btn" 
                    data-film="${movie.title}" 
                    data-time="${session.time}"
                    data-price="${session.price}">
                <div class="btn-top">
                    <span class="session-time">${session.time}</span>
                </div>
                <div class="btn-bottom">
                    <span class="session-price">${session.price} ₽</span>
                    <span class="session-format" style="${session.isSpecial ? 'color: #f59e0b;' : ''}">${session.format}</span>
                </div>
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

    // --- 4. ФИЛЬТРЫ ---
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
                        row.style.display = ''; 
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 5. МОДАЛКА (С ЦЕНОЙ) ---
    moviesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.buy-ticket-btn');
        if (btn) {
            const title = btn.getAttribute('data-film');
            const time = btn.getAttribute('data-time');
            const price = btn.getAttribute('data-price');
            
            // Выводим: Название (Время) - Цена
            filmNameSpan.innerHTML = `${title}<br><span style="font-size:0.8em; color:var(--accent-blue)">${time} — ${price} ₽</span>`;
            modal.style.display = 'flex';
        }
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
});
