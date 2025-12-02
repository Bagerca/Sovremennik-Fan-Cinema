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

    // Переменные для шаров
    let ballsContainer = null;
    let svgLayer = null; // Слой для рисования нитей
    let ballsElements = []; 
    let animationFrameId = null;
    
    // Переменные скролла
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

    // --- 2. ОБРАБОТКА СКРОЛЛА ---
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // Копим скорость. 
        // delta > 0 (крутим вниз) -> контент едет вверх -> воздух толкает шар ВВЕРХ (минус Y)
        // Но для инерции "подпрыгивания" нам нужно, чтобы при резком скролле вниз 
        // шар сначала оставался на месте (визуально летел вверх относительно хедера).
        scrollVelocity += delta * 0.5; 
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
        
        // Главный контейнер
        ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        
        // SVG слой для веревок
        svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLayer.classList.add('balls-svg-layer');
        ballsContainer.appendChild(svgLayer);

        // Конфиг шаров: offset (процент от ширины), length (длина нити)
        const ballsConfig = [
            { offset: 10, length: 100, color: 'ball-red', mass: 1.0 },
            { offset: 25, length: 160, color: 'ball-gold', mass: 1.2 },
            { offset: 45, length: 120, color: 'ball-blue', mass: 1.1 },
            { offset: 70, length: 150, color: 'ball-red', mass: 1.3 },
            { offset: 85, length: 90, color: 'ball-gold', mass: 0.9 }
        ];

        ballsElements = [];

        ballsConfig.forEach((config) => {
            // Создаем DOM элемент шара
            const wrapper = document.createElement('div');
            wrapper.className = `ball-wrapper ${config.color}`;
            
            // Внутренности шара
            wrapper.innerHTML = `
                <div class="ball-cap"></div>
                <div class="ball-body"></div>
            `;
            ballsContainer.appendChild(wrapper);

            // Создаем SVG линию (нить)
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.classList.add('rope-path');
            svgLayer.appendChild(path);

            // Физическая модель
            ballsElements.push({
                el: wrapper,
                path: path,
                anchorXPercent: config.offset, // % от ширины экрана
                length: config.length,
                
                // Координаты шара (относительно контейнера)
                x: 0, // Вычислим при старте
                y: config.length,
                
                // Скорость
                vx: 0,
                vy: 0,
                
                mass: config.mass,
                phase: Math.random() * 10 // Для случайного покачивания
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

    // --- 4. ФИЗИЧЕСКИЙ ДВИЖОК ВЕРЕВКИ ---
    function startPhysicsLoop() {
        if (currentTheme !== 'newyear') return;

        const width = window.innerWidth;
        
        // Глобальное замедление скролла (сопротивление среды)
        scrollVelocity *= 0.9; 

        ballsElements.forEach(ball => {
            // 1. Вычисляем точку крепления (Anchor) в пикселях
            const anchorX = (width * ball.anchorXPercent) / 100;
            const anchorY = 0;

            // Если это первый кадр, ставим шар сразу в нужное место
            if (ball.x === 0) ball.x = anchorX;

            // 2. Применяем силы к скорости
            
            // Гравитация (тянет вниз)
            ball.vy += 0.5; 

            // Скролл (Инерция). 
            // Если крутим вниз, scrollVelocity > 0. 
            // Воздух должен толкать шар ВВЕРХ, поэтому вычитаем.
            ball.vy -= scrollVelocity * 0.15 / ball.mass;

            // Ветер (легкое покачивание X)
            ball.vx += Math.sin(Date.now() / 1000 + ball.phase) * 0.05;

            // Сопротивление воздуха (затухание)
            ball.vx *= 0.98;
            ball.vy *= 0.98;

            // 3. Обновляем позицию
            ball.x += ball.vx;
            ball.y += ball.vy;

            // 4. ОГРАНИЧЕНИЕ ВЕРЕВКИ (Constraint)
            const dx = ball.x - anchorX;
            const dy = ball.y - anchorY;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > ball.length) {
                // Если шар улетел дальше длины нити — натягиваем нить
                // Это создает эффект жесткого рывка при натяжении
                const angle = Math.atan2(dy, dx);
                const tension = (dist - ball.length) * 0.1; // Сила пружины

                // Возвращаем шар к радиусу веревки
                const targetX = anchorX + Math.cos(angle) * ball.length;
                const targetY = anchorY + Math.sin(angle) * ball.length;

                ball.vx -= (ball.x - targetX) * 0.2; // Гасим скорость при натяжении
                ball.vy -= (ball.y - targetY) * 0.2;
                
                ball.x = targetX;
                ball.y = targetY;
            } 
            // Если dist < ball.length, нить провисает (шар летит свободно вверх)

            // 5. Рендер Шара
            ball.el.style.transform = `translate(${ball.x}px, ${ball.y}px)`;

            // 6. Рендер Нити (Кривая Безье для провисания)
            // Если нить натянута — прямая линия.
            // Если провисла — кривая.
            
            let pathString = "";
            if (dist >= ball.length - 1) {
                // Натянута: Прямая линия
                pathString = `M ${anchorX} ${anchorY} L ${ball.x} ${ball.y}`;
            } else {
                // Провисает: Кривая
                // Контрольная точка прогибается вниз под гравитацией
                // Середина отрезка
                const midX = (anchorX + ball.x) / 2;
                const midY = (anchorY + ball.y) / 2;
                
                // Насколько сильно провисает (зависит от того, насколько шар поднялся)
                const sag = (ball.length - dist) * 0.5;
                
                // Рисуем кривую (Q - Quadratic Bezier)
                // Контрольная точка смещается вниз (+sag)
                pathString = `M ${anchorX} ${anchorY} Q ${midX} ${midY + sag} ${ball.x} ${ball.y}`;
            }
            
            ball.path.setAttribute("d", pathString);
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
