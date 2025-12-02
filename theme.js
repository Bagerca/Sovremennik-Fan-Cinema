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
    let ropes = []; 
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

    // --- 2. СЛУШАТЕЛЬ СКРОЛЛА ---
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        
        // УМЕНЬШИЛ КОЭФФИЦИЕНТ: было 0.5, стало 0.2
        // Теперь скролл дает более слабый толчок
        scrollVelocity += delta * 0.2;
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

    // --- 3. СОЗДАНИЕ ВЕРЕВОК ---
    function createOrnaments() {
        if (!header) return;
        
        ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        
        svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLayer.classList.add('balls-svg-layer');
        ballsContainer.appendChild(svgLayer);

        // Конфигурация
        const configs = [
            { offset: 10, length: 150, color: 'ball-red' },
            { offset: 25, length: 220, color: 'ball-gold' },
            { offset: 45, length: 180, color: 'ball-blue' },
            { offset: 70, length: 200, color: 'ball-red' },
            { offset: 88, length: 140, color: 'ball-gold' }
        ];

        ropes = [];
        const width = window.innerWidth;

        configs.forEach(conf => {
            const ballEl = document.createElement('div');
            ballEl.className = `ball-wrapper ${conf.color}`;
            ballEl.innerHTML = `<div class="ball-cap"></div><div class="ball-body"></div>`;
            ballsContainer.appendChild(ballEl);

            const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEl.classList.add('rope-path');
            svgLayer.appendChild(pathEl);

            // Увеличил количество сегментов для большей плавности (было 20 -> 25)
            const segmentCount = 25; 
            const segmentLength = conf.length / segmentCount;
            const points = [];
            const startX = (width * conf.offset) / 100;

            for (let i = 0; i <= segmentCount; i++) {
                points.push({
                    x: startX,
                    y: i * segmentLength, 
                    oldX: startX,     
                    oldY: i * segmentLength,
                    pinned: i === 0   
                });
            }

            ropes.push({
                points: points,
                segmentLength: segmentLength,
                ballEl: ballEl,
                pathEl: pathEl,
                anchorXPercent: conf.offset 
            });
        });

        header.appendChild(ballsContainer);
        updatePhysics();
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
        ropes = [];
    }

    // --- 4. ФИЗИЧЕСКИЙ ДВИЖОК (ТЮНИНГ) ---
    function updatePhysics() {
        if (!ropes.length) return;

        // Быстрое гашение скорости скролла, чтобы импульс был коротким
        scrollVelocity *= 0.85;

        // Увеличил гравитацию (было 0.5 -> 0.8), чтобы шары казались тяжелее
        const gravity = 0.8; 
        const friction = 0.92; // Немного увеличил скольжение
        const wind = Math.sin(Date.now() / 2000) * 0.02; // Очень слабый ветер

        ropes.forEach(rope => {
            // A. Verlet Integration
            for (let i = 0; i < rope.points.length; i++) {
                const p = rope.points[i];
                if (p.pinned) continue; 

                const vx = (p.x - p.oldX) * friction;
                const vy = (p.y - p.oldY) * friction;

                p.oldX = p.x;
                p.oldY = p.y;

                p.x += vx + wind;
                p.y += vy + gravity;

                // Сила от скролла:
                // Теперь она действует слабее и с элементом хаоса (чтобы нить гнулась)
                const scrollForce = -scrollVelocity * 0.02; 
                
                // Хаос уменьшен, чтобы нить не трясло слишком сильно
                const chaos = (Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.05;
                
                // Чем ниже сегмент (i), тем сильнее на него влияет инерция
                // p.y += scrollForce * (i / rope.points.length); // Раскомментируйте для линейного влияния
                p.y += scrollForce + chaos;
                p.x += chaos; 
            }

            // B. Constraints (Ограничения длины)
            // Увеличил количество итераций (было 5 -> 10)
            // Это делает веревку более жесткой и менее "резиновой"
            for (let iter = 0; iter < 10; iter++) {
                for (let i = 0; i < rope.points.length - 1; i++) {
                    const p1 = rope.points[i];
                    const p2 = rope.points[i + 1];

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const diff = rope.segmentLength - dist;
                    const percent = diff / dist / 2;
                    
                    const offsetX = dx * percent;
                    const offsetY = dy * percent;

                    if (!p1.pinned) {
                        p1.x -= offsetX;
                        p1.y -= offsetY;
                    }
                    p2.x += offsetX;
                    p2.y += offsetY;
                }
            }

            // C. Render
            let d = `M ${rope.points[0].x} ${rope.points[0].y}`;
            
            // Используем квадратичные кривые для сглаживания углов нити
            // Это сделает веревку визуально более плавной
            for (let i = 1; i < rope.points.length - 1; i++) {
                const xc = (rope.points[i].x + rope.points[i + 1].x) / 2;
                const yc = (rope.points[i].y + rope.points[i + 1].y) / 2;
                d += ` Q ${rope.points[i].x} ${rope.points[i].y}, ${xc} ${yc}`;
            }
            // Последний сегмент прямой линией
            d += ` L ${rope.points[rope.points.length - 1].x} ${rope.points[rope.points.length - 1].y}`;
            
            rope.pathEl.setAttribute('d', d);

            // Поворот шара
            const lastP = rope.points[rope.points.length - 1];
            const prevP = rope.points[rope.points.length - 2];
            const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) * 180 / Math.PI;
            const rotation = angle - 90;

            // Добавляем плавность движению самого шара, чтобы он не дергался
            rope.ballEl.style.transform = `translate(${lastP.x}px, ${lastP.y}px) rotate(${rotation}deg)`;
        });

        animationFrameId = requestAnimationFrame(updatePhysics);
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
