document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const dateSlider = document.getElementById('date-slider');
    
    // Модальные окна
    const ticketModal = document.getElementById('ticketModal');
    const closeTicketBtn = document.querySelector('.close-btn');
    const filmNameSpan = document.getElementById('filmName');
    
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    const infoTrailer = document.getElementById('infoTrailer');
    
    let allMovies = []; 
    let selectedDate = new Date(); 
    let currentPrice = 0; 

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
                return { ...item, ...movieInfo };
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
            moviesContainer.insertAdjacentHTML('beforeend', createMovieCard(movie));
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
                document.querySelectorAll('.movie-row').forEach(row => {
                    row.style.display = (filterValue === 'all' || row.dataset.category === filterValue) ? 'flex' : 'none';
                });
            });
        });
    }

    // --- 6. ОБРАБОТКА КЛИКОВ ---
    moviesContainer.addEventListener('click', (e) => {
        // 1. КУПИТЬ БИЛЕТ
        const buyBtn = e.target.closest('.buy-ticket-btn');
        if (buyBtn) {
            const title = buyBtn.getAttribute('data-film');
            const time = buyBtn.getAttribute('data-time');
            currentPrice = parseInt(buyBtn.getAttribute('data-price')); 
            
            filmNameSpan.innerHTML = `${title} <span style="font-weight:400; color:#94a3b8;">(${time})</span>`;
            
            renderHall();
            // Сбрасываем текст цены
            document.getElementById('count').innerText = '0';
            document.getElementById('total').innerText = '0';
            
            ticketModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            return;
        }

        // 2. ИНФО О ФИЛЬМЕ
        const infoBlock = e.target.closest('.movie-primary-content');
        if (infoBlock) {
            const id = infoBlock.getAttribute('data-movieid');
            const movie = allMovies.find(m => m.movieId === id);
            if (movie) openInfoModal(movie);
        }
    });

    // --- 7. ЛОГИКА ЗАЛА (398 мест) ---
    function renderHall() {
        const seatsArea = document.getElementById('seatsArea');
        seatsArea.innerHTML = ''; 

        const totalSeats = 398;
        const rows = 16;        
        const seatsPerRow = 25; 
        
        let seatsCreated = 0;

        for (let i = 0; i < rows; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            for (let j = 0; j < seatsPerRow; j++) {
                if (seatsCreated >= totalSeats) break;

                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.title = `Ряд ${i + 1}, Место ${j + 1}`; // Подсказка

                seat.addEventListener('click', () => {
                    seat.classList.toggle('selected');
                    updateSelectedCount();
                });
                
                rowDiv.appendChild(seat);
                seatsCreated++;
            }
            seatsArea.appendChild(rowDiv);
        }
    }

    function updateSelectedCount() {
        // Считаем только внутри зоны зала, чтобы не цеплять легенду
        const selectedSeats = document.querySelectorAll('#seatsArea .seat.selected');
        const count = selectedSeats.length;
        const total = count * currentPrice;
        
        document.getElementById('count').innerText = count;
        document.getElementById('total').innerText = total;
    }

    document.getElementById('confirmBuyBtn').addEventListener('click', () => {
        const count = document.getElementById('count').innerText;
        if(count > 0) {
            alert(`Спасибо за покупку! Выбрано мест: ${count}. Ждем вас в кино!`);
            ticketModal.style.display = 'none';
            document.body.style.overflow = '';
        } else {
            alert('Пожалуйста, выберите хотя бы одно место.');
        }
    });

    // --- 8. ФУНКЦИИ МОДАЛОК ---
    function openInfoModal(movie) {
        infoPoster.src = movie.poster;
        document.getElementById('infoTitle').textContent = movie.title;
        document.getElementById('infoDesc').textContent = movie.description;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');

        // Заполняем таблицу
        document.getElementById('infoYear').textContent = movie.year || '-';
        document.getElementById('infoCountry').textContent = movie.country || '-';
        document.getElementById('infoGenre').textContent = movie.tags.join(', ');
        document.getElementById('infoDirector').textContent = movie.director || '-';
        document.getElementById('infoActors').textContent = movie.actors || '-';
        document.getElementById('infoDuration').textContent = movie.duration || '-';
        document.getElementById('infoMpaa').textContent = movie.mpaa || 'N/A';

        if(movie.trailer) {
            infoTrailer.src = `https://www.youtube.com/embed/${movie.trailer}?autoplay=1`;
        } else {
            infoTrailer.src = '';
        }

        infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }

    closeTicketBtn.addEventListener('click', () => {
        ticketModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    closeInfoBtn.addEventListener('click', closeInfo);
    function closeInfo() {
        infoModal.style.display = 'none';
        infoTrailer.src = ''; 
        document.body.style.overflow = ''; 
    }

    window.addEventListener('click', (e) => {
        if (e.target === ticketModal) {
            ticketModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        if (e.target === infoModal) closeInfo();
    });
});
