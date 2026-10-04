window.AppRouter = {
    init() {
        if (!window.location.hash || window.location.hash === '#') {
            window.history.replaceState(null, null, '#/');
        }
        
        window.addEventListener('hashchange', this.handle.bind(this));
        this.handle();
    },

    handle() {
        try {
            const hash = window.location.hash || '#/';
            let [path, qs] = hash.substring(1).split('?');
            
            if (!path) path = '/'; 
            
            const params = new URLSearchParams(qs || '');
            let viewName = 'About';
            
            if (path.startsWith('/schedule')) viewName = 'Schedule';
            
            if (path.startsWith('/library')) {
                // БЛОКИРУЕМ БИБЛИОТЕКУ НА МОБИЛЬНЫХ УСТРОЙСТВАХ
                if (window.innerWidth <= 768) {
                    AppHelpers.showToast('Раздел библиотеки недоступен на телефонах');
                    path = '/';
                    viewName = 'About';
                    window.history.replaceState(null, null, '#/');
                } else {
                    viewName = 'Library';
                }
            }

            if (path.startsWith('/rules')) viewName = 'Rules';

            if (!window.AppViews[viewName]) {
                console.warn(`[Router] Экран "${viewName}" не найден. Возврат на главную.`);
                viewName = 'About';
                path = '/';
            }

            AppStore.dispatch('ROUTE_CHANGED', { path, viewName, params });
        } catch (error) {
            console.error('[Router] Ошибка обработки роута:', error);
            window.history.replaceState(null, null, '#/');
            this.handle();
        }
    },

    navigate(path) {
        window.location.hash = path;
    },

    updateParams(newParams) {
        try {
            const hash = window.location.hash || '#/';
            const [base, qs] = hash.split('?');
            const currentParams = new URLSearchParams(qs || '');
            
            Object.keys(newParams).forEach(k => {
                if (newParams[k] === null) currentParams.delete(k);
                else currentParams.set(k, newParams[k]);
            });
            
            const str = currentParams.toString();
            window.location.hash = str ? `${base}?${str}` : base;
        } catch (error) {
            console.error('[Router] Ошибка обновления параметров:', error);
        }
    }
};