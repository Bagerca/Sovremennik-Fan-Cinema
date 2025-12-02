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
    let svgLayer = null;
    let ballsElements = []; 
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

    // --- 2. ОБРАБОТКА СКРОЛЛА ---
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // Копим скорость.
        // delta * 0.3 - уменьшили чувствительность к резким рывкам
        scrollVelocity += delta * 0.3; 
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
        
        svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLayer.classList.add('balls-svg-layer');
        ballsContainer.appendChild(svgLayer);

        // УВЕЛИЧИЛ МАССУ (было 1.0 - 1.3, стало 2.0 - 3.5)
        const ballsConfig = [
            { offset: 10, length: 100, color: 'ball-red', mass: 2.5 },
            { offset: 25, length: 160, color: 'ball-gold', mass: 3.5 }, // Самый тяжелый
            { offset: 45, length: 120, color: 'ball-blue', mass: 3.0 },
            { offset: 70, length: 150, color: 'ball-red', mass: 3.2 },
            { offset: 85, length: 90, color: 'ball-gold', mass: 2.0 }
        ];

        ballsElements = [];

        ballsConfig.forEach((config) => {
            const wrapper = document.createElement('div');
            wrapper.className = `ball-wrapper ${config.color}`;
            
            wrapper.innerHTML = `
                <div class="ball-cap"></div>
                <div class="ball-body"></div>
            `;
            ballsContainer.appendChild(wrapper);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.classList.add('rope-path');
            svgLayer.appendChild(path);

            ballsElements.push({
                el: wrapper,
                path: path,
                anchorXPercent: config.offset,
                length: config.length,
                x: 0, 
                y: config.length,
                vx: 0,
                vy: 0,
                mass: config.mass,
                phase: Math.random() * 10 
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

        const width = window.innerWidth;
        
        // Быстрое гашение глобальной скорости скролла (чтобы ветер быстро стихал)
        scrollVelocity *= 0.85; 

        ballsElements.forEach(ball => {
            const anchorX = (width * ball.anchorXPercent) / 100;
            const anchorY = 0;

            if (ball.x === 0) ball.x = anchorX;

            // --- НАСТРОЙКИ ФИЗИКИ ---
            
            // 1. ГРАВИТАЦИЯ (УВЕЛИЧЕНА)
            // Было 0.5, стало 0.8. Теперь их сильнее тянет вниз.
            ball.vy += 0.8; 

            // 2. СИЛА СКРОЛЛА (УМЕНЬШЕНА)
            // Было 0.15, стало 0.05. Теперь скролл толкает их слабее.
            // Делим на массу: чем тяжелее шар, тем меньше он подлетает.
            ball.vy -= scrollVelocity * 0.05 / ball.mass;

            // Ветер (легкое покачивание X)
            ball.vx += Math.sin(Date.now() / 1000 + ball.phase) * 0.05;

            // Сопротивление воздуха
            ball.vx *= 0.98;
            ball.vy *= 0.98;

            // 3. Обновляем позицию
            ball.x += ball.vx;
            ball.y += ball.vy;

            // 4. ОГРАНИЧЕНИЕ ВЕРЕВКИ
            const dx = ball.x - anchorX;
            const dy = ball.y - anchorY;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > ball.length) {
                const angle = Math.atan2(dy, dx);
                
                // Возвращаем шар к радиусу веревки
                const targetX = anchorX + Math.cos(angle) * ball.length;
                const targetY = anchorY + Math.sin(angle) * ball.length;

                // Гасим скорость при натяжении (удар об веревку)
                // Чем меньше коэффициент, тем жестче веревка
                ball.vx -= (ball.x - targetX) * 0.1; 
                ball.vy -= (ball.y - targetY) * 0.1;
                
                ball.x = targetX;
                ball.y = targetY;
            } 

            // 5. Рендер Шара
            ball.el.style.transform = `translate(${ball.x}px, ${ball.y}px)`;

            // 6. Рендер Нити
            let pathString = "";
            if (dist >= ball.length - 1) {
                pathString = `M ${anchorX} ${anchorY} L ${ball.x} ${ball.y}`;
            } else {
                // Провисание
                const midX = (anchorX + ball.x) / 2;
                const midY = (anchorY + ball.y) / 2;
                // Уменьшил провисание (0.3), чтобы нитка не выглядела как резина
                const sag = (ball.length - dist) * 0.3;
                pathString = `M ${anchorX} ${anchorY} Q ${midX} ${midY + sag} ${ball.x} ${ball.y}`;
            }
            
            ball.path.setAttribute("d", pathString);
        });

        animationFrameId = requestAnimationFrame(startPhysicsLoop);
    }

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
