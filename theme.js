document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.querySelector('.nav-links');
    const header = document.querySelector('header');
    if (!navContainer) return;

    // --- 1. КНОПКА И КОНТЕЙНЕРЫ ---
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.title = 'Переключить тему';
    navContainer.appendChild(toggleBtn);

    const body = document.body;
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    body.appendChild(snowContainer);

    const batContainer = document.createElement('div');
    batContainer.id = 'halloween-container';
    body.appendChild(batContainer);

    let ballsContainer = null;
    let ballsElements = []; 
    let animationFrameId = null;
    let lastScrollY = window.scrollY;
    let currentScrollVelocity = 0; // Текущая скорость скролла для сглаживания

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

    // --- 2. ОБРАБОТКА СКРОЛЛА (СГЛАЖИВАНИЕ) ---
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        // Разница в скролле
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // Вместо мгновенного удара мы накапливаем скорость плавно.
        // Коэффициент 0.05 делает реакцию "ленивой" (тяжелой).
        currentScrollVelocity += delta * 0.05;
    });

    function applyTheme(themeName) {
        body.classList.remove('new-year-mode', 'halloween-mode');
        snowContainer.innerHTML = '';
        batContainer.innerHTML = '';
        removeOrnaments();
        
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
                createOrnaments();
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

    // --- 3. СОЗДАНИЕ ШАРОВ ---
    function createOrnaments() {
        if (!header) return;
        
        ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        
        // Настройки "веса" и длины
        // mass: чем больше, тем медленнее разгоняется и медленнее тормозит
        const ballsConfig = [
            { left: '10%', height: 70, color: 'ball-red', mass: 4 },
            { left: '25%', height: 120, color: 'ball-gold', mass: 6 }, // Самый тяжелый
            { left: '40%', height: 90, color: 'ball-blue', mass: 4.5 },
            { left: '60%', height: 110, color: 'ball-red', mass: 5.5 },
            { left: '80%', height: 80, color: 'ball-gold', mass: 4.2 },
            { left: '92%', height: 130, color: 'ball-blue', mass: 6.5 }
        ];

        ballsElements = [];

        ballsConfig.forEach((config, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = `ball-wrapper ${config.color}`;
            wrapper.style.left = config.left;
            
            wrapper.innerHTML = `
                <div class="ball-string" style="height: ${config.height}px;"></div>
                <div class="ball-cap"></div>
                <div class="ball-body"></div>
            `;
            
            ballsContainer.appendChild(wrapper);

            ballsElements.push({
                el: wrapper,
                angle: 0,
                velocity: 0,
                mass: config.mass,
                // Добавляем фазу для фонового покачивания, чтобы они не качались синхронно
                phase: Math.random() * Math.PI * 2 
            });
        });

        header.appendChild(ballsContainer);
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

    // --- 4. ФИЗИЧЕСКИЙ ДВИЖОК ---
    function startPhysicsLoop() {
        if (currentTheme !== 'newyear') return;

        // Постепенно гасим "глобальную скорость скролла", имитируя сопротивление воздуха
        currentScrollVelocity *= 0.9;

        ballsElements.forEach(ball => {
            // 1. ВЛИЯНИЕ СКРОЛЛА (ИМПУЛЬС)
            // Делим на массу: тяжелые шары реагируют слабее
            // Ограничиваем силу удара (clamp), чтобы шар не сделал "солнышко" при бешеном скролле
            let force = Math.max(-2, Math.min(2, currentScrollVelocity)) / ball.mass;

            // 2. ГРАВИТАЦИЯ (ВОЗВРАТ К ЦЕНТРУ)
            // Было -0.05, ставим -0.015. 
            // Это делает возвращение очень плавным и "тягучим"
            const gravity = -0.015 * ball.angle;

            // 3. ФОНОВОЕ ПОКАЧИВАНИЕ (ВЕТЕР)
            // Добавляем микро-силу по синусоиде, чтобы они "жили"
            const time = Date.now() / 1000;
            const wind = Math.sin(time + ball.phase) * 0.02;

            // Суммируем силы
            ball.velocity += force + gravity + wind;

            // 4. ТРЕНИЕ (ЗАТУХАНИЕ)
            // 0.995 - очень скользко, они будут долго качаться по инерции
            ball.velocity *= 0.995;

            // 5. Обновляем угол
            ball.angle += ball.velocity;

            // 6. Рендер
            ball.el.style.transform = `rotate(${ball.angle}deg)`;
        });

        animationFrameId = requestAnimationFrame(startPhysicsLoop);
    }

    // --- ЭФФЕКТЫ СНЕГА И МЫШЕЙ ---
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
