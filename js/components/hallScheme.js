window.AppComponents = window.AppComponents || {};

window.AppComponents.HallScheme = (function() {
    const root = document.getElementById('modal-root');
    const svgCloseIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    let price = 0;

    function getPrice(movie, time) {
        if (!movie.schedule) return 300;
        for (let b of movie.schedule) {
            for (let s of b.sessions) {
                if (s.time === time) return s.price;
            }
        }
        return 300;
    }
    
    const escHandler = (e) => {
        if (e.key === 'Escape') AppComponents.Modal.close();
    };

    function render(movie, time) {
        try {
            price = getPrice(movie, time);
            
            const sessionKey = `${movie.movieId}_${AppStore.state.scheduleDate}_${time}`;
            let occupied = AppStore.state.occupiedSeats[sessionKey];
            
            if (!occupied) {
                occupied = [];
                for (let row = 2; row <= 16; row++) {
                    let seatsInRow = (row === 2) ? 22 : (row === 16 ? 29 : 24);
                    for (let s = 0; s < seatsInRow; s++) {
                        if (Math.random() < 0.15) {
                            occupied.push(`${row}_${seatsInRow - s}`);
                        }
                    }
                }
                AppStore.dispatch('SET_OCCUPIED_SEATS', { key: sessionKey, seats: occupied });
            }

            let seatsHtml = '';
            for (let row = 2; row <= 16; row++) {
                let seatsInRow = (row === 2) ? 22 : (row === 16 ? 29 : 24);
                
                let rowSeats = '';
                for (let s = 0; s < seatsInRow; s++) {
                    let seatNum = seatsInRow - s;
                    let seatId = `${row}_${seatNum}`;
                    let isOccupied = occupied.includes(seatId) ? 'occupied' : '';
                    let ariaState = isOccupied ? 'aria-disabled="true"' : 'aria-pressed="false"';
                    rowSeats += `<button class="seat ${isOccupied}" data-row="${row}" data-seat="${seatNum}" title="Ряд ${row}, Место ${seatNum}" aria-label="Ряд ${row}, Место ${seatNum}" ${ariaState}></button>`;
                }
                seatsHtml += `
                    <div class="seat-row" role="group" aria-label="Ряд ${row}">
                        <div class="row-number row-left" aria-hidden="true">${row}</div>
                        ${rowSeats}
                        <div class="row-number row-right" aria-hidden="true">${row}</div>
                    </div>`;
            }

            root.innerHTML = `
            <dialog class="modal-overlay active" id="hall-modal" aria-labelledby="hall-title">
                <div class="modal-content hall-modal-content">
                    <button class="close-btn" onclick="AppComponents.Modal.close()" aria-label="Закрыть">${svgCloseIcon}</button>
                    <h2 id="hall-title" class="hall-title">Выберите места</h2>
                    <p class="hall-subtitle">${movie.title} <span class="hall-subtitle-time">(${time})</span></p>
                    
                    <ul class="showcase" aria-hidden="true">
                        <li><div class="seat showcase-seat"></div><small>Свободно</small></li>
                        <li><div class="seat showcase-seat selected"></div><small>Выбрано</small></li>
                        <li><div class="seat showcase-seat occupied"></div><small>Занято</small></li>
                    </ul>
                    
                    <div class="hall-container">
                        <div class="hall-inner">
                            <div class="screen" aria-hidden="true">ЭКРАН</div>
                            <div class="seats-area" role="group" aria-label="План зала">${seatsHtml}</div>
                        </div>
                    </div>
                    
                    <div class="ticket-footer">
                        <div class="ticket-info" aria-live="polite">
                            <p>Билетов: <span id="t-count">0</span></p>
                            <p>Сумма: <span id="t-total">0</span> ₽</p>
                        </div>
                        <button class="buy-btn" id="confirmBuyBtn">Купить билеты</button>
                    </div>
                </div>
            </dialog>`;

            const dialog = document.getElementById('hall-modal');
            dialog.showModal();

            bindEvents(movie, time);
        } catch (e) {
            console.error('[HallScheme] Ошибка рендера:', e);
            AppComponents.Modal.close();
        }
    }

    function bindEvents(movie, time) {
        const dialog = document.getElementById('hall-modal');
        dialog.addEventListener('click', e => {
            if (e.target === dialog) AppComponents.Modal.close();
            
            // Исключаем клик по местам из легенды (.showcase-seat)
            if (e.target.classList.contains('seat') && !e.target.classList.contains('occupied') && !e.target.classList.contains('showcase-seat')) {
                e.target.classList.toggle('selected');
                const isSelected = e.target.classList.contains('selected');
                e.target.setAttribute('aria-pressed', isSelected.toString());
                updateTotals();
            }
        });

        document.addEventListener('keydown', escHandler);

        document.getElementById('confirmBuyBtn').addEventListener('click', () => {
            // Ищем места ТОЛЬКО внутри зоны зала (.seats-area)
            const selectedElements = document.querySelectorAll('.seats-area .seat.selected');
            const count = selectedElements.length;
            
            if (count > 0) {
                const newOccupiedIds = [];
                const seatsInfo = Array.from(selectedElements).map(el => {
                    const row = el.dataset.row;
                    const seat = el.dataset.seat;
                    newOccupiedIds.push(`${row}_${seat}`);
                    return `Ряд ${row}, Место ${seat}`;
                });

                // ФИКСИРУЕМ ПОКУПКУ: Записываем места в Store, чтобы они стали занятыми
                const sessionKey = `${movie.movieId}_${AppStore.state.scheduleDate}_${time}`;
                let occupied = AppStore.state.occupiedSeats[sessionKey] || [];
                occupied = [...occupied, ...newOccupiedIds];
                AppStore.dispatch('SET_OCCUPIED_SEATS', { key: sessionKey, seats: occupied });

                const total = count * price;
                showSuccessTicket(movie, time, seatsInfo, total);
            } else {
                AppHelpers.showToast('Выберите хотя бы одно место для покупки');
            }
        });
        
        const closeBtn = dialog.querySelector('.close-btn');
        if (closeBtn) closeBtn.focus();
    }

    function updateTotals() {
        // Считаем выбранные места ТОЛЬКО внутри зоны зала (.seats-area)
        const count = document.querySelectorAll('.seats-area .seat.selected').length;
        document.getElementById('t-count').innerText = count;
        document.getElementById('t-total').innerText = count * price;
    }

    function showSuccessTicket(movie, time, seats, total) {
        const modalContent = document.querySelector('.hall-modal-content');
        const dateObj = AppHelpers.formatDateShort(AppStore.state.scheduleDate);
        const dateStr = `${dateObj.day} ${dateObj.month}, ${dateObj.weekday}`;

        modalContent.innerHTML = `
            <button class="close-btn" onclick="AppComponents.Modal.close()" aria-label="Закрыть">${svgCloseIcon}</button>
            <div class="success-ticket-wrapper">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h2 class="success-title">Билеты успешно оформлены!</h2>
                
                <div class="receipt-card">
                    <div class="receipt-header">
                        <h3>${movie.title}</h3>
                        <p>${dateStr} • ${time}</p>
                    </div>
                    <div class="receipt-body">
                        <div class="receipt-seats">
                            ${seats.map(s => `<span>${s}</span>`).join('')}
                        </div>
                    </div>
                    <div class="receipt-footer">
                        <div class="receipt-total">Итого: <strong>${total} ₽</strong></div>
                        <div class="barcode"></div>
                    </div>
                </div>
                
                <button class="buy-btn" onclick="AppComponents.Modal.close()" style="margin-top: 30px; max-width: 400px;">Вернуться к расписанию</button>
            </div>
        `;
    }

    const originalClose = AppComponents.Modal.close;
    AppComponents.Modal.close = function() {
        document.removeEventListener('keydown', escHandler);
        originalClose.apply(this, arguments);
    };

    return { render };
})();