window.AppViews = window.AppViews || {};

window.AppViews.Schedule = {
    _onStateChange: null,

    render() {
        const state = AppStore.state;
        const dates = AppHelpers.generateScheduleDates();
        
        let dateHtml = dates.map((d, i) => {
            const dateObj = AppHelpers.formatDateShort(d);
            let label = dateObj.weekday;
            
            if (i === 2) label = "Вчера";
            else if (i === 3) label = "Сегодня";
            else if (i === 4) label = "Завтра";
            
            return `
            <div class="date-card ${d === state.scheduleDate ? 'active' : ''}" onclick="AppStore.dispatch('UPDATE_STATE', {scheduleDate: '${d}'})">
                <span class="day-name">${label}</span>
                <span class="day-number">${dateObj.day} ${dateObj.month}</span>
            </div>`;
        }).join('');

        const moviesOnDate = state.movies.map(m => {
            const block = m.schedule && m.schedule.find(b => b.dates.includes(state.scheduleDate));
            if(block) return {...m, sessions: block.sessions.sort((a,b)=>a.time.localeCompare(b.time))};
            return null;
        }).filter(Boolean).sort((a,b)=> a.sessions[0].time.localeCompare(b.sessions[0].time));

        const now = new Date();
        let moviesHtml = '';
        moviesOnDate.forEach(m => {
            let sessionsHtml = m.sessions.map(s => {
                const isPast = new Date(`${state.scheduleDate}T${s.time}`) < now;
                return `
                <button class="session-btn ${isPast ? 'disabled' : ''}" onclick="window.location.hash='#/schedule?book=${m.movieId}&date=${state.scheduleDate}&time=${s.time}'">
                    <span class="session-time">${s.time}</span>
                    <div class="btn-bottom">
                        <span class="session-price">${s.price} ₽</span>
                        <span class="session-format ${s.isSpecial ? 'special' : ''}">${s.format}</span>
                    </div>
                </button>`;
            }).join('');

            const computedAgeClass = AppHelpers.getAgeColorClass(m.age);
            const ratingConf = AppHelpers.getRatingConfig(m.rating);

            /* БЛОКИРУЕМ КЛИК НА ТЕЛЕФОНАХ (Только если экран > 768px меняем URL) */
            moviesHtml += `
            <div class="movie-row">
                <div class="movie-primary-content" onclick="if(window.innerWidth > 768) window.location.hash='#/schedule?movie=${m.movieId}'">
                    <div class="row-poster">
                        <span class="rating-badge ${ratingConf.className}">${ratingConf.text}</span>
                        <span class="age-badge ${computedAgeClass}">${m.age}</span>
                        <img src="${m.poster || AppHelpers.getPlaceholder()}" alt="${m.title}" onerror="AppHelpers.handleImageError(this)">
                    </div>
                    <div class="row-info">
                        <h2 class="row-title">${m.title}</h2>
                        <p class="row-desc">${m.description}</p>
                        <span class="movie-action-hint">БИЛЕТЫ И ТРЕЙЛЕР →</span>
                    </div>
                </div>
                <div class="row-sessions"><div class="sessions-grid">${sessionsHtml}</div></div>
            </div>`;
        });

        if(!moviesHtml) moviesHtml = '<div class="empty-state-msg">На эту дату сеансов нет</div>';

        const promos = AppData.promotions || [];
        const promoHtml = promos.map(p => `
            <div class="promo-card">
                <div class="promo-image" style="background-image: url('${p.image}');">
                    <span class="promo-badge ${p.badge?.type || ''}">${p.badge?.text || ''}</span>
                </div>
                <div class="promo-content">
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                </div>
            </div>
        `).join('');

        return `
        <div class="schedule-header">
            <h1 class="page-title schedule-page-title"><span class="subtitle">Выберите удобное время</span>Расписание сеансов</h1>
            <div class="date-slider">${dateHtml}</div>
        </div>
        <div class="schedule-list">${moviesHtml}</div>
        
        <div class="promotions-section">
            <h2 class="page-title promo-section-title">Акции и предложения</h2>
            <div class="promo-grid">
                ${promoHtml}
            </div>
        </div>`;
    },

    mount() {
        this._onStateChange = (payload) => {
            if (AppStore.state.activeView === this && payload.scheduleDate !== undefined) {
                const scrollPos = window.scrollY;
                document.getElementById('app-main').innerHTML = this.render();
                window.scrollTo(0, scrollPos);
            }
        };
        AppStore.subscribe('UPDATE_STATE', this._onStateChange);
    },

    unmount() {
        if (this._onStateChange) {
            AppStore.unsubscribe('UPDATE_STATE', this._onStateChange);
            this._onStateChange = null;
        }
    }
};