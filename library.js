document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('libraryContainer');
    const searchInput = document.getElementById('searchInput');
    const genresContainer = document.getElementById('genresContainer');
    
    // Custom Select
    const customSelect = document.querySelector('.custom-select');
    const customSelectTrigger = customSelect.querySelector('.custom-select__trigger');
    const customOptions = customSelect.querySelectorAll('.custom-option');
    const customSelectText = customSelectTrigger.querySelector('span');
    let currentSortOrder = 'newest';

    // Modal
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
    const miniContainer = document.getElementById('miniScheduleContainer');

    let allMoviesLibrary = []; 
    let allSchedule = [];
    let selectedGenres = new Set(); 
    let currentMediaList = [];
    let currentMediaIndex = 0;

    // CUSTOM SELECT LOGIC
    customSelectTrigger.addEventListener('click', () => customSelect.classList.toggle('open'));
    customOptions.forEach(option => {
        option.addEventListener('click', () => {
            customOptions.forEach(op => op.classList.remove('selected'));
            option.classList.add('selected');
            customSelectText.textContent = option.textContent;
            currentSortOrder = option.getAttribute('data-value');
            customSelect.classList.remove('open');
            applyFiltersAndSort();
        });
    });
    window.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) customSelect.classList.remove('open');
    });

    // 1. DATA LOADING
    Promise.all([
        fetch('library.json').then(res => res.json()),
        fetch('schedule.json').then(res => res.json())
    ])
    .then(([libraryData, scheduleData]) => {
        allMoviesLibrary = Object.entries(libraryData).map(([id, movie]) => ({ id, ...movie }));
        allSchedule = scheduleData;
        generateGenreButtons(allMoviesLibrary);
        applyFiltersAndSort();
    })
    .catch(error => console.error('Ошибка:', error));

    function generateGenreButtons(movies) {
        const allTags = new Set();
        movies.forEach(movie => {
            if (movie.tags) movie.tags.forEach(tag => allTags.add(tag));
        });
        const sortedTags = Array.from(allTags).sort();
        genresContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = 'genre-btn active'; 
        allBtn.textContent = 'Все';
        allBtn.dataset.genre = 'all';
        allBtn.addEventListener('click', () => {
            selectedGenres.clear(); 
            updateButtonsState();   
            applyFiltersAndSort();  
        });
        genresContainer.appendChild(allBtn);
        sortedTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.textContent = tag;
            btn.dataset.genre = tag;
            btn.addEventListener('click', () => {
                if (selectedGenres.has(tag)) selectedGenres.delete(tag);
                else selectedGenres.add(tag);
                updateButtonsState();
                applyFiltersAndSort();
            });
            genresContainer.appendChild(btn);
        });
    }

    function updateButtonsState() {
        const allBtn = genresContainer.querySelector('[data-genre="all"]');
        const genreBtns = genresContainer.querySelectorAll('[data-genre]:not([data-genre="all"])');
        if (selectedGenres.size === 0) allBtn.classList.add('active');
        else allBtn.classList.remove('active');
        genreBtns.forEach(btn => {
            if (selectedGenres.has(btn.dataset.genre)) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function applyFiltersAndSort() {
        let result = [...allMoviesLibrary]; 
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            result = result.filter(movie => movie.title.toLowerCase().includes(searchTerm) || movie.director.toLowerCase().includes(searchTerm));
        }
        if (selectedGenres.size > 0) {
            result = result.filter(movie => {
                const movieTags = movie.tags || [];
                return Array.from(selectedGenres).some(g => movieTags.includes(g));
            });
        }
        result.sort((a, b) => {
            if (currentSortOrder === 'newest') return parseInt(b.year) - parseInt(a.year); 
            else if (currentSortOrder === 'oldest') return parseInt(a.year) - parseInt(b.year);
            else if (currentSortOrder === 'rating_high') return (b.rating || 0) - (a.rating || 0);
            else if (currentSortOrder === 'rating_low') return (a.rating || 0) - (b.rating || 0);
            else if (currentSortOrder === 'az') return a.title.localeCompare(b.title);
            else if (currentSortOrder === 'za') return b.title.localeCompare(a.title);
        });
        renderLibrary(result);
    }

    function renderLibrary(movies) {
        libraryContainer.innerHTML = '';
        if (movies.length === 0) {
            libraryContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px; color:#64748b; font-size: 1.2rem;">Фильмы не найдены</div>';
            return;
        }
        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'lib-card';
            const displayTags = movie.tags ? movie.tags.join(', ') : '';
            const rating = movie.rating || 0;
            let ratingClass = rating < 5 ? 'rating-low' : (rating < 7 ? 'rating-mid' : '');
            card.innerHTML = `
                <span class="lib-rating-badge ${ratingClass}">${movie.rating || '-'}</span>
                <span class="lib-age ${movie.ageClass}">${movie.age}</span>
                <img src="${movie.poster}" alt="${movie.title}" class="lib-poster">
                <div class="lib-info">
                    <h3 class="lib-title">${movie.title}</h3>
                    <div class="lib-meta">${movie.year} • ${movie.country}</div>
                    <div class="lib-meta lib-tags-text">${displayTags}</div>
                </div>
            `;
            card.addEventListener('click', () => openInfoModal(movie));
            libraryContainer.appendChild(card);
        });
    }

    searchInput.addEventListener('input', applyFiltersAndSort);

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

        // --- ПРОФЕССИОНАЛЬНАЯ ОБРЕЗКА (LIBRARY) ---
        infoDesc.innerHTML = ''; 
        
        // 1. Берем реальную ширину или fallback
        const containerWidth = infoDesc.clientWidth || Math.min(600, window.innerWidth - 60);
        
        // 2. Считаем лимит (делитель 9 для запаса)
        const charsPerLine = Math.floor(containerWidth / 9); 
        const dynamicLimit = (charsPerLine * 2) - 40; // 40 симв. запас под кнопку

        if (movie.description && movie.description.length > dynamicLimit) {
            let cutIndex = movie.description.lastIndexOf(' ', dynamicLimit);
            if (cutIndex === -1) cutIndex = dynamicLimit; 

            const shortHTML = movie.description.substring(0, cutIndex) + '...';
            const fullHTML = movie.description;

            const contentWrapper = document.createElement('span');
            contentWrapper.className = 'description-text';
            
            const renderState = (isExpanded) => {
                // Анимация
                contentWrapper.classList.remove('fade-in-effect');
                void contentWrapper.offsetWidth; 
                contentWrapper.classList.add('fade-in-effect');

                if (isExpanded) {
                    contentWrapper.innerHTML = `${fullHTML} <button class="read-more-btn" id="toggleDescBtn">СВЕРНУТЬ</button>`;
                } else {
                    contentWrapper.innerHTML = `${shortHTML}<button class="read-more-btn" id="toggleDescBtn">ЧИТАТЬ ДАЛЕЕ</button>`;
                }

                // Вешаем клик
                setTimeout(() => {
                    const btn = document.getElementById('toggleDescBtn');
                    if(btn) {
                        btn.onclick = (e) => { e.stopPropagation(); renderState(!isExpanded); };
                    }
                }, 0);
            };

            renderState(false);
            infoDesc.appendChild(contentWrapper);

        } else {
            const p = document.createElement('p');
            p.className = 'description-text';
            p.textContent = movie.description || '';
            infoDesc.appendChild(p);
        }
        // ------------------------------------------

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

        // ГЕНЕРАЦИЯ БИЛЕТОВ (Только для library.js)
        if (typeof miniContainer !== 'undefined' && miniContainer) {
            miniContainer.innerHTML = '';
            const scheduleEntry = allSchedule.find(s => s.movieId === movie.id || s.movieId === movie.movieId);

            if (scheduleEntry && scheduleEntry.sessions) {
                const dates = scheduleEntry.dates.slice(0, 2);
                dates.forEach(date => {
                    const dateObj = new Date(date);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleDateString('ru-RU', { month: 'short' });
                    
                    scheduleEntry.sessions.slice(0, 2).forEach(session => {
                        const btn = document.createElement('button');
                        btn.className = 'mini-ticket-btn';
                        btn.onclick = () => window.location.href = 'schedule.html'; 
                        btn.innerHTML = `
                            <div class="ticket-time-col">
                                <span class="ticket-time">${session.time}</span>
                                <span class="ticket-date">${day} ${month}</span>
                            </div>
                            <div class="ticket-price-col">
                                <div class="ticket-price">${session.price} ₽</div>
                                <span class="ticket-format">${session.format}</span>
                            </div>
                        `;
                        miniContainer.appendChild(btn);
                    });
                });
            } 
            if (miniContainer.children.length === 0) {
                miniContainer.innerHTML = `<div class="no-sessions-stub"><span>Сеансов пока нет</span></div>`;
            }
        }

        infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }

    function closeInfo() {
        infoModal.style.display = 'none';
        mediaContainer.innerHTML = '';
        document.body.style.overflow = ''; 
    }
    closeInfoBtn.addEventListener('click', closeInfo);
    window.addEventListener('click', (e) => { if (e.target === infoModal) closeInfo(); });
});
