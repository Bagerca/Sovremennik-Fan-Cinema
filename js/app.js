document.addEventListener('DOMContentLoaded', () => {
    
    document.getElementById('current-year').textContent = new Date().getFullYear();

    document.getElementById('logo-container').innerHTML = AppIcons.get('logo');
    document.getElementById('icon-location').innerHTML = AppIcons.get('location');
    document.getElementById('icon-vk').innerHTML = AppIcons.get('vk');
    document.getElementById('icon-tg').innerHTML = AppIcons.get('tg');

    // Кнопка тем
    const themes = ['default', 'newyear', 'halloween'];
    const themeBtn = document.getElementById('theme-toggle-btn');
    
    // Централизованная подписка на смену темы
    AppStore.subscribe('SET_THEME', (theme) => {
        if(theme === 'newyear') themeBtn.innerHTML = '🎅';
        else if(theme === 'halloween') themeBtn.innerHTML = '🎃';
        else themeBtn.innerHTML = '❄️';
    });
    
    themeBtn.addEventListener('click', () => {
        const curIdx = themes.indexOf(AppStore.state.theme);
        const next = themes[(curIdx + 1) % themes.length];
        AppStore.dispatch('SET_THEME', next);
    });

    AppStore.subscribe('ROUTE_CHANGED', ({ path, viewName, params }) => {
        const view = window.AppViews[viewName];
        const main = document.getElementById('app-main');

        if (AppStore.state.currentPath !== path) {
            if (AppStore.state.activeView && typeof AppStore.state.activeView.unmount === 'function') {
                AppStore.state.activeView.unmount();
            }

            main.innerHTML = view.render();
            
            if (typeof view.mount === 'function') {
                view.mount();
            } else if (typeof view.afterRender === 'function') {
                view.afterRender();
            }
            
            AppStore.state.activeView = view;
            AppStore.state.currentPath = path;
            
            document.querySelectorAll('.nav-links a[data-route]').forEach(a => {
                a.classList.toggle('active', a.getAttribute('data-route') === path);
            });
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        AppComponents.Modal.handleParams(params);
    });

    AppComponents.ThemeEffects.init();
    AppStore.dispatch('SET_THEME', AppStore.state.theme);
    
    AppRouter.init();
});