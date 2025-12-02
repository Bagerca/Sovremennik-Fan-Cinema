document.addEventListener('DOMContentLoaded', () => {
    // 1. Ищем меню
    const navContainer = document.querySelector('.nav-links');
    if (!navContainer) return;

    // 2. Создаем кнопку
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.title = 'Переключить тему';
    navContainer.appendChild(toggleBtn);

    // 3. Создаем контейнеры для эффектов
    const body = document.body;
    
    // Контейнер снега
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    body.appendChild(snowContainer);

    // Контейнер летучих мышей
    const batContainer = document.createElement('div');
    batContainer.id = 'halloween-container';
    body.appendChild(batContainer);

    // Фавикон
    const faviconLink = document.querySelector("link[rel~='icon']");

    // 4. Список тем и текущее состояние
    const themes = ['default', 'newyear', 'halloween'];
    let currentTheme = localStorage.getItem('theme') || 'default';

    // Проверка на валидность темы (вдруг в storage мусор)
    if (!themes.includes(currentTheme)) currentTheme = 'default';

    // Применяем тему при загрузке
    applyTheme(currentTheme);

    // 5. Клик по кнопке (Циклическое переключение)
    toggleBtn.addEventListener('click', () => {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length; // 0 -> 1 -> 2 -> 0
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });

    // --- ФУНКЦИЯ ПРИМЕНЕНИЯ ТЕМЫ ---
    function applyTheme(themeName) {
        // Сброс всех классов и эффектов
        body.classList.remove('new-year-mode', 'halloween-mode');
        snowContainer.innerHTML = '';
        batContainer.innerHTML = '';
        
        // Сохраняем
        localStorage.setItem('theme', themeName);

        // Логика для каждой темы
        switch (themeName) {
            case 'default':
                toggleBtn.innerHTML = '❄️'; // Иконка кнопки (синяя снежинка)
                setFavicon('assets/images/favicon.svg');
                break;

            case 'newyear':
                body.classList.add('new-year-mode');
                toggleBtn.innerHTML = '🎅';
                setFavicon('assets/images/favicon-red.svg');
                createSnow();
                break;

            case 'halloween':
                body.classList.add('halloween-mode');
                toggleBtn.innerHTML = '🎃';
                setFavicon('assets/images/favicon-orange.svg');
                createBats();
                break;
        }
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

    function setFavicon(path) {
        if (faviconLink) faviconLink.href = path;
    }

    // Снег (Новый год)
    function createSnow() {
        const count = 30;
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const animDuration = Math.random() * 5 + 5;
            const size = Math.random() * 10 + 10;
            const opacity = Math.random() * 0.5 + 0.3;
            html += `<div class="snowflake" style="left: ${left}%; animation-duration: ${animDuration}s, 3s; font-size: ${size}px; opacity: ${opacity};">❅</div>`;
        }
        snowContainer.innerHTML = html;
    }

    // Летучие мыши (Хэллоуин)
    function createBats() {
        const count = 15; // Мышей поменьше, они крупные
        let html = '';
        for (let i = 0; i < count; i++) {
            // Случайная задержка и позиция старта
            const left = Math.random() * 100; 
            const animDelay = Math.random() * 10;
            const animDuration = Math.random() * 10 + 10; // Медленнее
            const size = Math.random() * 20 + 20; // 20-40px
            
            // Emoji летучей мыши
            html += `<div class="bat" style="left: ${left}%; animation-delay: ${animDelay}s; animation-duration: ${animDuration}s; font-size: ${size}px;">🦇</div>`;
        }
        batContainer.innerHTML = html;
    }
});
