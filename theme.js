document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.querySelector('.nav-links');
    const header = document.querySelector('header');
    if (!navContainer) return;

    // Кнопка
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.title = 'Переключить тему';
    navContainer.appendChild(toggleBtn);

    // Контейнеры
    const body = document.body;
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    body.appendChild(snowContainer);

    const batContainer = document.createElement('div');
    batContainer.id = 'halloween-container';
    body.appendChild(batContainer);

    // Переменные для шаров
    let ballsContainer = null;
    let ballsElements = []; // Массив объектов с физикой { element, angle, velocity, length }
    let animationFrameId = null;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const faviconLink = document.querySelector("link[rel~='icon']");

    const themes = ['default', 'newyear', 'halloween'];
    let currentTheme = localStorage.getItem('theme') || 'default';
    if (!themes.includes(currentTheme)) currentTheme = 'default';

    applyTheme(currentTheme);

    toggleBtn.addEventListener('click', () => {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        applyTheme(currentTheme);
    });

    // --- СЛУШАТЕЛЬ СКРОЛЛА ДЛЯ ФИЗИКИ ---
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        // Вычисляем скорость скролла (разница между текущей и прошлой позицией)
        // Делим на коэффициент, чтобы сила удара не была слишком дикой
        const delta = (currentScrollY - lastScrollY) * 0.15;
        
        scrollVelocity = delta;
        lastScrollY = currentScrollY;

        // Если включен Новый год, передаем импульс шарам
        if (currentTheme === 'newyear' && ballsElements.length > 0) {
            ballsElements.forEach(ball => {
                // Добавляем импульс к текущей скорости шара
                // ball.mass - чтобы тяжелые (длинные) шары реагировали медленнее
                ball.velocity += scrollVelocity / ball.mass; 
            });
        }
    });

    function applyTheme(themeName) {
        body.classList.remove('new-year-mode', 'halloween-mode');
        snowContainer.innerHTML = '';
        batContainer.innerHTML = '';
        removeOrnaments(); // Удаляем старые шары и останавливаем физику
        
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
                createOrnaments(); // Создаем шары с физикой
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

    // --- ФИЗИКА ЕЛОЧНЫХ ШАРОВ ---
    function createOrnaments() {
        if (!header) return;
        
        ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        
        // Конфигурация шаров
        // mass: чем больше, тем тяжелее раскачать и дольше останавливается
        const ballsConfig = [
            { left: '10%', height: 60, color: 'ball-red', mass: 1.5 },
            { left: '25%', height: 100, color: 'ball-gold', mass: 2.2 },
            { left: '40%', height: 80, color: 'ball-blue', mass: 1.8 },
            { left: '70%', height: 120, color: 'ball-gold', mass: 2.5 },
            { left: '85%', height: 70, color: 'ball-red', mass: 1.6 }
        ];

        ballsElements = []; // Очищаем массив

        ballsConfig.forEach(config => {
            const wrapper = document.createElement('div');
            wrapper.className = `ball-wrapper ${config.color}`;
            wrapper.style.left = config.left;
            
            wrapper.innerHTML = `
                <div class="ball-string" style="height: ${config.height}px;"></div>
                <div class="ball-cap"></div>
                <div class="ball-body"></div>
            `;
            
            ballsContainer.appendChild(wrapper);

            // Сохраняем объект для физики
            ballsElements.push({
                el: wrapper,
                angle: 0,       // Текущий угол
                velocity: 0,    // Текущая скорость
                mass: config.mass, // "Вес" шара (влияет на инерцию)
                damping: 0.98   // Коэффициент затухания (трение воздуха)
            });
        });

        header.appendChild(ballsContainer);
        
        // Запускаем цикл анимации
        startPhysicsLoop();
    }

    function removeOrnaments() {
        if (ballsContainer) {
            ballsContainer.remove();
            ballsContainer = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        ballsElements = [];
    }

    // Главный цикл физики (60 FPS)
    function startPhysicsLoop() {
        if (currentTheme !== 'newyear') return;

        ballsElements.forEach(ball => {
            // 1. Сила возврата (Гравитация)
            // Чем больше угол, тем сильнее тянет обратно к 0
            const force = -0.05 * ball.angle; 

            // 2. Ускорение = Сила
            ball.velocity += force;

            // 3. Трение (Затухание)
            ball.velocity *= ball.damping;

            // 4. Обновляем угол
            ball.angle += ball.velocity;

            // 5. Ограничиваем максимальный угол (чтобы не крутились солнышком)
            if (ball.angle > 60) { ball.angle = 60; ball.velocity *= -0.5; }
            if (ball.angle < -60) { ball.angle = -60; ball.velocity *= -0.5; }

            // 6. Применяем к DOM элементу
            // Используем rotate3d для плавности
            ball.el.style.transform = `rotate(${ball.angle}deg)`;
        });

        animationFrameId = requestAnimationFrame(startPhysicsLoop);
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
            html += `<div class="snowflake" style="left: ${left}%; animation-delay: ${animDelay}s; animation-duration: ${animDuration}s; font-size: ${size}px; opacity: ${opacity};">❅</div>`;
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
