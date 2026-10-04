window.AppComponents = window.AppComponents || {};

window.AppComponents.ThemeEffects = (function() {
    const root = document.getElementById('theme-effects-root');
    let animationId = null;
    let ropes = [];
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    function updatePhysics() {
        if (!ropes.length) return;
        scrollVelocity *= 0.85;
        const gravity = 0.8, friction = 0.92, wind = Math.sin(Date.now() / 2000) * 0.02;

        ropes.forEach(rope => {
            for (let i = 0; i < rope.points.length; i++) {
                const p = rope.points[i];
                if (p.pinned) continue;
                const vx = (p.x - p.oldX) * friction, vy = (p.y - p.oldY) * friction;
                p.oldX = p.x; p.oldY = p.y;
                p.x += vx + wind + ((Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.05);
                p.y += vy + gravity - (scrollVelocity * 0.02) + ((Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.05);
            }
            for (let iter = 0; iter < 20; iter++) {
                for (let i = 0; i < rope.points.length - 1; i++) {
                    const p1 = rope.points[i], p2 = rope.points[i + 1];
                    const dx = p2.x - p1.x, dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const percent = (rope.segmentLength - dist) / dist / 2;
                    const offsetX = dx * percent, offsetY = dy * percent;
                    if (!p1.pinned) { p1.x -= offsetX; p1.y -= offsetY; }
                    p2.x += offsetX; p2.y += offsetY;
                }
            }
            let d = `M ${rope.points[0].x} ${rope.points[0].y}`;
            for (let i = 1; i < rope.points.length - 1; i++) d += ` Q ${rope.points[i].x} ${rope.points[i].y}, ${(rope.points[i].x + rope.points[i+1].x)/2} ${(rope.points[i].y + rope.points[i+1].y)/2}`;
            const lastP = rope.points[rope.points.length - 1];
            d += ` L ${lastP.x} ${lastP.y + 10}`;
            rope.pathEl.setAttribute('d', d);
            const prevP = rope.points[rope.points.length - 2];
            let targetRotation = (Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) * 180 / Math.PI) - 90;
            rope.currentRotation += (targetRotation - rope.currentRotation) * 0.1;
            rope.ballEl.style.transform = `translate(${lastP.x}px, ${lastP.y}px) rotate(${rope.currentRotation}deg)`;
        });
        animationId = requestAnimationFrame(updatePhysics);
    }

    function createNewYear() {
        root.innerHTML = '';
        // Снег
        for (let i = 0; i < 30; i++) {
            const el = document.createElement('div');
            el.className = 'snowflake';
            el.innerHTML = '❅';
            el.style = `left:${Math.random()*100}%; animation-delay:${Math.random()*10}s; animation-duration:${Math.random()*5+5}s; font-size:${Math.random()*10+10}px; opacity:${Math.random()*0.5+0.3};`;
            root.appendChild(el);
        }
        
        // Шары
        const ballsContainer = document.createElement('div');
        ballsContainer.className = 'christmas-balls-container';
        ballsContainer.style.top = '70px'; // Ниже шапки
        
        const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLayer.classList.add('balls-svg-layer');
        ballsContainer.appendChild(svgLayer);
        root.appendChild(ballsContainer);

        const configs = [
            { offset: 10, length: 150, color: 'ball-red' }, { offset: 25, length: 220, color: 'ball-gold' },
            { offset: 45, length: 120, color: 'ball-blue' }, { offset: 70, length: 200, color: 'ball-red' },
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

            const points = [];
            const startX = (width * conf.offset) / 100;
            for (let i = 0; i <= 25; i++) points.push({ x: startX, y: i * (conf.length/25), oldX: startX, oldY: i * (conf.length/25), pinned: i===0 });
            ropes.push({ points, segmentLength: conf.length/25, ballEl, pathEl, currentRotation: 0 });
        });
        updatePhysics();
    }

    function createHalloween() {
        root.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const el = document.createElement('div');
            el.className = 'bat';
            el.innerHTML = '🦇';
            el.style = `left:${Math.random()*100}%; animation-delay:${Math.random()*10}s; animation-duration:${Math.random()*10+10}s; font-size:${Math.random()*20+20}px;`;
            root.appendChild(el);
        }
    }

    return {
        init() {
            window.addEventListener('scroll', () => {
                const y = window.scrollY;
                scrollVelocity += (y - lastScrollY) * 0.2;
                lastScrollY = y;
            });

            AppStore.subscribe('SET_THEME', (theme) => {
                if (animationId) cancelAnimationFrame(animationId);
                ropes = [];
                root.innerHTML = '';
                
                if (theme === 'newyear') createNewYear();
                if (theme === 'halloween') createHalloween();

                // Обновляем фавикон
                const fav = document.getElementById('dynamic-favicon');
                if(theme === 'newyear') fav.href = 'assets/images/favicon-red.svg';
                else if(theme === 'halloween') fav.href = 'assets/images/favicon-orange.svg';
                else fav.href = 'assets/images/favicon.svg';
            });
        }
    };
})();