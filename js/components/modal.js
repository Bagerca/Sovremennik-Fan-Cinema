window.AppComponents = window.AppComponents || {};

window.AppComponents.Modal = (function() {
    let currentMovie = null;
    let mediaIndex = 0;
    let isTransitioning = false; 

    const root = document.getElementById('modal-root');
    const svgCloseIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

    function lockScroll() {
        document.documentElement.classList.add('no-scroll');
        document.body.classList.add('no-scroll');
    }

    function unlockScroll() {
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
    }

    function getThumbUrl(item) {
        if (item.type === 'video') return `https://i.ytimg.com/vi/${item.src}/mqdefault.jpg`;
        return item.src;
    }

    const escHandler = (e) => {
        if (e.key === 'Escape') close();
    };

    function generateModalInnerHtml(movie) {
        currentMovie = movie;
        mediaIndex = 0;
        const mediaList = movie.media && movie.media.length ? movie.media : [{ type: 'video', src: movie.trailer }];
        const ratingConf = AppHelpers.getRatingConfig(movie.rating);

        /* --- ГАЛЕРЕЯ В ВИДЕ ПАНЕЛЬКИ --- */
        let galleryHtml = '';
        if (mediaList.length > 1) {
            galleryHtml = `
            <div class="glass-panel media-gallery-panel">
                <div class="media-gallery" id="mediaGallery">`;
            
            mediaList.forEach((item, idx) => {
                const thumb = getThumbUrl(item);
                const playOverlay = item.type === 'video' ? '<div class="play-icon-overlay"></div>' : '';
                galleryHtml += `
                    <button class="gallery-item" onclick="AppComponents.Modal.setMedia(${idx})" aria-label="Смотреть медиа ${idx + 1}">
                        <img src="${thumb}" alt="Media ${idx + 1}" onerror="AppHelpers.handleImageError(this)">
                        ${playOverlay}
                    </button>
                `;
            });
            galleryHtml += `</div></div>`;
        }

        const now = new Date();
        let sessionsHtml = '<div class="no-sessions-stub">Сеансов нет</div>';
        if (movie.schedule) {
            let futureSessions = [];
            movie.schedule.forEach(block => {
                (block.dates || []).forEach(date => {
                    (block.sessions || []).forEach(session => {
                        const dt = new Date(`${date}T${session.time}`);
                        if (dt > now) futureSessions.push({ dt, date, ...session });
                    });
                });
            });
            futureSessions.sort((a,b) => a.dt - b.dt);
            if (futureSessions.length > 0) {
                sessionsHtml = futureSessions.slice(0, 4).map(s => {
                    const d = AppHelpers.formatDateShort(s.date);
                    return `
                    <button class="mini-ticket-btn" onclick="window.location.hash='#/schedule?book=${movie.movieId}&date=${s.date}&time=${s.time}'" aria-label="Купить билет на ${s.time}">
                        <div class="ticket-time-col">
                            <span class="ticket-time">${s.time}</span>
                            <span class="ticket-date">${d.day} ${d.month}</span>
                        </div>
                        <div class="ticket-price-col">
                            <span class="ticket-price">${s.price} ₽</span>
                            <span class="ticket-format">${s.format}</span>
                        </div>
                    </button>`;
                }).join('');
            }
        }

        let stackHtml = '';
        let thumbnailsHtml = '';
        
        let parts = [movie];
        let currentIndex = 0;

        if (movie.franchise) {
            parts = AppStore.state.movies
                .filter(m => m.franchise === movie.franchise)
                .sort((a, b) => a.part - b.part);
            currentIndex = parts.findIndex(p => p.movieId === movie.movieId);
        }

        const stackCount = Math.min(parts.length, 3);
        let imagesHtml = '';
        parts.forEach((p, idx) => {
            let relIndex = (idx - currentIndex + parts.length) % parts.length;
            let posClass = 'is-hidden';
            if (relIndex === 0) posClass = 'is-front';
            else if (relIndex === 1 && stackCount >= 2) posClass = 'is-back';
            else if (relIndex === 2 && stackCount >= 3) posClass = 'is-back-2';

            imagesHtml += `<img class="modal-poster-img ${posClass}" src="${p.poster || AppHelpers.getPlaceholder()}" onerror="AppHelpers.handleImageError(this)">`;
        });

        const nextPartId = parts[(currentIndex + 1) % parts.length].movieId;
        const stackClickAttr = parts.length > 1 ? `onclick="window.location.hash='#/library?movie=${nextPartId}'"` : '';
        const interactiveClass = parts.length > 1 ? 'is-interactive' : '';

        stackHtml = `
            <div class="modal-poster-wrapper stack-${stackCount} ${interactiveClass}" ${stackClickAttr}>
                <div class="modal-poster-glow"></div>
                ${imagesHtml}
            </div>
        `;

        /* --- ФРАНШИЗА В ВИДЕ ПАНЕЛЬКИ (БЕЗ ЗАГОЛОВКА) --- */
        if (parts.length > 1) {
            thumbnailsHtml = `
            <div class="glass-panel franchise-panel">
                <div class="poster-thumbnails">
            `;
            parts.forEach((p, idx) => {
                const isActive = idx === currentIndex ? 'active' : '';
                thumbnailsHtml += `
                    <div class="thumb-item ${isActive}" title="${p.partName || p.title}" onclick="window.location.hash='#/library?movie=${p.movieId}'">
                        <img src="${p.poster || AppHelpers.getPlaceholder()}" onerror="AppHelpers.handleImageError(this)">
                    </div>
                `;
            });
            thumbnailsHtml += `</div></div>`;
        }

        let descHtml = `<div class="description-text desc-clamp" id="modal-desc-text">${movie.description || 'Описание отсутствует.'}</div>`;

        return `
            <div class="modal-backdrop-blur" style="background-image: url('${movie.poster || ''}')"></div>
            <div class="modal-gradient-overlay"></div>
            
            <div class="mobile-drag-handle"></div>
            <button class="close-btn" onclick="AppComponents.Modal.close()" aria-label="Закрыть модальное окно">${svgCloseIcon}</button>
            
            <div class="info-modal-body fade-transition active">
                <div class="info-layout">
                    
                    <div class="info-col-visual">
                        ${stackHtml}
                        ${thumbnailsHtml}
                    </div>

                    <div class="info-col-main">
                        <div class="glass-panel main-info-panel">
                            <div class="title-row">
                                <h2 class="info-main-title">${movie.title}</h2>
                                <div class="rating-badge-large ${ratingConf.className}">${ratingConf.text}</div>
                            </div>
                            <div class="desc-inner-panel desc-tooltip-wrapper">
                                ${descHtml}
                                <div class="desc-tooltip">${movie.description}</div>
                            </div>
                        </div>

                        <div class="info-col-trailer">
                            <div style="position: relative;">
                                <div class="media-container" id="mediaContainer" aria-live="polite"></div>
                                ${mediaList.length > 1 ? `
                                    <button class="slider-arrow prev" onclick="AppComponents.Modal.prevMedia()" aria-label="Предыдущее медиа">❮</button>
                                    <button class="slider-arrow next" onclick="AppComponents.Modal.nextMedia()" aria-label="Следующее медиа">❯</button>
                                ` : ''}
                            </div>
                            ${galleryHtml}
                        </div>
                    </div>

                    <div class="info-col-sessions">
                        <div class="glass-panel" style="margin-bottom: 25px;">
                            <div class="sessions-header">Расписание сеансов</div>
                            <div class="mini-schedule-list">${sessionsHtml}</div>
                        </div>
                        <div class="glass-panel">
                            <div class="spec-row"><span class="spec-label">Год:</span><span class="spec-value">${movie.year}</span></div>
                            <div class="spec-row"><span class="spec-label">Страна:</span><span class="spec-value">${movie.country}</span></div>
                            <div class="spec-row"><span class="spec-label">Режиссер:</span><span class="spec-value">${movie.director}</span></div>
                            <div class="spec-row"><span class="spec-label">Время:</span><span class="spec-value">${movie.duration}</span></div>
                            <div class="spec-row"><span class="spec-label">MPAA:</span><span class="spec-value spec-badge">${movie.mpaa}</span></div>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
    }

    function openModalFresh(movie) {
        root.innerHTML = `
        <dialog class="modal-overlay" id="movie-modal" aria-labelledby="modal-title">
            <div class="modal-content info-modal-content" id="modal-dynamic-content">
                ${generateModalInnerHtml(movie)}
            </div>
        </dialog>`;
        
        const dialog = document.getElementById('movie-modal');
        dialog.showModal();
        
        updateMedia();
        bindEvents();
        lockScroll();
    }

    function smoothUpdateModal(movie) {
        if (isTransitioning) return;
        isTransitioning = true;

        const contentWrapper = document.getElementById('modal-dynamic-content');
        const body = contentWrapper.querySelector('.info-modal-body');
        const bgBlur = contentWrapper.querySelector('.modal-backdrop-blur');

        if (body) body.classList.remove('active');
        if (bgBlur) bgBlur.style.opacity = '0.3';

        setTimeout(() => {
            contentWrapper.innerHTML = generateModalInnerHtml(movie);
            updateMedia();
            
            requestAnimationFrame(() => {
                const newBody = contentWrapper.querySelector('.info-modal-body');
                const newBg = contentWrapper.querySelector('.modal-backdrop-blur');
                if (newBody) newBody.classList.add('active');
                if (newBg) newBg.style.opacity = '1';
                isTransitioning = false;
            });
        }, 250); 
    }

    function updateMedia() {
        const mc = document.getElementById('mediaContainer');
        if (!mc || !currentMovie || !currentMovie.media) return;
        
        const list = currentMovie.media.length ? currentMovie.media : [{type:'video', src: currentMovie.trailer}];
        const item = list[mediaIndex];
        
        mc.innerHTML = item.type === 'video' 
            ? `<iframe class="media-content active" src="https://www.youtube.com/embed/${item.src}?rel=0" allow="fullscreen" allowfullscreen></iframe>`
            : `<img class="media-content active" src="${item.src}" alt="Галерея" onerror="AppHelpers.handleImageError(this)">`;
        
        const galleryItems = document.querySelectorAll('.gallery-item');
        const gallery = document.getElementById('mediaGallery');
        
        if (galleryItems.length > 0 && gallery) {
            galleryItems.forEach((el, idx) => {
                el.classList.toggle('active', idx === mediaIndex);
                if (idx === mediaIndex) {
                    const scrollLeft = el.offsetLeft - (gallery.clientWidth / 2) + (el.clientWidth / 2);
                    gallery.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            });
        }
    }

    function bindEvents() {
        const dialog = document.getElementById('movie-modal');
        dialog.addEventListener('click', e => {
            if (e.target === dialog) close();
        });
        document.addEventListener('keydown', escHandler);
        
        const closeBtn = document.querySelector('.close-btn');
        if(closeBtn) closeBtn.focus();
    }

    function close() {
        document.removeEventListener('keydown', escHandler);
        const dialog = document.querySelector('dialog.modal-overlay');
        if (dialog && typeof dialog.close === 'function') dialog.close();
        root.innerHTML = '';
        AppRouter.updateParams({ movie: null, book: null });
        unlockScroll();
        currentMovie = null;
    }

    return {
        handleParams(params) {
            try {
                const movieId = params.get('movie');
                const bookId = params.get('book');
                
                if (movieId) {
                    if (window.innerWidth <= 768) {
                        AppHelpers.showToast('Информация о фильме недоступна на мобильных устройствах');
                        AppRouter.updateParams({ movie: null });
                        return;
                    }

                    const m = AppStore.state.movies.find(x => x.movieId === movieId);
                    if (m) {
                        const existingModal = document.getElementById('movie-modal');
                        if (existingModal) {
                            smoothUpdateModal(m);
                        } else {
                            openModalFresh(m);
                        }
                    } else { 
                        console.warn('Фильм не найден'); close(); 
                    }
                } else if (bookId) {
                    const m = AppStore.state.movies.find(x => x.movieId === bookId);
                    const time = params.get('time') || '00:00';
                    if (m) { lockScroll(); window.AppComponents.HallScheme.render(m, time); }
                    else { console.warn('Сеанс не найден'); close(); }
                } else {
                    close();
                }
            } catch (e) {
                console.error('[Modal] Ошибка обработки параметров:', e);
                close();
            }
        },
        close,
        setMedia(index) {
            if (!currentMovie || !currentMovie.media) return;
            mediaIndex = index;
            updateMedia();
        },
        prevMedia() {
            if (!currentMovie || !currentMovie.media) return;
            mediaIndex = mediaIndex - 1 < 0 ? currentMovie.media.length - 1 : mediaIndex - 1;
            updateMedia();
        },
        nextMedia() {
            if (!currentMovie || !currentMovie.media) return;
            mediaIndex = mediaIndex + 1 >= currentMovie.media.length ? 0 : mediaIndex + 1;
            updateMedia();
        }
    };
})();