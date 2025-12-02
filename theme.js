document.addEventListener('DOMContentLoaded', () => {
    // 1. Ищем контейнер меню, куда добавим кнопку
    const navContainer = document.querySelector('.nav-links');
    if (!navContainer) return; // Если меню нет, скрипт не выполняется

    // 2. Создаем кнопку переключения
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.title = 'Включить новогоднее настроение';
    toggleBtn.innerHTML = '❄️'; // Исходная иконка
    
    // Добавляем кнопку в конец меню
    navContainer.appendChild(toggleBtn);

    // 3. Подготовка контейнера для снега
    const body = document.body;
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    body.appendChild(snowContainer);

    // 4. Ищем тег фавиконки в <head>
    const faviconLink = document.querySelector("link[rel~='icon']");

    // 5. Проверяем сохраненную настройку при загрузке страницы
    const isNewYear = localStorage.getItem('theme') === 'newyear';
    
    if (isNewYear) {
        enableTheme();
    }

    // 6. Обработчик клика по кнопке
    toggleBtn.addEventListener('click', () => {
        if (body.classList.contains('new-year-mode')) {
            disableTheme();
        } else {
            enableTheme();
        }
    });

    // --- ФУНКЦИИ ---

    function enableTheme() {
        body.classList.add('new-year-mode');
        localStorage.setItem('theme', 'newyear');
        toggleBtn.innerHTML = '🎅'; // Меняем кнопку на Деда Мороза
        createSnow();
        changeFavicon(true); // Ставим красную иконку
    }

    function disableTheme() {
        body.classList.remove('new-year-mode');
        localStorage.setItem('theme', 'default');
        toggleBtn.innerHTML = '❄️'; // Возвращаем снежинку
        removeSnow();
        changeFavicon(false); // Ставим обычную иконку
    }

    // Функция замены иконки вкладки
    function changeFavicon(isNewYear) {
        if (!faviconLink) return;
        
        // Если Новый год - ставим красную камеру с шапкой, иначе - синюю
        faviconLink.href = isNewYear 
            ? 'assets/images/favicon-red.svg' 
            : 'assets/images/favicon.svg';
    }

    // Генерация снежинок
    function createSnow() {
        const snowCount = 30; // Количество снежинок
        let snowHTML = '';
        
        for (let i = 0; i < snowCount; i++) {
            // Случайные параметры для каждой снежинки
            const left = Math.random() * 100;
            const animDelay = Math.random() * 10;
            const animDuration = Math.random() * 5 + 5; 
            const size = Math.random() * 10 + 10; 
            const opacity = Math.random() * 0.5 + 0.3;

            snowHTML += `
                <div class="snowflake" style="
                    left: ${left}%; 
                    animation-delay: ${animDelay}s, ${Math.random() * 3}s; 
                    animation-duration: ${animDuration}s, 3s;
                    font-size: ${size}px;
                    opacity: ${opacity};
                ">❅</div>`;
        }
        snowContainer.innerHTML = snowHTML;
    }

    // Удаление снега
    function removeSnow() {
        snowContainer.innerHTML = '';
    }
});
