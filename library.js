document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('libraryContainer');
    const searchInput = document.getElementById('searchInput');
    const genresContainer = document.getElementById('genresContainer');
    const sortSelect = document.getElementById('sortSelect');
    
    // Элементы модального окна
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    const infoTrailer = document.getElementById('infoTrailer');
    
    const infoYear = document.getElementById('infoYear');
    const infoCountry = document.getElementById('infoCountry');
    const infoGenre = document.getElementById('infoGenre');
    const infoDirector = document.getElementById('infoDirector');
    const infoDuration = document.getElementById('infoDuration');
    const infoMpaa = document.getElementById('infoMpaa');

    let allMoviesLibrary = []; 
    
    // Используем Set для хранения множества выбранных жанров
    let selectedGenres = new Set(); 

    // 1. ЗАГРУЗКА ДАННЫХ
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            allMoviesLibrary = Object.values(data.library);
            generateGenreButtons(allMoviesLibrary);
            applyFiltersAndSort();
        })
        .catch(error => console.error('Ошибка:', error));

    // 2. ГЕНЕРАЦИЯ КНОПОК
    function generateGenreButtons(movies) {
        const allTags = new Set();
        movies.forEach(movie => {
            if (movie.tags && Array.isArray(movie.tags)) {
                movie.tags.forEach(tag => allTags.add(tag));
            }
        });

        const sortedTags = Array.from(allTags).sort();
        genresContainer.innerHTML = '';

        // Кнопка "Все"
        const allBtn = document.createElement('button');
        allBtn.className = 'genre-btn active'; // По умолчанию активна
        allBtn.textContent = 'Все';
        allBtn.dataset.genre = 'all';
        
        allBtn.addEventListener('click', () => {
            selectedGenres.clear(); // Очищаем выбор
            updateButtonsState();   // Обновляем вид кнопок
            applyFiltersAndSort();  // Фильтруем
        });
        
        genresContainer.appendChild(allBtn);

        // Остальные кнопки
        sortedTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.textContent = tag;
            btn.dataset.genre = tag;
            
            btn.addEventListener('click', () => {
                // Логика мультивыбора:
                if (selectedGenres.has(tag)) {
                    selectedGenres.delete(tag); // Если уже выбран — убираем
                } else {
                    selectedGenres.add(tag);    // Если не выбран — добавляем
                }
                
                updateButtonsState();
                applyFiltersAndSort();
            });
            
            genresContainer.appendChild(btn);
        });
    }

    // Функция обновления внешнего вида кнопок
    function updateButtonsState() {
        const allBtn = genresContainer.querySelector('[data-genre="all"]');
        const genreBtns = genresContainer.querySelectorAll('[data-genre]:not([data-genre="all"])');

        // Если ничего не выбрано, активируем кнопку "Все"
        if (selectedGenres.size === 0) {
            allBtn.classList.add('active');
        } else {
            allBtn.classList.remove('active');
        }

        // Пробегаемся по кнопкам жанров и красим их
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

        // А. Поиск (по названию или режиссеру)
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            result = result.filter(movie => {
                return movie.title.toLowerCase().includes(searchTerm) || 
                       movie.director.toLowerCase().includes(searchTerm);
            });
        }

        // Б. Мульти-фильтр по жанрам (ЛОГИКА "ИЛИ")
        if (selectedGenres.size > 0) {
            result = result.filter(movie => {
                const movieTags = movie.tags || [];
                
                // .some() вернет true, если ХОТЯ БЫ ОДИН выбранный жанр есть в тегах фильма
                return Array.from(selectedGenres).some(selectedGenre => movieTags.includes(selectedGenre));
            });
        }

        // В. Сортировка
        const sortType = sortSelect.value;
        result.sort((a, b) => {
            if (sortType === 'newest') {
                return parseInt(b.year) - parseInt(a.year); 
            } else if (sortType === 'oldest') {
                return parseInt(a.year) - parseInt(b.year);
            } else if (sortType === 'az') {
                return a.title.localeCompare(b.title);
            } else if (sortType === 'za') {
                return b.title.localeCompare(a.title);
            }
        });

        renderLibrary(result);
    }

    // 4. РЕНДЕР
    function renderLibrary(movies) {
        libraryContainer.innerHTML = '';

        if (movies.length === 0) {
            libraryContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px; color:#64748b; font-size: 1.2rem;">Фильмы не найдены</div>';
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'lib-card';
            const displayTags = movie.tags ? movie.tags.slice(0, 2).join(', ') : '';

            card.innerHTML = `
                <span class="lib-age ${movie.ageClass}">${movie.age}</span>
                <img src="${movie.poster}" alt="${movie.title}" class="lib-poster">
                <div class="lib-info">
                    <h3 class="lib-title">${movie.title}</h3>
                    <div class="lib-meta">${movie.year} • ${movie.country}</div>
                    <div class="lib-meta" style="font-size: 0.85em; color: var(--accent-blue); font-weight: 600;">${displayTags}</div>
                </div>
            `;
            card.addEventListener('click', () => openInfoModal(movie));
            libraryContainer.appendChild(card);
        });
    }

    // Слушатели
    searchInput.addEventListener('input', applyFiltersAndSort);
    sortSelect.addEventListener('change', applyFiltersAndSort);

    // Модалка
    function openInfoModal(movie) {
        infoPoster.src = movie.poster;
        infoTitle.textContent = movie.title;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');
        infoDesc.textContent = movie.description;
        infoYear.textContent = movie.year || '-';
        infoCountry.textContent = movie.country || '-';
        infoGenre.textContent = movie.tags.join(', ');
        infoDirector.textContent = movie.director || '-';
        infoDuration.textContent = movie.duration || '-';
        infoMpaa.textContent = movie.mpaa || 'N/A';

        if(movie.trailer) {
            infoTrailer.src = `https://www.youtube.com/embed/${movie.trailer}?autoplay=1`;
        } else {
            infoTrailer.src = '';
        }
        infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }

    function closeInfo() {
        infoModal.style.display = 'none';
        infoTrailer.src = ''; 
        document.body.style.overflow = ''; 
    }

    closeInfoBtn.addEventListener('click', closeInfo);
    window.addEventListener('click', (e) => {
        if (e.target === infoModal) closeInfo();
    });
});
