window.AppHelpers = {
    _toastTimeout: null,

    escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag]));
    },
    
    formatDateShort(dateStr) {
        const date = new Date(dateStr);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
            weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' })
        };
    },
    
    generateScheduleDates() {
        const dates = [];
        const today = new Date();
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    },

    getAgeColorClass(ageString) {
        const num = parseInt(ageString);
        if (isNaN(num)) return 'age-green';
        if (num >= 18) return 'age-red';
        if (num >= 16) return 'age-orange';
        return 'age-green'; 
    },

    getRatingConfig(rating) {
        if (rating === null || rating === undefined || rating === '') {
            return { text: 'СКОРО', className: 'rating-upcoming' };
        }
        const num = parseFloat(rating);
        let className = 'rating-high';
        if (num < 5) className = 'rating-low';
        else if (num < 7) className = 'rating-mid';
        
        return { text: num.toFixed(1), className };
    },

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    getPlaceholder() {
        return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%23475569' font-family='sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle' font-weight='bold'%3EНЕТ ПОСТЕРА%3C/text%3E%3C/svg%3E";
    },

    handleImageError(img) {
        if (!img.dataset.fallbackApplied) {
            img.dataset.fallbackApplied = "true";
            img.src = this.getPlaceholder();
        }
    },

    showToast(message) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.className = 'custom-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        
        // Сбрасываем анимацию для повторного показа
        toast.classList.remove('show');
        void toast.offsetWidth; // trigger reflow
        toast.classList.add('show');
        
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
    }
};