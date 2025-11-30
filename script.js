document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const dateSlider = document.getElementById('date-slider');
    
    // Модалка покупки
    const ticketModal = document.getElementById('ticketModal');
    const closeTicketBtn = document.querySelector('.close-btn'); // Первая кнопка закрытия
    const filmNameSpan = document.getElementById('filmName');
    
    // Модалка инфо (Новая)
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    const infoTrailer = document.getElementById('infoTrailer');
    
    // Глобальные переменные
    let allMovies = []; 
    let selectedDate = new Date(); 

    // --- 1. ГЕНЕРАЦИЯ ДАТ ---
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

    // --- 2. ЗАГРУЗКА ДАННЫХ ---
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            allMovies = data.schedule.map(item => {
                const movieInfo = data.library[item.movieId];
                return {
                    ...item,       
                    ...movieInfo   
                };
            });

            generateDates();    
            renderMovies(selectedDate); 
            initFilters();      
        })
        .catch(error => {
            console.error(error);
            moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Ошибка загрузки расписания.</p>';
        });

    // --- 3. РЕНДЕР КАРТОЧЕК ---
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

    // --- 4. HTML ШАБЛОН ---
    function createMovieCard(movie) {
        const tagsHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        
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
                
                <!-- ОБЕРТКА ДЛЯ КЛИКА (ИНФОРМАЦИЯ О ФИЛЬМЕ) -->
                <!-- Мы добавляем data-атрибут с ID фильма, чтобы найти его потом -->
                <div class="movie-primary-content" data-movieid="${movie.movieId}">
                    <div class="row-poster">
                        <span class="age-badge ${movie.ageClass}">${movie.age}</span>
                        <img src="${movie.poster}" alt="${movie.title}">
                    </div>
                    <div class="row-info">
                        <h2 class="row-title">${movie.title}</h2>
                        <div class="row-meta">${tagsHTML}</div>
                        <p class="row-desc">${movie.description}</p>
                        <span style="font-size: 0.8rem; color: var(--accent-blue); margin-top: 15px; font-weight:700;">ПОДРОБНЕЕ И ТРЕЙЛЕР →</span>
                    </div>
                </div>

                <div class="row-sessions">
                    <div class="sessions-grid">${sessionsHTML}</div>
                </div>
            </div>
        `;
    }

    // --- 5. ФИЛЬТРЫ ---
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

    // --- 6. ОБРАБОТКА КЛИКОВ (ДЕЛЕГИРОВАНИЕ) ---
    moviesContainer.addEventListener('click', (e) => {
        
        // 1. Если клик по кнопке КУПИТЬ БИЛЕТ
        const buyBtn = e.target.closest('.buy-ticket-btn');
        if (buyBtn) {
            const title = buyBtn.getAttribute('data-film');
            const time = buyBtn.getAttribute('data-time');
            const price = buyBtn.getAttribute('data-price');
            filmNameSpan.innerHTML = `${title}<br><span style="font-size:0.8em; color:var(--accent-blue)">${time} — ${price} ₽</span>`;
            ticketModal.style.display = 'flex';
            return; // Выходим, чтобы не сработало условие ниже
        }

        // 2. Если клик по ОПИСАНИЮ (левая часть)
        const infoBlock = e.target.closest('.movie-primary-content');
        if (infoBlock) {
            const id = infoBlock.getAttribute('data-movieid');
            // Ищем фильм в массиве allMovies по ID (так как allMovies уже склеен)
            // Но в allMovies могут быть дубли одного и того же фильма для разных дат, 
            // поэтому просто ищем первый попавшийся с таким movieId
            const movie = allMovies.find(m => m.movieId === id);
            
            if (movie) {
                openInfoModal(movie);
            }
        }
    });

    // --- 7. ФУНКЦИИ МОДАЛОК ---

    function openInfoModal(movie) {
        // Заполняем данные
        infoPoster.src = movie.poster;
        infoTitle.textContent = movie.title;
        infoDesc.textContent = movie.description;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        
        // Вставляем ссылку на трейлер
        // Внимание: используем embed ссылку YouTube
        if(movie.trailer) {
            infoTrailer.src = `https://www.youtube.com/embed/${movie.trailer}?autoplay=1`;
        } else {
            infoTrailer.src = '';
        }

        infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем скролл фона
    }

    // Закрытие окна ПОКУПКИ
    closeTicketBtn.addEventListener('click', () => {
        ticketModal.style.display = 'none';
    });

    // Закрытие окна ИНФО
    closeInfoBtn.addEventListener('click', closeInfo);

    function closeInfo() {
        infoModal.style.display = 'none';
        infoTrailer.src = ''; // Останавливаем видео (очищаем src)
        document.body.style.overflow = ''; // Разблокируем скролл
    }

    // Закрытие по клику вне окна
    window.addEventListener('click', (e) => {
        if (e.target === ticketModal) {
            ticketModal.style.display = 'none';
        }
        if (e.target === infoModal) {
            closeInfo();
        }
    });
});
