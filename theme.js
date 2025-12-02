document.addEventListener('DOMContentLoaded', () => {
    // 1. Ищем меню
    const navContainer = document.querySelector('.nav-links');
    const header = document.querySelector('header'); // Находим шапку для шаров
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

    // Контейнер для ЕЛОЧНЫХ ШАРОВ (внутри шапки)
    let ballsContainer = null;

    // Фавикон
    const faviconLink = document.querySelector("link[rel~='icon']");

    // 4. Темы
    const themes = ['default', 'newyear', 'halloween'];
    let currentTheme = localStorage.getItem('theme') || 'default';
    if (!themes.includes(currentTheme)) currentTheme = 'default';

    applyTheme(currentTheme);

    // 5. Клик
    toggleBtn.addEventListener('click', () => {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });

    // --- ФУНКЦИЯ ПРИМЕНЕНИЯ ТЕМЫ ---
    function applyTheme(themeName) {
        body.classList.remove('new-year-mode', 'halloween-mode');
        snowContainer.innerHTML = '';
        batContainer.innerHTML = '';
        removeOrnaments(); // Удаляем шары при смене темы
        
        localStorage.setItem('theme', themeName);

        switch (themeName) {
            case 'default':
                toggleBtn.innerHTML = '❄️';
                setFavicon('assets/images/favicon.svg');
                break;

            case 'newyear':
                body.classList.add('new-year-mode');
                toggleBtn.innerHTML = '🎅';
                setFavicon('assets/images/favicon-red.svg');
                createSnow();
                createOrnaments(); // Вешаем шары
                break;

            case 'halloween':
                body.classList.add('halloween-mode');
                toggleBtn.innerHTML = '🎃';
                setFavicon('assets/images/favicon-orange.svg');
                createBats();
                break;
        }
    }

    function setFavicon(path) {
        if (faviconLink) faviconLink.href = path;
    }

    // --- ЛОГИКА ЕЛОЧНЫХ ШАРОВ ---
    function createOrnaments() {
        if (!header) return;
        
        ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        
        // Настройки шаров (смещение по X, длина нити, цвет, скорость качания)
        const ballsConfig = [
            { left: '5%', height: 120, color: 'ball-red', duration: 3.5 },
            { left: '15%', height: 90, color: 'ball-gold', duration: 2.8 },
            { left: '25%', height: 140, color: 'ball-red', duration: 4.2 },
            { left: '55%', height: 100, color: 'ball-gold', duration: 3.1 },
            { left: '85%', height: 130, color: 'ball-red', duration: 3.8 },
            { left: '95%', height: 80, color: 'ball-gold', duration: 2.5 }
        ];

        ballsConfig.forEach(config => {
            const wrapper = document.createElement('div');
            wrapper.className = `ball-wrapper ${config.color}`;
            wrapper.style.left = config.left;
            wrapper.style.animationDuration = `${config.duration}s`; // У каждого своя скорость
            
            // HTML структура шара
            wrapper.innerHTML = `
                <div class="ball-string" style="height: ${config.height}px;"></div>
                <div class="ball-cap"></div>
                <div class="ball-body"></div>
            `;
            
            ballsContainer.appendChild(wrapper);
        });

        header.appendChild(ballsContainer);
    }

    function removeOrnaments() {
        if (ballsContainer) {
            ballsContainer.remove();
            ballsContainer = null;
        }
    }

    // --- ЭФФЕКТЫ ---
    function createSnow() {
        const count = 30;
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const animDelay = Math.random() * 10; 
            const animDuration = Math.random() * 5 + 5; 
            const size = Math.random() * 10 + 10;
            const opacity = Math.random() * 0.5 + 0.3;
            html += `<div class="snowflake" style="left: ${left}%; animation-delay: ${animDelay}s, ${Math.random() * 3}s; animation-duration: ${animDuration}s, 3s; font-size: ${size}px; opacity: ${opacity};">❅</div>`;
        }
        snowContainer.innerHTML = html;
    }

    function createBats() {
        const count = 15;
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100; 
            const animDelay = Math.random() * 10;
            const animDuration = Math.random() * 10 + 10;
            const size = Math.random() * 20 + 20;
            html += `<div class="bat" style="left: ${left}%; animation-delay: ${animDelay}s; animation-duration: ${animDuration}s; font-size: ${size}px;">🦇</div>`;
        }
        batContainer.innerHTML = html;
    }
});
