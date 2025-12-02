document.addEventListener('DOMContentLoaded', () => {
    // 1. Создаем кнопку переключения
    const navContainer = document.querySelector('.nav-links');
    if (!navContainer) return; // Защита, если навигации нет

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.title = 'Включить новогоднее настроение';
    toggleBtn.innerHTML = '❄️'; // Иконка снежинки
    
    // Вставляем кнопку в конец навигации
    navContainer.appendChild(toggleBtn);

    // 2. Логика работы
    const body = document.body;
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    body.appendChild(snowContainer);

    // Проверяем сохраненную настройку
    const isNewYear = localStorage.getItem('theme') === 'newyear';
    
    if (isNewYear) {
        enableTheme();
    }

    toggleBtn.addEventListener('click', () => {
        if (body.classList.contains('new-year-mode')) {
            disableTheme();
        } else {
            enableTheme();
        }
    });

    function enableTheme() {
        body.classList.add('new-year-mode');
        localStorage.setItem('theme', 'newyear');
        toggleBtn.innerHTML = '🎅'; // Меняем иконку на Деда Мороза
        createSnow();
    }

    function disableTheme() {
        body.classList.remove('new-year-mode');
        localStorage.setItem('theme', 'default');
        toggleBtn.innerHTML = '❄️';
        removeSnow();
    }

    // 3. Генерация снега
    function createSnow() {
        const snowCount = 30; // Количество снежинок
        let snowHTML = '';
        
        for (let i = 0; i < snowCount; i++) {
            // Рандомизация позиций и скорости
            const left = Math.random() * 100;
            const animDelay = Math.random() * 10;
            const animDuration = Math.random() * 5 + 5; // от 5 до 10 сек
            const size = Math.random() * 10 + 10; // размер от 10px до 20px
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

    function removeSnow() {
        snowContainer.innerHTML = '';
    }
});
