window.AppData = window.AppData || {};

/* ==============================================================================
   РЕАЛИСТИЧНЫЙ ГЕНЕРАТОР РАСПИСАНИЯ (Однозальный кинотеатр)
   ==============================================================================
   - Выбирает строго 4-5 уникальных фильмов на день.
   - Делает 6-8 сеансов в день.
   - Блокирует время больше 23:59 (защита от багов с "25:30").
============================================================================== */

window.AppData.schedule = (function() {
    const generatedSchedule = [];
    const library = window.AppData.library || {};
    const movieIds = Object.keys(library);
    
    // Генерируем массив дат: от -3 до +3 дней от "сегодня"
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const formats = ["2D", "3D", "Atmos"];
    
    // Хеш-функция для генерации seed
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

    // Временное хранилище: { movieId: { date: [sessions...] } }
    const tempSchedule = {};
    movieIds.forEach(id => tempSchedule[id] = {});

    dates.forEach((date) => {
        let currentSeed = hashStr(date);
        
        // 1. Сколько всего сеансов будет сегодня (от 6 до 8)
        let sessionsPerDay = getRandomInt(currentSeed++, 6, 8);

        // 2. Сколько УНИКАЛЬНЫХ фильмов мы покажем сегодня (от 4 до 5)
        const uniqueMoviesCount = getRandomInt(currentSeed++, 4, 5);

        // 3. Выбираем уникальные фильмы из всей базы
        // Тасуем массив ID фильмов с помощью нашего seed
        const shuffledIds = [...movieIds];
        for (let i = shuffledIds.length - 1; i > 0; i--) {
            const j = getRandomInt(currentSeed++, 0, i);
            [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
        }
        // Берем первые 4-5 фильмов
        const dailyUniqueMovies = shuffledIds.slice(0, uniqueMoviesCount);

        // 4. Формируем план показов. Даем каждому выбранному фильму минимум 1 сеанс.
        const dayPlan = [...dailyUniqueMovies];
        
        // Оставшиеся сеансы (до sessionsPerDay) раскидываем случайно среди этих же 4-5 фильмов
        while (dayPlan.length < sessionsPerDay) {
            const randomMovieFromPool = dailyUniqueMovies[getRandomInt(currentSeed++, 0, dailyUniqueMovies.length - 1)];
            dayPlan.push(randomMovieFromPool);
        }

        // 5. Перемешиваем план на день, чтобы фильмы шли вразнобой, а не подряд
        for (let i = dayPlan.length - 1; i > 0; i--) {
            const j = getRandomInt(currentSeed++, 0, i);
            [dayPlan[i], dayPlan[j]] = [dayPlan[j], dayPlan[i]];
        }

        // 6. Расставляем время (кинотеатр открывается в 09:30 - 10:30)
        let startMinutes = getRandomInt(currentSeed++, 570, 630);

        for (let i = 0; i < dayPlan.length; i++) {
            const movieId = dayPlan[i];
            
            const hour = Math.floor(startMinutes / 60);
            
            // ФИКС: Если время перевалило за полночь (>= 24:00), прекращаем генерировать сеансы на сегодня
            if (hour >= 24) break;

            const minute = startMinutes % 60;
            const roundedMinute = Math.floor(minute / 5) * 5;
            const timeStr = `${hour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;

            const format = formats[getRandomInt(currentSeed++, 0, formats.length - 1)];
            const price = getRandomInt(currentSeed++, 5, 12) * 50; 
            const isSpecial = seededRandom(currentSeed++) > 0.85;

            if (!tempSchedule[movieId][date]) {
                tempSchedule[movieId][date] = [];
            }

            // Защита от одинакового времени у одного и того же фильма
            if (!tempSchedule[movieId][date].find(s => s.time === timeStr)) {
                tempSchedule[movieId][date].push({
                    time: timeStr,
                    format: format,
                    price: price,
                    isSpecial: isSpecial
                });
            }

            // Прибавляем от 2 до 2.5 часов до следующего сеанса (фильм + уборка зала)
            startMinutes += getRandomInt(currentSeed++, 120, 150);
        }
    });

    // Преобразуем во финальный вид
    movieIds.forEach(id => {
        const datesObj = tempSchedule[id];
        const scheduleBlocks = [];

        Object.keys(datesObj).forEach(date => {
            if (datesObj[date].length > 0) {
                datesObj[date].sort((a, b) => a.time.localeCompare(b.time));
                scheduleBlocks.push({ dates: [date], sessions: datesObj[date] });
            }
        });

        if (scheduleBlocks.length > 0) {
            generatedSchedule.push({
                movieId: id,
                comment: "Сгенерировано реалистично",
                schedule: scheduleBlocks
            });
        }
    });

    return generatedSchedule;
})();