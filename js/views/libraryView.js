window.AppViews = window.AppViews || {};

window.AppViews.Library = {
    _onStateChange: null,

    handleInput: AppHelpers.debounce(function(val) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;
        
        if (!val.trim()) {
            AppViews.Library.hideSuggestions();
            return;
        }
        
        const query = val.toLowerCase();
        const state = AppStore.state;
        
        const matches = state.movies.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.director.toLowerCase().includes(query)
        ).slice(0, 4);
        
        if (matches.length > 0) {
            container.innerHTML = matches.map(m => `
                <div class="suggestion-item" onclick="AppViews.Library.hideSuggestions(); window.location.hash='#/library?movie=${m.movieId}'">
                    <img src="${m.poster || AppHelpers.getPlaceholder()}" alt="${m.title}" onerror="AppHelpers.handleImageError(this)">
                    <div class="suggestion-info">
                        <h4>${m.title}</h4>
                        <span>${m.year} • ${m.director}</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="suggestion-empty">Ничего не найдено</div>';
        }
        
        container.classList.add('active');
    }, 300),

    commitSearch(val) {
        this.hideSuggestions();
        AppStore.dispatch('UPDATE_STATE', { searchQuery: val });
    },

    hideSuggestions() {
        const container = document.getElementById('search-suggestions');
        if (container) {
            container.classList.remove('active');
        }
    },

    setSortBy(val) {
        AppStore.dispatch('UPDATE_STATE', { librarySortBy: val });
    },

    setSortOrder(val) {
        AppStore.dispatch('UPDATE_STATE', { librarySortOrder: val });
    },

    render() {
        const state = AppStore.state;
        const sortBy = state.librarySortBy || 'alpha';
        const sortOrder = state.librarySortOrder || 'desc';

        return `
        <div class="library-header"><h1 class="page-title">Библиотека фильмов</h1></div>
        <div class="library-toolbar">
            <div class="toolbar-top">
                <div class="search-container" id="library-search-container">
                    <button class="search-btn" title="Найти" aria-label="Поиск" onclick="AppViews.Library.commitSearch(document.getElementById('library-search-input').value)">
                        ${AppIcons.get('search')}
                    </button>
                    <input type="text" id="library-search-input" 
                           value="${AppHelpers.escapeHTML(state.searchQuery)}" 
                           placeholder="Поиск фильма, режиссера..." 
                           autocomplete="off"
                           oninput="AppViews.Library.handleInput(this.value)"
                           onkeydown="if(event.key === 'Enter') AppViews.Library.commitSearch(this.value)">
                    
                    <div class="search-suggestions" id="search-suggestions"></div>
                </div>
                
                <div class="modern-sort-container">
                    <div class="modern-sort-wrapper" id="library-sort-dropdown">
                        <button class="modern-sort-trigger" onclick="document.getElementById('library-sort-dropdown').classList.toggle('open')">
                            ${AppIcons.get('filter')}
                            <span>Сортировка</span>
                            <span class="arrow">▼</span>
                        </button>
                        
                        <div class="modern-sort-popover">
                            <div class="sort-segment-group">
                                <button class="sort-segment-btn ${sortBy === 'alpha' ? 'active' : ''}" data-sort="alpha" title="По алфавиту" onclick="AppViews.Library.setSortBy('alpha')">
                                    ${AppIcons.get('alpha')}
                                </button>
                                <button class="sort-segment-btn ${sortBy === 'date' ? 'active' : ''}" data-sort="date" title="По дате" onclick="AppViews.Library.setSortBy('date')">
                                    ${AppIcons.get('date')}
                                </button>
                                <button class="sort-segment-btn ${sortBy === 'rating' ? 'active' : ''}" data-sort="rating" title="По рейтингу" onclick="AppViews.Library.setSortBy('rating')">
                                    ${AppIcons.get('rating')}
                                </button>
                            </div>
                            
                            <div class="sort-segment-group">
                                <button class="sort-segment-btn ${sortOrder === 'desc' ? 'active' : ''}" data-order="desc" onclick="AppViews.Library.setSortOrder('desc')">
                                    ${AppIcons.get('desc')} Убывание
                                </button>
                                <button class="sort-segment-btn ${sortOrder === 'asc' ? 'active' : ''}" data-order="asc" onclick="AppViews.Library.setSortOrder('asc')">
                                    ${AppIcons.get('asc')} Возрастание
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="library-grid" id="library-grid-container">
            ${this.renderGrid()}
        </div>`;
    },

    renderGrid() {
        const state = AppStore.state;
        const sortBy = state.librarySortBy || 'alpha';
        const sortOrder = state.librarySortOrder || 'desc';
        
        let filtered = state.movies.filter(m => 
            m.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
            m.director.toLowerCase().includes(state.searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            let valA, valB;
            
            if (sortBy === 'date') {
                valA = parseInt(a.year) || 0;
                valB = parseInt(b.year) || 0;
            } else if (sortBy === 'rating') {
                valA = parseFloat(a.rating) || -1;
                valB = parseFloat(b.rating) || -1;
            } else if (sortBy === 'alpha') {
                valA = a.title.toLowerCase();
                valB = b.title.toLowerCase();
            }

            if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
            if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
            return 0;
        });

        const grouped = [];
        const seenFranchises = new Set();

        filtered.forEach(m => {
            if (m.franchise) {
                if (!seenFranchises.has(m.franchise)) {
                    seenFranchises.add(m.franchise);
                    const franchiseParts = state.movies
                        .filter(f => f.franchise === m.franchise)
                        .sort((a, b) => a.part - b.part); 
                    
                    const otherPosters = franchiseParts
                        .filter(f => f.movieId !== m.movieId)
                        .map(p => p.poster || AppHelpers.getPlaceholder());
                    
                    const bgPosters = otherPosters.slice(0, 2);
                    
                    grouped.push({ 
                        ...m, 
                        _isStacked: franchiseParts.length > 1, 
                        _stackCount: franchiseParts.length,
                        _bgPosters: bgPosters
                    });
                }
            } else {
                grouped.push({ ...m, _isStacked: false });
            }
        });

        if (grouped.length === 0) {
            return '<div class="empty-state-msg">Фильмы не найдены</div>';
        }

        return grouped.map(m => {
            const computedAgeClass = AppHelpers.getAgeColorClass(m.age);
            const ratingConf = AppHelpers.getRatingConfig(m.rating);
            const stackCount = m._isStacked ? Math.min(m._bgPosters.length + 1, 3) : 1;

            let bgLayersHtml = '';
            if (stackCount === 2) {
                bgLayersHtml = `<div class="lib-card-layer layer-back" style="background-image: url('${m._bgPosters[0]}')"></div>`;
            } else if (stackCount === 3) {
                bgLayersHtml = `
                    <div class="lib-card-layer layer-back-deep" style="background-image: url('${m._bgPosters[1] || m._bgPosters[0]}')"></div>
                    <div class="lib-card-layer layer-back" style="background-image: url('${m._bgPosters[0]}')"></div>
                `;
            }

            const stackBadge = m._isStacked ? `
                <div class="stack-count-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                    ${m._stackCount} ЧАСТИ
                </div>` : '';

            return `
            <div class="lib-card-wrapper stack-${stackCount}" onclick="window.location.hash='#/library?movie=${m.movieId}'">
                ${bgLayersHtml}
                <div class="lib-card-layer layer-front">
                    <div class="lib-poster-wrapper">
                        <span class="rating-badge ${ratingConf.className}">${ratingConf.text}</span>
                        <span class="age-badge ${computedAgeClass}">${m.age}</span>
                        <img src="${m.poster || AppHelpers.getPlaceholder()}" alt="${m.title}" class="lib-poster" onerror="AppHelpers.handleImageError(this)">
                        ${stackBadge}
                    </div>
                    <div class="lib-info">
                        <h3 class="lib-title">${m.title}</h3>
                        <div class="lib-meta">${m._isStacked ? 'ФРАНШИЗА' : m.year} • ${m.country}</div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    closeDropdowns(e) {
        const sortDropdown = document.getElementById('library-sort-dropdown');
        if (sortDropdown && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove('open');
        }
        
        const searchContainer = document.getElementById('library-search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            AppViews.Library.hideSuggestions();
        }
    },

    mount() {
        this.closeDropdowns = this.closeDropdowns.bind(this);
        window.addEventListener('click', this.closeDropdowns);

        this._onStateChange = (payload) => {
            if (payload.searchQuery !== undefined || payload.librarySortBy !== undefined || payload.librarySortOrder !== undefined) {
                const grid = document.getElementById('library-grid-container');
                if (grid) grid.innerHTML = this.renderGrid();
            }
            
            if (payload.librarySortBy !== undefined || payload.librarySortOrder !== undefined) {
                const sortBy = AppStore.state.librarySortBy || 'alpha';
                const sortOrder = AppStore.state.librarySortOrder || 'desc';
                
                document.querySelectorAll('#library-sort-dropdown .sort-segment-group:first-child .sort-segment-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.sort === sortBy);
                });
                document.querySelectorAll('#library-sort-dropdown .sort-segment-group:last-child .sort-segment-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.order === sortOrder);
                });
            }
        };
        
        AppStore.subscribe('UPDATE_STATE', this._onStateChange);
    },

    unmount() {
        window.removeEventListener('click', this.closeDropdowns);
        if (this._onStateChange) {
            AppStore.unsubscribe('UPDATE_STATE', this._onStateChange);
            this._onStateChange = null;
        }
    }
};