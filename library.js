document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('libraryContainer');
    const searchInput = document.getElementById('searchInput');
    const genresContainer = document.getElementById('genresContainer');
    
    // Элементы кастомного селекта
    const customSelect = document.querySelector('.custom-select');
    const customSelectTrigger = customSelect.querySelector('.custom-select__trigger');
    const customOptions = customSelect.querySelectorAll('.custom-option');
    const customSelectText = customSelectTrigger.querySelector('span');

    let currentSortOrder = 'newest'; // Значение сортировки по умолчанию

    // Элементы модального окна
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

    let allMoviesLibrary = []; 
    let selectedGenres = new Set(); 
    
    // Переменные для слайдера
    let currentMediaList = [];
    let currentMediaIndex = 0;

    // --- ЛОГИКА КАСТОМНОГО СЕЛЕКТА ---
    customSelectTrigger.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    customOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Удаляем класс selected у всех
            customOptions.forEach(op => op.classList.remove('selected'));
            // Добавляем текущему
            option.classList.add('selected');
            // Меняем текст триггера
            customSelectText.textContent = option.textContent;
            // Обновляем значение сортировки
            currentSortOrder = option.getAttribute('data-value');
            
            // Закрываем меню и применяем фильтры
            customSelect.classList.remove('open');
            applyFiltersAndSort();
        });
    });

    // Закрытие селекта при клике вне его
    window.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });


    // 1. ЗАГРУЗКА ДАННЫХ
    fetch('library.json')
        .then(response => response.json())
        .then(data => {
            allMoviesLibrary = Object.values(data);
            generateGenreButtons(allMoviesLibrary);
            applyFiltersAndSort();
        })
        .catch(error => console.error('Ошибка:', error));

    // 2. ГЕНЕРАЦИЯ КНОПОК ЖАНРОВ
    function generateGenreButtons(movies) {
        const allTags = new Set();
        movies.forEach(movie => {
            if (movie.tags && Array.isArray(movie.tags)) {
                movie.tags.forEach(tag => allTags.add(tag));
            }
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
                if (selectedGenres.has(tag)) {
                    selectedGenres.delete(tag);
                } else {
                    selectedGenres.add(tag);
                }
                updateButtonsState();
                applyFiltersAndSort();
            });
            genresContainer.appendChild(btn);
        });
    }

    function updateButtonsState() {
        const allBtn = genresContainer.querySelector('[data-genre="all"]');
        const genreBtns = genresContainer.querySelectorAll('[data-genre]:not([data-genre="all"])');

        if (selectedGenres.size === 0) {
            allBtn.classList.add('active');
        } else {
            allBtn.classList.remove('active');
        }

        genreBtns.forEach(btn => {
            const genre = btn.dataset.genre;
            if (selectedGenres.has(genre)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 3. ФИЛЬТРАЦИЯ И СОРТИРОВКА
    function applyFiltersAndSort() {
        let result = [...allMoviesLibrary]; 

        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            result = result.filter(movie => {
                return movie.title.toLowerCase().includes(searchTerm) || 
                       movie.director.toLowerCase().includes(searchTerm);
            });
        }

        if (selectedGenres.size > 0) {
            result = result.filter(movie => {
                const movieTags = movie.tags || [];
                return Array.from(selectedGenres).some(selectedGenre => movieTags.includes(selectedGenre));
            });
        }

        // Используем переменную currentSortOrder вместо select.value
        result.sort((a, b) => {
            if (currentSortOrder === 'newest') {
                return parseInt(b.year) - parseInt(a.year); 
            } else if (currentSortOrder === 'oldest') {
                return parseInt(a.year) - parseInt(b.year);
            } else if (currentSortOrder === 'rating_high') {
                return (b.rating || 0) - (a.rating || 0);
            } else if (currentSortOrder === 'rating_low') {
                return (a.rating || 0) - (b.rating || 0);
            } else if (currentSortOrder === 'az') {
                return a.title.localeCompare(b.title);
            } else if (currentSortOrder === 'za') {
                return b.title.localeCompare(a.title);
            }
        });

        renderLibrary(result);
    }

    // 4. РЕНДЕР КАРТОЧЕК
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
            let ratingClass = '';
            if (rating < 5) ratingClass = 'rating-low';
            else if (rating < 7) ratingClass = 'rating-mid';

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

    // Слушатели поиска
    searchInput.addEventListener('input', applyFiltersAndSort);

    // --- ЛОГИКА СЛАЙДЕРА ---
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

    // 5. МОДАЛЬНОЕ ОКНО
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

    function closeInfo() {
        infoModal.style.display = 'none';
        mediaContainer.innerHTML = '';
        document.body.style.overflow = ''; 
    }

    closeInfoBtn.addEventListener('click', closeInfo);
    window.addEventListener('click', (e) => {
        if (e.target === infoModal) closeInfo();
    });
});
