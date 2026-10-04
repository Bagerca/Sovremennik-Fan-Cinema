window.AppViews = window.AppViews || {};

window.AppViews.About = {
    render() {
        const info = AppData.cinemaInfo || {};
        const statsHtml = (info.stats || []).map(s => `
            <div class="stat-box">
                <span class="stat-number">${s.number}</span>
                <span class="stat-label">${s.label}</span>
            </div>
        `).join('');

        return `
        <div class="intro-section">
            <div class="intro-badge">Главный кинотеатр города</div>
            <h1 class="intro-title">БОЛЬШОЕ КИНО<br><span class="page-title">РЯДОМ С ТОБОЙ</span></h1>
            <p class="intro-desc">Обновленный зал, 4K проекторы и атмосфера, которую нельзя скачать в интернете.</p>
            <a href="#/schedule" class="red-glow-btn">Купить билет</a>
        </div>

        <div class="about-hero-grid">
            <div class="about-left">
                <div class="year-badge">С 2005 года</div>
                <h2 class="hero-title">СОВРЕМЕННИК —<br><span style="color:var(--text-muted)">БОЛЬШЕ ЧЕМ КИНО</span></h2>
                <p class="hero-desc">
                    ${info.aboutText || ''}
                </p>

                <div class="stats-row">
                    ${statsHtml}
                </div>
            </div>

            <div class="about-right">
                <div class="map-preview">
                    <iframe src="https://yandex.ru/map-widget/v1/?ll=29.092145%2C59.891683&z=17&pt=29.092145%2C59.891683,pm2blm" width="100%" height="100%" frameborder="0" allowfullscreen="true"></iframe>
                </div>
                <div class="game-zone-card">
                    <div class="game-zone-icon">
                        <span class="game-zone-icon-wrapper">
                            ${AppIcons.get('gamepad')}
                        </span>
                    </div>
                    <div>
                        <h3 class="game-zone-title">${info.gameZone?.title || ''}</h3>
                        <p class="game-zone-desc">${info.gameZone?.description || ''}</p>
                    </div>
                </div>
            </div>
        </div>`;
    }
};
