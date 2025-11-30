document.addEventListener('DOMContentLoaded', () => {
    // --- Модальное окно ---
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.querySelector('.close-btn');
    const buyButtons = document.querySelectorAll('.buy-ticket-btn');
    const filmNameSpan = document.getElementById('filmName');

    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filmTitle = button.getAttribute('data-film');
            filmNameSpan.textContent = filmTitle;
            modal.style.display = 'flex';
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- Логика фильтров ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const movieRows = document.querySelectorAll('.movie-row');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Убираем активный класс у всех кнопок
            filterButtons.forEach(b => b.classList.remove('active'));
            // 2. Добавляем активный класс нажатой
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            // 3. Скрываем/показываем фильмы
            movieRows.forEach(row => {
                const category = row.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    row.style.display = 'flex'; // Показать
                } else {
                    row.style.display = 'none'; // Скрыть
                }
            });
        });
    });

    // --- Логика дат (Визуальная) ---
    const dateCards = document.querySelectorAll('.date-card');
    dateCards.forEach(card => {
        card.addEventListener('click', () => {
            dateCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Тут можно добавить логику загрузки расписания на другой день
        });
    });
});
