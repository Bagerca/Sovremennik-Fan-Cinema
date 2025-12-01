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
    
    // Элементы слайдера
    const mediaContainer = document.getElementById('mediaContainer');
    const prevMediaBtn = document.getElementById('prevMediaBtn');
    const nextMediaBtn = document.getElementById('nextMediaBtn');
    const mediaCounter = document.getElementById('mediaCounter');

    // Элементы таблицы информации
    const infoRating = document.getElementById('infoRating');
    const infoYear = document.getElementById('infoYear');
    const infoCountry = document.getElementById('infoCountry');
    const infoGenre = document.getElementById('infoGenre');
    const infoDirector = document.getElementById('infoDirector');
    const infoDuration = document.getElementById('infoDuration');
    const infoMpaa = document.getElementById('infoMpaa');
    
    let allMovies = []; 
    let selectedDate = new Date(); 
    let currentPrice = 0; 
    
    // Переменные для слайдера
    let currentMediaList = [];
    let currentMediaIndex = 0;

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
        
        const rating = movie.rating || 0;
        let ratingClass = '';
        if (rating < 5) ratingClass = 'rating-low';
        else if (rating < 7) ratingClass = 'rating-mid';

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
                        <span class="rating-badge ${ratingClass}">${movie.rating || '-'}</span>
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
            // Сброс цены
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

            // НОВОЕ: Добавляем номер ряда слева
            const rowNum = document.createElement('div');
            rowNum.className = 'row-number';
            rowNum.innerText = i + 1; // Нумерация с 1
            rowDiv.appendChild(rowNum);

            for (let j = 0; j < seatsPerRow; j++) {
                if (seatsCreated >= totalSeats) break;

                const seat = document.createElement('div');
                seat.className = 'seat';
                // Подсказка при наведении: Ряд X, Место Y
                seat.title = `Ряд ${i + 1}, Место ${j + 1}`; 

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
        // Считаем только внутри зоны зала
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

    // --- 8. ФУНКЦИИ СЛАЙДЕРА ---
    function updateMediaSlider() {
        mediaContainer.innerHTML = '';
        const item = currentMediaList[currentMediaIndex];
        
        if (!item) return;

        let element;
        if (item.type === 'video') {
            element = document.createElement('iframe');
            element.className = 'media-content active';
            element.src = `https://www.youtube.com/embed/${item.src}?autoplay=0`;
            element.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            element.allowFullscreen = true;
        } else {
            element = document.createElement('img');
            element.className = 'media-content active';
            element.src = item.src;
        }

        mediaContainer.appendChild(element);

        const typeText = item.type === 'video' ? 'Трейлер' : 'Кадр';
        mediaCounter.textContent = `${typeText} ${currentMediaIndex + 1} / ${currentMediaList.length}`;
    }

    prevMediaBtn.addEventListener('click', () => {
        if (currentMediaList.length <= 1) return;
        currentMediaIndex--;
        if (currentMediaIndex < 0) currentMediaIndex = currentMediaList.length - 1;
        updateMediaSlider();
    });

    nextMediaBtn.addEventListener('click', () => {
        if (currentMediaList.length <= 1) return;
        currentMediaIndex++;
        if (currentMediaIndex >= currentMediaList.length) currentMediaIndex = 0;
        updateMediaSlider();
    });

    // --- 9. ОТКРЫТИЕ ИНФО ---
    function openInfoModal(movie) {
        infoPoster.src = movie.poster;
        infoTitle.textContent = movie.title;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');

        infoRating.textContent = movie.rating ? `${movie.rating} / 10` : 'Нет оценки';
        if(movie.rating >= 7) infoRating.style.color = '#4ade80';
        else if(movie.rating >= 5) infoRating.style.color = '#facc15';
        else infoRating.style.color = '#ef4444';

        infoDesc.textContent = movie.description;
        infoYear.textContent = movie.year || '-';
        infoCountry.textContent = movie.country || '-';
        infoGenre.textContent = movie.tags.join(', ');
        infoDirector.textContent = movie.director || '-';
        infoDuration.textContent = movie.duration || '-';
        infoMpaa.textContent = movie.mpaa || 'N/A';

        // Инициализация слайдера
        currentMediaList = movie.media || [];
        if (currentMediaList.length === 0 && movie.trailer) {
            currentMediaList.push({ type: 'video', src: movie.trailer });
        }
        
        currentMediaIndex = 0;
        
        if (currentMediaList.length > 0) {
            updateMediaSlider();
            prevMediaBtn.style.display = currentMediaList.length > 1 ? 'flex' : 'none';
            nextMediaBtn.style.display = currentMediaList.length > 1 ? 'flex' : 'none';
        } else {
            mediaContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">Нет материалов</div>';
            mediaCounter.textContent = '';
            prevMediaBtn.style.display = 'none';
            nextMediaBtn.style.display = 'none';
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
        mediaContainer.innerHTML = ''; 
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
