document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.querySelector('.close-btn');
    const buyButtons = document.querySelectorAll('.buy-ticket-btn');
    const filmNameSpan = document.getElementById('filmName');

    // Функция открытия окна
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filmTitle = button.getAttribute('data-film'); // Получаем название фильма
            filmNameSpan.textContent = filmTitle;
            modal.style.display = 'flex'; // Показываем окно
        });
    });

    // Функция закрытия окна (крестик)
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Закрытие при клике вне окна
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
