document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('libraryContainer');
    const searchInput = document.getElementById('searchInput');
    
    // Элементы модального окна (Инфо)
    const infoModal = document.getElementById('movieInfoModal');
    const closeInfoBtn = document.querySelector('.info-close-btn');
    const infoPoster = document.getElementById('infoPoster');
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const infoTags = document.getElementById('infoTags');
    const infoTrailer = document.getElementById('infoTrailer');

    let allMoviesLibrary = []; // Сюда загрузим фильмы

    // 1. ЗАГРУЗКА ДАННЫХ
    fetch('movies.json')
        .then(response => response.json())
        .then(data => {
            // Превращаем объект library {"1": {...}, "2": {...}} в массив [{id: "1", ...}, ...]
            allMoviesLibrary = Object.values(data.library);
            renderLibrary(allMoviesLibrary);
        })
        .catch(error => console.error('Ошибка:', error));

    // 2. РЕНДЕР КАРТОЧЕК
    function renderLibrary(movies) {
        libraryContainer.innerHTML = '';

        if (movies.length === 0) {
            libraryContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">Фильмы не найдены</p>';
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
                    <div class="lib-meta" style="font-size: 0.8em;">${movie.tags.slice(0, 2).join(', ')}</div>
                </div>
            `;
            
            // Клик по карточке открывает модалку
            card.addEventListener('click', () => openInfoModal(movie));
            
            libraryContainer.appendChild(card);
        });
    }

    // 3. ПОИСК (Фильтрация)
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        const filtered = allMoviesLibrary.filter(movie => {
            return movie.title.toLowerCase().includes(term) || 
                   movie.director.toLowerCase().includes(term) ||
                   movie.tags.some(tag => tag.toLowerCase().includes(term));
        });

        renderLibrary(filtered);
    });

    // 4. ФУНКЦИИ МОДАЛКИ (Аналогично script.js)
    function openInfoModal(movie) {
        infoPoster.src = movie.poster;
        document.getElementById('infoTitle').textContent = movie.title;
        document.getElementById('infoDesc').textContent = movie.description;
        infoTags.innerHTML = movie.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('');

        // Таблица
        document.getElementById('infoYear').textContent = movie.year || '-';
        document.getElementById('infoCountry').textContent = movie.country || '-';
        document.getElementById('infoGenre').textContent = movie.tags.join(', ');
        document.getElementById('infoDirector').textContent = movie.director || '-';
        document.getElementById('infoDuration').textContent = movie.duration || '-';
        document.getElementById('infoMpaa').textContent = movie.mpaa || 'N/A';

        // Трейлер
        if(movie.trailer) {
            infoTrailer.src = `https://www.youtube.com/embed/${movie.trailer}?autoplay=1`;
        } else {
            infoTrailer.src = '';
        }

        infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }

    // Закрытие
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
