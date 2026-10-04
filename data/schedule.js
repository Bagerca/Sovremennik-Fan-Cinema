window.AppData = window.AppData || {};

/* ==============================================================================
   ГЕНЕРАТОР ДЕТЕРМИНИРОВАННОГО РАСПИСАНИЯ
   ==============================================================================
   Привязан к movieId и диапазону дат, чтобы deep-links всегда показывали
   консистентное расписание без прыжков при перезагрузке страницы.
============================================================================== */

window.AppData.schedule = (function() {
    const generatedSchedule = [];
    const movieIds = Object.keys(window.AppData.library || {});
    
    // Генерируем массив дат: от -3 до +3 дней от "сегодня"
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const formats = ["2D", "3D", "Atmos"];
    
    // Хеш-функция для генерации seed из строки
    function hashStr(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // Детерминированный рандом
    function seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function getRandomInt(seed, min, max) {
        return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
    }

    // Проходимся по всем фильмам
    movieIds.forEach((id, arrIndex) => {
        // Базовый сид для фильма на текущую неделю
        const seedBase = hashStr(id + dates[0]);
        
        // Выбираем даты
        const movieDates = dates.filter((d, index) => {
            // Гарантируем, что первые 2 фильма из базы точно будут показаны "Сегодня" (index 3),
            // чтобы экран расписания никогда не оказался пустым.
            if (index === 3 && arrIndex < 2) return true;
            
            // Снизили плотность: фильм появляется в расписании с вероятностью ~25%
            return seededRandom(seedBase + index) > 0.75;
        });
        
        // Если для фильма не выпало ни одного дня показа — пропускаем его
        if (movieDates.length === 0) return;
        
        // Генерируем всего 1-2 сеанса в день, чтобы не было "перегруза"
        const sessionCount = getRandomInt(seedBase, 1, 2);
        const sessions = [];
        
        for (let i = 0; i < sessionCount; i++) {
            // Растянули временной диапазон сеансов
            const hour = getRandomInt(seedBase + i * 10, 11, 22);
            const minutes = ['00', '15', '30', '45'][getRandomInt(seedBase + i * 11, 0, 3)];
            const time = `${hour}:${minutes}`;
            
            // Защита от одинакового времени у двух сеансов одного фильма
            if (sessions.find(s => s.time === time)) continue;

            sessions.push({
                time: time,
                format: formats[getRandomInt(seedBase + i * 12, 0, formats.length - 1)],
                price: getRandomInt(seedBase + i * 13, 5, 15) * 50,
                isSpecial: seededRandom(seedBase + i * 14) > 0.85
            });
        }
        
        // Сортируем сеансы по времени (от утренних к вечерним)
        sessions.sort((a, b) => a.time.localeCompare(b.time));

        generatedSchedule.push({
            movieId: id,
            comment: "Детерминированное авторасписание",
            schedule: [
                {
                    dates: movieDates,
                    sessions: sessions
                }
            ]
        });
    });

    return generatedSchedule;
})();