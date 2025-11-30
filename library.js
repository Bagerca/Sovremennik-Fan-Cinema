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
    // Доп поля модалки
    const infoYear = document.getElementById('infoYear');
    const infoCountry = document.getElementById('infoCountry');
    const infoGenre = document.getElementById('infoGenre');
    const infoDirector = document.getElementById('infoDirector');
    const infoDuration = document.getElementById('infoDuration');
    const infoMpaa = document.getElementById('infoMpaa');

    let allMoviesLibrary = []; 
    let currentGenre = 'all'; // Текущий активный жанр

    // 1. ЗАГРУЗКА ДАННЫХ
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            allMoviesLibrary = Object.values(data.library);
            
            // Сначала генерируем жанры на основе загруженных фильмов
            generateGenreButtons(allMoviesLibrary);
            
            // Затем показываем фильмы
            applyFiltersAndSort();
        })
        .catch(error => console.error('Ошибка:', error));

    // 2. ГЕНЕРАЦИЯ КНОПОК ЖАНРОВ (Автоматическая)
    function generateGenreButtons(movies) {
        // Собираем все уникальные теги в Set
        const allTags = new Set();
        movies.forEach(movie => {
            if (movie.tags && Array.isArray(movie.tags)) {
                movie.tags.forEach(tag => allTags.add(tag));
            }
        });

        // Превращаем Set в массив и сортируем по алфавиту
        const sortedTags = Array.from(allTags).sort();

        // Очищаем контейнер
        genresContainer.innerHTML = '';

        // Создаем кнопку "Все"
        const allBtn = document.createElement('button');
        allBtn.className = 'genre-btn active';
        allBtn.textContent = 'Все';
        allBtn.dataset.genre = 'all';
        allBtn.addEventListener('click', () => handleGenreClick(allBtn, 'all'));
        genresContainer.appendChild(allBtn);

        // Создаем кнопки для каждого тега
        sortedTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.textContent = tag;
            btn.dataset.genre = tag; // Сохраняем имя тега
            btn.addEventListener('click', () => handleGenreClick(btn, tag));
            genresContainer.appendChild(btn);
        });
    }

    // Обработка клика по жанру
    function handleGenreClick(clickedBtn, genre) {
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
        // Добавляем активный класс нажатой
        clickedBtn.classList.add('active');
        
        currentGenre = genre;
        applyFiltersAndSort();
    }

    // 3. ФИЛЬТРАЦИЯ И СОРТИРОВКА
    function applyFiltersAndSort() {
        let result = [...allMoviesLibrary]; 

        // А. Поиск
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            result = result.filter(movie => {
                return movie.title.toLowerCase().includes(searchTerm) || 
                       movie.director.toLowerCase().includes(searchTerm) ||
                       movie.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            });
        }

        // Б. Фильтр по Жанру (Тегу)
        if (currentGenre !== 'all') {
            result = result.filter(movie => {
                // Проверяем, есть ли выбранный жанр в массиве тегов фильма
                return movie.tags && movie.tags.includes(currentGenre);
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
            
            // Собираем первые 2 тега для отображения на карточке
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

    // 5. СЛУШАТЕЛИ СОБЫТИЙ
    searchInput.addEventListener('input', applyFiltersAndSort);
    sortSelect.addEventListener('change', applyFiltersAndSort);

    // 6. ЛОГИКА МОДАЛЬНОГО ОКНА
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
