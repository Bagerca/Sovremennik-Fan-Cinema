document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    const dateSlider = document.getElementById('date-slider');
    
    // Modals
    const ticketModal = document.getElementById('ticketModal');
    const closeTicketBtn = document.querySelector('.close-btn');
    const filmNameSpan = document.getElementById('filmName');
    
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    
    const mediaContainer = document.getElementById('mediaContainer');
    const prevMediaBtn = document.getElementById('prevMediaBtn');
    const nextMediaBtn = document.getElementById('nextMediaBtn');
    const mediaCounter = document.getElementById('mediaCounter');

    const infoRating = document.getElementById('infoRating');
    const infoYear = document.getElementById('infoYear');
    const infoCountry = document.getElementById('infoCountry');
    const infoDirector = document.getElementById('infoDirector');
    const infoDuration = document.getElementById('infoDuration');
    const infoMpaa = document.getElementById('infoMpaa');
    
    let allMovies = []; 
    let selectedDate = new Date(); 
    let currentPrice = 0; 
    let currentMediaList = [];
    let currentMediaIndex = 0;

    // 1. DATES (Генерация дат)
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
            card.innerHTML = `<span class="day-name">${dayLabel}</span><span class="day-number">${dayNumber} ${monthName}</span>`;
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

    // 2. DATA LOADING (Загрузка данных)
    Promise.all([
        fetch('library.json').then(res => res.json()),
        fetch('schedule.json').then(res => res.json())
    ])
    .then(([libraryData, scheduleData]) => {
        allMovies = scheduleData.map(item => {
            const movieInfo = libraryData[item.movieId];
            if (!movieInfo) return item; 
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

    // 3. RENDER CARDS (Отрисовка карточек фильмов)
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

    function createMovieCard(movie) {
        const tagsHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        const rating = movie.rating || 0;
        let ratingClass = rating < 5 ? 'rating-low' : (rating < 7 ? 'rating-mid' : '');

        const sessionsHTML = movie.sessions.map(session => `
            <button class="session-btn buy-ticket-btn" 
                    data-film="${movie.title}" 
                    data-time="${session.time}"
                    data-price="${session.price}">
                <div class="btn-top"><span class="session-time">${session.time}</span></div>
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
                <div class="row-sessions"><div class="sessions-grid">${sessionsHTML}</div></div>
            </div>
        `;
    }

    // 4. FILTERS
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

    // 5. CLICKS DELEGATION
    moviesContainer.addEventListener('click', (e) => {
        const buyBtn = e.target.closest('.buy-ticket-btn');
        if (buyBtn) {
            const title = buyBtn.getAttribute('data-film');
            const time = buyBtn.getAttribute('data-time');
            currentPrice = parseInt(buyBtn.getAttribute('data-price')); 
            filmNameSpan.innerHTML = `${title} <span style="font-weight:400; color:#94a3b8;">(${time})</span>`;
            renderHall();
            document.getElementById('count').innerText = '0';
            document.getElementById('total').innerText = '0';
            ticketModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            return;
        }
        const infoBlock = e.target.closest('.movie-primary-content');
        if (infoBlock) {
            const id = infoBlock.getAttribute('data-movieid');
            const movie = allMovies.find(m => m.movieId === id);
            if (movie) openInfoModal(movie);
        }
    });

    // 6. HALL RENDER
    function renderHall() {
        const seatsArea = document.getElementById('seatsArea');
        seatsArea.innerHTML = ''; 

        const startRow = 2;
        const endRow = 16;

        for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            const rowLabelLeft = document.createElement('div');
            rowLabelLeft.className = 'row-number row-left';
            rowLabelLeft.innerText = rowNum;
            rowDiv.appendChild(rowLabelLeft);

            let seatsInRow = 24; 
            if (rowNum === 2) {
                seatsInRow = 22; 
            } else if (rowNum === 16) {
                seatsInRow = 29; 
            }

            for (let j = 0; j < seatsInRow; j++) {
                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.title = `Ряд ${rowNum}, Место ${j + 1}`; 
                
                seat.addEventListener('click', () => {
                    seat.classList.toggle('selected');
                    updateSelectedCount();
                });
                rowDiv.appendChild(seat);
            }

            const rowLabelRight = document.createElement('div');
            rowLabelRight.className = 'row-number row-right';
            rowLabelRight.innerText = rowNum;
            rowDiv.appendChild(rowLabelRight);

            seatsArea.appendChild(rowDiv);
        }
    }

    function updateSelectedCount() {
        const count = document.querySelectorAll('#seatsArea .seat.selected').length;
        document.getElementById('count').innerText = count;
        document.getElementById('total').innerText = count * currentPrice;
    }

    document.getElementById('confirmBuyBtn').addEventListener('click', () => {
        const count = document.getElementById('count').innerText;
        if(count > 0) {
            alert(`Спасибо за покупку! Выбрано мест: ${count}.`);
            ticketModal.style.display = 'none';
            document.body.style.overflow = '';
        } else alert('Пожалуйста, выберите хотя бы одно место.');
    });

    // 7. INFO MODAL (С ОБНОВЛЕННОЙ ЛОГИКОЙ ТЕКСТА)
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

    function openInfoModal(movie) {
        document.querySelector('.modal-backdrop-blur').style.backgroundImage = `url('${movie.poster}')`;
        infoPoster.src = movie.poster;
        infoTitle.textContent = movie.title;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        infoRating.textContent = movie.rating ? `${movie.rating} / 10` : 'Нет оценки';
        infoRating.style.color = movie.rating >= 7 ? '#4ade80' : (movie.rating >= 5 ? '#facc15' : '#ef4444');
        
        // --- ОБРЕЗКА ТЕКСТА JS (90 символов для 2 строк) ---
        infoDesc.innerHTML = ''; 
        const charLimit = 90; // Уменьшенный лимит

        if (movie.description && movie.description.length > charLimit) {
            const cutIndex = movie.description.lastIndexOf(' ', charLimit);
            const shortText = movie.description.substring(0, cutIndex) + '...';
            const fullText = movie.description;

            const textSpan = document.createElement('span');
            textSpan.className = 'description-text';
            textSpan.innerHTML = shortText;

            const btn = document.createElement('button');
            btn.className = 'read-more-btn';
            btn.textContent = 'ЧИТАТЬ ДАЛЕЕ';
            
            btn.onclick = () => {
                if (btn.textContent === 'ЧИТАТЬ ДАЛЕЕ') {
                    textSpan.innerHTML = fullText;
                    btn.textContent = 'СВЕРНУТЬ';
                } else {
                    textSpan.innerHTML = shortText;
                    btn.textContent = 'ЧИТАТЬ ДАЛЕЕ';
                }
            };

            infoDesc.appendChild(textSpan);
            infoDesc.appendChild(btn);
        } else {
            const p = document.createElement('p');
            p.className = 'description-text';
            p.textContent = movie.description || '';
            p.style.margin = '0';
            infoDesc.appendChild(p);
        }
        // -----------------------------------------------

        infoYear.textContent = movie.year || '-';
        infoCountry.textContent = movie.country || '-';
        infoDirector.textContent = movie.director || '-';
        infoDuration.textContent = movie.duration || '-';
        infoMpaa.textContent = movie.mpaa || 'N/A';
        currentMediaList = movie.media || [];
        if (currentMediaList.length === 0 && movie.trailer) currentMediaList.push({ type: 'video', src: movie.trailer });
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

    function closeInfo() {
        infoModal.style.display = 'none';
        mediaContainer.innerHTML = ''; 
        document.body.style.overflow = ''; 
    }
    
    closeTicketBtn.addEventListener('click', () => { ticketModal.style.display = 'none'; document.body.style.overflow = ''; });
    closeInfoBtn.addEventListener('click', closeInfo);
    window.addEventListener('click', (e) => {
        if (e.target === ticketModal) { ticketModal.style.display = 'none'; document.body.style.overflow = ''; }
        if (e.target === infoModal) closeInfo();
    });
});
