document.addEventListener('alpine:init', () => {
    Alpine.data('cinemaApp', () => ({
        // Состояние приложения
        currentView: 'home', // 'home', 'schedule', 'rules', 'about'
        loading: true,
        mobileMenuOpen: false,
        
        // Данные
        movies: [],
        schedule: [],
        scheduleActiveIndex: 0, // Какой день выбран в расписании
        
        // Инициализация (загрузка данных)
        async init() {
            try {
                // Параллельная загрузка JSON
                const [moviesRes, scheduleRes] = await Promise.all([
                    fetch('data/movies.json'),
                    fetch('data/schedule.json')
                ]);
                
                this.movies = await moviesRes.json();
                this.schedule = await scheduleRes.json();
                
                // Обработка хеша в URL (чтобы работали ссылки #schedule)
                this.handleHash();
                window.addEventListener('hashchange', () => this.handleHash());
                
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setTimeout(() => this.loading = false, 500); // Имитация плавной загрузки
            }
        },

        // Роутинг (переключение страниц)
        handleHash() {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                this.currentView = hash;
                this.mobileMenuOpen = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                this.currentView = 'home';
            }
        },

        // Хелпер: Получить данные фильма по ID
        getMovieById(id) {
            return this.movies.find(m => m.id === id) || {};
        },

        // Хелпер: Получить список новинок (для слайдера)
        get upcomingMovies() {
            return this.movies.filter(m => m.year >= 2025);
        }
    }));
});
