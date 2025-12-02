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
    let ropes = []; // Массив объектов веревок
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
        // Накапливаем скорость для инерции
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

    // --- 3. СОЗДАНИЕ ВЕРЕВОК (VERLET INTEGRATION) ---
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
            // 1. Создаем DOM элемента шара
            const ballEl = document.createElement('div');
            ballEl.className = `ball-wrapper ${conf.color}`;
            ballEl.innerHTML = `<div class="ball-cap"></div><div class="ball-body"></div>`;
            ballsContainer.appendChild(ballEl);

            // 2. Создаем SVG путь
            const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEl.classList.add('rope-path');
            svgLayer.appendChild(pathEl);

            // 3. Генерируем точки (сегменты) веревки
            // Чем больше сегментов, тем более гибкая веревка ("змейка")
            const segmentCount = 20; 
            const segmentLength = conf.length / segmentCount;
            const points = [];
            const startX = (width * conf.offset) / 100;

            for (let i = 0; i <= segmentCount; i++) {
                points.push({
                    x: startX,
                    y: i * segmentLength, // Начальное положение - висит прямо
                    oldX: startX,     // Для алгоритма Верле (предыдущая позиция)
                    oldY: i * segmentLength,
                    pinned: i === 0   // Первая точка прибита к потолку
                });
            }

            ropes.push({
                points: points,
                segmentLength: segmentLength,
                ballEl: ballEl,
                pathEl: pathEl,
                anchorXPercent: conf.offset // Чтобы пересчитывать при ресайзе (опционально)
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

    // --- 4. ФИЗИЧЕСКИЙ ДВИЖОК ---
    function updatePhysics() {
        if (!ropes.length) return;

        // Затухание глобального скролла
        scrollVelocity *= 0.9;

        const gravity = 0.5;
        const friction = 0.9; // Трение воздуха (чем меньше, тем быстрее останавливается)
        const wind = Math.sin(Date.now() / 1500) * 0.05; // Легкий ветерок

        ropes.forEach(rope => {
            // A. ОБНОВЛЕНИЕ ТОЧЕК (Verlet Integration)
            // x = x + (x - oldX) * friction + force
            
            for (let i = 0; i < rope.points.length; i++) {
                const p = rope.points[i];
                if (p.pinned) continue; // Точка крепления не двигается

                const vx = (p.x - p.oldX) * friction;
                const vy = (p.y - p.oldY) * friction;

                p.oldX = p.x;
                p.oldY = p.y;

                // Применяем силы
                p.x += vx + wind;
                p.y += vy + gravity;

                // Сила от скролла (действует на все точки, но сильнее снизу)
                // Имитация сопротивления воздуха при движении страницы
                // (scrollVelocity > 0 значит едем вниз, значит веревка летит ВВЕРХ)
                const scrollForce = -scrollVelocity * 0.05; 
                
                // Хаос: добавляем случайность, чтобы веревка изгибалась, а не летела палкой
                // Чем ниже точка (i), тем сильнее на нее влияет инерция
                const chaos = (Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.1;
                
                p.y += scrollForce + chaos;
                p.x += chaos; // Скролл трясет веревку и по горизонтали чуть-чуть
            }

            // B. ОГРАНИЧЕНИЯ (CONSTRAINTS) - Самое важное для веревки
            // Заставляем точки держаться на фиксированном расстоянии друг от друга
            // Повторяем несколько раз для жесткости (Solver Iterations)
            for (let iter = 0; iter < 5; iter++) {
                for (let i = 0; i < rope.points.length - 1; i++) {
                    const p1 = rope.points[i];
                    const p2 = rope.points[i + 1];

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Насколько растянулась/сжалась
                    const diff = rope.segmentLength - dist;
                    const percent = diff / dist / 2; // Делим пополам, чтобы сдвинуть обе точки
                    
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

            // C. ОТРИСОВКА (RENDER)
            
            // 1. Рисуем нить через SVG
            // Используем L (линии) между точками. 
            // При 20 сегментах это выглядит как кривая.
            let d = `M ${rope.points[0].x} ${rope.points[0].y}`;
            for (let i = 1; i < rope.points.length; i++) {
                d += ` L ${rope.points[i].x} ${rope.points[i].y}`;
            }
            rope.pathEl.setAttribute('d', d);

            // 2. Двигаем шар (последняя точка)
            const lastP = rope.points[rope.points.length - 1];
            // Используем rotate, чтобы шар наклонялся по ходу движения веревки
            // Вычисляем угол наклона последнего сегмента
            const prevP = rope.points[rope.points.length - 2];
            const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) * 180 / Math.PI;
            // Корректируем угол (90 градусов, т.к. 0 это вправо)
            const rotation = angle - 90;

            rope.ballEl.style.transform = `translate(${lastP.x}px, ${lastP.y}px) rotate(${rotation}deg)`;
        });

        animationFrameId = requestAnimationFrame(updatePhysics);
    }

    // Функции снега и мышей остаются теми же...
    function createSnow() { /* Ваш код снега */
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

    function createBats() { /* Ваш код мышей */
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
