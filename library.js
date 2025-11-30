document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('libraryContainer');
    const searchInput = document.getElementById('searchInput');
    const genreSelect = document.getElementById('genreSelect');
    const sortSelect = document.getElementById('sortSelect');
    
    // Элементы модального окна
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    const infoTrailer = document.getElementById('infoTrailer');

    let allMoviesLibrary = []; // Оригинальный список фильмов

    // 1. ЗАГРУЗКА ДАННЫХ
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            allMoviesLibrary = Object.values(data.library);
            // Сразу применяем сортировку по умолчанию (Новые)
            applyFiltersAndSort();
        })
        .catch(error => console.error('Ошибка:', error));

    // 2. ГЛАВНАЯ ФУНКЦИЯ ФИЛЬТРАЦИИ И СОРТИРОВКИ
    function applyFiltersAndSort() {
        let result = [...allMoviesLibrary]; // Копируем массив

        // А. Фильтрация по Поиску
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            result = result.filter(movie => {
                return movie.title.toLowerCase().includes(searchTerm) || 
                       movie.director.toLowerCase().includes(searchTerm) ||
                       movie.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            });
        }

        // Б. Фильтрация по Жанру
        const selectedGenre = genreSelect.value;
        if (selectedGenre !== 'all') {
            result = result.filter(movie => movie.category === selectedGenre);
        }

        // В. Сортировка
        const sortType = sortSelect.value;
        result.sort((a, b) => {
            if (sortType === 'newest') {
                return parseInt(b.year) - parseInt(a.year); // Свежие сначала
            } else if (sortType === 'oldest') {
                return parseInt(a.year) - parseInt(b.year); // Старые сначала
            } else if (sortType === 'az') {
                return a.title.localeCompare(b.title); // А-Я
            } else if (sortType === 'za') {
                return b.title.localeCompare(a.title); // Я-А
            }
        });

        // Г. Рендер
        renderLibrary(result);
    }

    // 3. РЕНДЕР КАРТОЧЕК
    function renderLibrary(movies) {
        libraryContainer.innerHTML = '';

        if (movies.length === 0) {
            libraryContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#94a3b8; font-size: 1.2rem;">Фильмы не найдены</div>';
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'lib-card';
            card.innerHTML = `
                <span class="lib-age ${movie.ageClass}">${movie.age}</span>
                <img src="${movie.poster}" alt="${movie.title}" class="lib-poster">
                <div class="lib-info">
                    <h3 class="lib-title">${movie.title}</h3>
                    <div class="lib-meta">${movie.year} • ${movie.country}</div>
                    <div class="lib-meta" style="font-size: 0.8em; color: var(--accent-blue);">${movie.tags.slice(0, 2).join(', ')}</div>
                </div>
            `;
            
            card.addEventListener('click', () => openInfoModal(movie));
            libraryContainer.appendChild(card);
        });
    }

    // 4. СЛУШАТЕЛИ СОБЫТИЙ (При изменении любого фильтра запускаем applyFiltersAndSort)
    searchInput.addEventListener('input', applyFiltersAndSort);
    genreSelect.addEventListener('change', applyFiltersAndSort);
    sortSelect.addEventListener('change', applyFiltersAndSort);

    // 5. МОДАЛЬНОЕ ОКНО
    function openInfoModal(movie) {
        infoPoster.src = movie.poster;
        document.getElementById('infoTitle').textContent = movie.title;
        document.getElementById('infoDesc').textContent = movie.description;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');

        document.getElementById('infoYear').textContent = movie.year || '-';
        document.getElementById('infoCountry').textContent = movie.country || '-';
        document.getElementById('infoGenre').textContent = movie.tags.join(', ');
        document.getElementById('infoDirector').textContent = movie.director || '-';
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

    closeInfoBtn.addEventListener('click', closeInfo);
    function closeInfo() {
        infoModal.style.display = 'none';
        infoTrailer.src = ''; 
        document.body.style.overflow = ''; 
    }

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) closeInfo();
    });
});
