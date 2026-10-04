window.AppStore = (function() {
    let state = {
        theme: localStorage.getItem('theme') || 'default',
        movies: [],       
        currentPath: '',
        activeView: null,
        
        scheduleDate: new Date().toISOString().split('T')[0],
        
        searchQuery: '',
        librarySortBy: 'alpha', // По умолчанию сортировка по алфавиту
        librarySortOrder: 'desc', // По умолчанию по убыванию
        
        // Хранилище сгенерированных занятых мест (id фильма _ дата _ время)
        occupiedSeats: {} 
    };

    const listeners = {};

    function mergeData() {
        try {
            const scheduleMap = {};
            if (window.AppData && window.AppData.schedule) {
                window.AppData.schedule.forEach(item => {
                    scheduleMap[item.movieId] = item.schedule;
                });
            }

            if (window.AppData && window.AppData.library) {
                state.movies = Object.keys(window.AppData.library).map(key => {
                    const info = window.AppData.library[key];
                    return {
                        movieId: key,
                        ...info,
                        schedule: scheduleMap[key] || null 
                    };
                });
            } else {
                state.movies = [];
            }
        } catch (e) {
            console.error('[Store] Ошибка при мёрже данных:', e);
            state.movies = [];
        }
    }
    
    mergeData();

    return {
        get state() { return state; },
        
        subscribe(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },
        
        unsubscribe(event, callback) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            }
        },
        
        dispatch(event, payload) {
            try {
                if (event === 'SET_THEME') {
                    state.theme = payload;
                    localStorage.setItem('theme', payload);
                    document.documentElement.setAttribute('data-theme', payload);
                }
                if (event === 'UPDATE_STATE') {
                    state = { ...state, ...payload };
                }
                if (event === 'SET_OCCUPIED_SEATS') {
                    state.occupiedSeats[payload.key] = payload.seats;
                }

                if (listeners[event]) {
                    listeners[event].forEach(cb => cb(payload, state));
                }
                if (listeners['*']) {
                    listeners['*'].forEach(cb => cb(event, payload, state));
                }
            } catch (error) {
                console.error(`[Store] Критическая ошибка при dispatch(${event}):`, error);
            }
        }
    };
})();