/**
 * UNITIX 7.0 - POWER EDITION ENGINE
 * Optimisé pour PC + Mode Éco + Nouveaux Outils
 */

// ==========================================
// CLASSE UTILITAIRES
// ==========================================
class UnitixUtils {
    static showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    static hapticFeedback(element) {
        if (localStorage.getItem('unitix_haptic_enabled') !== 'false') {
            element?.classList.add('haptic-feedback');
            setTimeout(() => element?.classList.remove('haptic-feedback'), 150);
            
            // Vibration si supportée et mode éco désactivé
            if (navigator.vibrate && !EcoModeManager.isEnabled()) {
                navigator.vibrate(10);
            }
        }
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => this.showToast('✓ Copié dans le presse-papier'))
                .catch(() => this.fallbackCopy(text));
        } else {
            this.fallbackCopy(text);
        }
    }

    static fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('✓ Copié dans le presse-papier');
        } catch (err) {
            this.showToast('✗ Erreur de copie', 2000);
        }
        
        document.body.removeChild(textArea);
    }

    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
}

// ==========================================
// CLASSE MODE ÉCO (NOUVEAU)
// ==========================================
class EcoModeManager {
    static isEnabled() {
        return document.body.getAttribute('data-eco-mode') === 'true';
    }

    static enable() {
        document.body.setAttribute('data-eco-mode', 'true');
        localStorage.setItem('unitix_eco_mode', 'true');
        UnitixUtils.showToast('⚡ Mode Éco activé');
        
        // Désactiver les animations CSS complexes
        document.documentElement.style.setProperty('--animation-speed', '0s');
        document.documentElement.style.setProperty('--blur-amount', '0px');
    }

    static disable() {
        document.body.setAttribute('data-eco-mode', 'false');
        localStorage.setItem('unitix_eco_mode', 'false');
        UnitixUtils.showToast('✨ Mode Éco désactivé');
        
        // Réactiver les animations
        document.documentElement.style.setProperty('--animation-speed', '0.3s');
        document.documentElement.style.setProperty('--blur-amount', '30px');
    }

    static init() {
        const toggle = document.getElementById('toggle-eco-mode');
        const saved = localStorage.getItem('unitix_eco_mode') === 'true';
        
        if (saved) {
            toggle.checked = true;
            this.enable();
        }
        
        toggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enable();
            } else {
                this.disable();
            }
        });
    }
}

// ==========================================
// CLASSE HISTORIQUE
// ==========================================
class HistoryManager {
    constructor(storageKey = 'unitix_history') {
        this.storageKey = storageKey;
        this.maxItems = 10;
    }

    add(entry) {
        const history = this.getAll();
        history.unshift({
            ...entry,
            timestamp: Date.now()
        });
        
        if (history.length > this.maxItems) {
            history.pop();
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }

    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }

    renderToModal(modalBodyId) {
        const history = this.getAll();
        const modalBody = document.getElementById(modalBodyId);
        
        if (history.length === 0) {
            modalBody.innerHTML = '<p class="empty-state">Aucun historique pour le moment</p>';
            return;
        }
        
        modalBody.innerHTML = history.map((entry, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-label">${new Date(entry.timestamp).toLocaleString('fr-FR')}</div>
                <div class="history-item-value">${entry.display}</div>
            </div>
        `).join('');
        
        modalBody.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const entry = history[index];
                if (entry.callback) {
                    entry.callback();
                }
                document.getElementById('history-modal').classList.remove('active');
            });
        });
    }

    // NOUVEAU : Render pour sidebar calculatrice
    renderToSidebar(sidebarId) {
        const history = this.getAll();
        const sidebar = document.getElementById(sidebarId);
        
        if (!sidebar) return;
        
        if (history.length === 0) {
            sidebar.innerHTML = '<p class="empty-state-small">Aucun calcul</p>';
            return;
        }
        
        sidebar.innerHTML = history.map((entry) => `
            <div class="calc-history-item">${entry.display}</div>
        `).join('');
    }
}

// ==========================================
// CLASSE FAVORIS
// ==========================================
class FavoritesManager {
    constructor(storageKey = 'unitix_favorites') {
        this.storageKey = storageKey;
    }

    toggle(key) {
        const favorites = this.getAll();
        const index = favorites.indexOf(key);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(key);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        return index === -1;
    }

    has(key) {
        return this.getAll().includes(key);
    }

    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    sortOptions(selectElement, category) {
        const favorites = this.getAll();
        const options = Array.from(selectElement.options);
        
        const categoryFavorites = favorites.filter(fav => fav.startsWith(category + ':'));
        
        options.sort((a, b) => {
            const aKey = `${category}:${a.value}`;
            const bKey = `${category}:${b.value}`;
            const aIsFav = categoryFavorites.includes(aKey);
            const bIsFav = categoryFavorites.includes(bKey);
            
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            return a.text.localeCompare(b.text);
        });
        
        selectElement.innerHTML = '';
        options.forEach(option => selectElement.appendChild(option));
    }
}

// ==========================================
// NAVIGATION SYSTÈME
// ==========================================
class NavigationSystem {
    constructor() {
        this.currentPanel = 'panel-convert';
        this.initNavigation();
        this.initKeyboardShortcuts();
    }

    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                this.switchToPanel(target);
                UnitixUtils.hapticFeedback(btn);
            });
        });
    }

    switchToPanel(panelId) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            this.currentPanel = panelId;
        }
        
        document.querySelectorAll(`[data-target="${panelId}"]`)
            .forEach(btn => btn.classList.add('active'));
        
        this.autoFocus(panelId);
        
        // Cleanup pour éviter fuites mémoire
        this.cleanupPanel();
    }

    autoFocus(panelId) {
        setTimeout(() => {
            const panel = document.getElementById(panelId);
            const firstInput = panel?.querySelector('input[type="number"], input[type="text"], input[type="date"]');
            if (firstInput && !firstInput.readOnly) {
                firstInput.focus();
            }
        }, 100);
    }

    cleanupPanel() {
        // Nettoyage des écouteurs d'événements non utilisés
        // (implémentation basique pour éviter fuites mémoire)
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Raccourcis numériques (1-8)
            if (e.key >= '1' && e.key <= '8' && !e.target.matches('input, textarea')) {
                const shortcuts = {
                    '1': 'panel-convert',
                    '2': 'panel-currency',
                    '3': 'panel-date',
                    '4': 'panel-calc',
                    '5': 'panel-tools',
                    '6': 'panel-level',
                    '7': 'panel-notes',
                    '8': 'panel-settings'
                };
                
                const targetPanel = shortcuts[e.key];
                if (targetPanel) {
                    const panelElement = document.getElementById(targetPanel);
                    if (panelElement && !panelElement.classList.contains('hidden')) {
                        this.switchToPanel(targetPanel);
                        e.preventDefault();
                    }
                }
            }

            // NOUVEAU : Ctrl + flèches pour navigation
            if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                e.preventDefault();
                const panels = ['panel-convert', 'panel-currency', 'panel-date', 'panel-calc', 'panel-tools', 'panel-level', 'panel-settings'];
                const currentIndex = panels.indexOf(this.currentPanel);
                
                if (e.key === 'ArrowRight' && currentIndex < panels.length - 1) {
                    this.switchToPanel(panels[currentIndex + 1]);
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    this.switchToPanel(panels[currentIndex - 1]);
                }
            }
        });
    }
}

// ==========================================
// SYSTÈME DE CONVERSION D'UNITÉS
// ==========================================
class UnitConverter {
    constructor() {
        this.units = {
            length: {
                "Kilomètre (km)": 1000, "Hectomètre (hm)": 100, "Décamètre (dam)": 10, "Mètre (m)": 1,
                "Décimètre (dm)": 0.1, "Centimètre (cm)": 0.01, "Millimètre (mm)": 0.001,
                "Mile (mi)": 1609.34, "Yard (yd)": 0.9144, "Pied (ft)": 0.3048, "Pouce (in)": 0.0254
            },
            mass: {
                "Tonne (t)": 1000000, "Quintal (q)": 100000, "Kilogramme (kg)": 1000,
                "Hectogramme (hg)": 100, "Décagramme (dag)": 10, "Gramme (g)": 1,
                "Décigramme (dg)": 0.1, "Centigramme (cg)": 0.01, "Milligramme (mg)": 0.001,
                "Livre (lb)": 453.59, "Once (oz)": 28.35
            },
            volume: {
                "Mètre cube (m³)": 1000, "Hectolitre (hl)": 100, "Décalitre (dal)": 10, "Litre (l)": 1,
                "Décilitre (dl)": 0.1, "Centilitre (cl)": 0.01, "Millilitre (ml)": 0.001,
                "Pied cube (ft³)": 28.31, "Gallon (gal)": 3.785, "Pinte (pt)": 0.473
            },
            speed: {
                "Kilomètre par heure (km/h)": 1, "Mètre par seconde (m/s)": 3.6,
                "Mille par heure (mph)": 1.609, "Nœud (kn)": 1.852, "Mach": 1225.04
            },
            data: {
                "Octet (o)": 1, "Kilooctet (Ko)": 1024, "Mégaoctet (Mo)": 1048576,
                "Gigaoctet (Go)": 1073741824, "Téraoctet (To)": 1099511627776
            },
            // NOUVEAU : Débit Internet
            bandwidth: {
                "Bit par seconde (bps)": 1, "Kilobit par seconde (Kbps)": 1000,
                "Mégabit par seconde (Mbps)": 1000000, "Gigabit par seconde (Gbps)": 1000000000,
                "Octet par seconde (o/s)": 8, "Kilooctet par seconde (Ko/s)": 8000,
                "Mégaoctet par seconde (Mo/s)": 8000000
            },
            temp: {
                "Celsius (°C)": "CELSIUS", "Fahrenheit (°F)": "FAHRENHEIT", "Kelvin (K)": "KELVIN"
            }
        };

        this.currentCategory = 'length';
        this.history = new HistoryManager('unitix_convert_history');
        this.favorites = new FavoritesManager('unitix_convert_favorites');
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.initTabs();
        this.initInputs();
        this.initButtons();
        this.initSearch();
        this.populateSelects();
    }

    cacheElements() {
        this.inputValue = document.getElementById('input-value');
        this.outputValue = document.getElementById('output-value');
        this.selectFrom = document.getElementById('select-from');
        this.selectTo = document.getElementById('select-to');
        this.tabs = document.querySelectorAll('.tab-btn');
        this.swapBtn = document.getElementById('btn-swap-unit');
        this.copyBtn = document.getElementById('btn-copy-result');
    }

    initTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.cat;
                this.populateSelects();
                UnitixUtils.hapticFeedback(tab);
            });
        });
    }

    initInputs() {
        this.inputValue.addEventListener('input', () => this.convert());
        this.selectFrom.addEventListener('change', () => {
            this.convert();
            this.updateFavoriteStars();
        });
        this.selectTo.addEventListener('change', () => {
            this.convert();
            this.updateFavoriteStars();
        });
    }

    initButtons() {
        this.swapBtn.addEventListener('click', () => {
            [this.selectFrom.value, this.selectTo.value] = 
            [this.selectTo.value, this.selectFrom.value];
            this.convert();
            UnitixUtils.hapticFeedback(this.swapBtn);
        });

        this.copyBtn.addEventListener('click', () => {
            const value = this.outputValue.value;
            if (value) {
                UnitixUtils.copyToClipboard(value);
                this.copyBtn.classList.add('success');
                setTimeout(() => this.copyBtn.classList.remove('success'), 1000);
                UnitixUtils.hapticFeedback(this.copyBtn);
            }
        });

        document.querySelectorAll('.favorite-star').forEach(star => {
            star.addEventListener('click', () => {
                const target = star.dataset.target;
                const select = target === 'from' ? this.selectFrom : this.selectTo;
                const key = `${this.currentCategory}:${select.value}`;
                
                const isAdded = this.favorites.toggle(key);
                star.classList.toggle('active', isAdded);
                
                UnitixUtils.showToast(isAdded ? '★ Ajouté aux favoris' : '☆ Retiré des favoris');
                UnitixUtils.hapticFeedback(star);
                
                this.favorites.sortOptions(this.selectFrom, this.currentCategory);
                this.favorites.sortOptions(this.selectTo, this.currentCategory);
            });
        });

        document.getElementById('btn-history-convert')?.addEventListener('click', () => {
            this.showHistory();
        });
    }

    initSearch() {
        const searchInputs = [
            { input: document.getElementById('search-from'), select: this.selectFrom },
            { input: document.getElementById('search-to'), select: this.selectTo }
        ];

        searchInputs.forEach(({ input, select }) => {
            if (!input) return;

            select.addEventListener('focus', () => {
                input.classList.add('active');
                input.focus();
            });

            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                Array.from(select.options).forEach(option => {
                    const text = option.text.toLowerCase();
                    option.style.display = text.includes(query) ? '' : 'none';
                });
            });

            input.addEventListener('blur', () => {
                setTimeout(() => {
                    input.classList.remove('active');
                    input.value = '';
                    Array.from(select.options).forEach(opt => opt.style.display = '');
                }, 200);
            });
        });
    }

    populateSelects() {
        const unitNames = Object.keys(this.units[this.currentCategory]);
        const optionsHTML = unitNames.map(name => 
            `<option value="${name}">${name}</option>`
        ).join('');
        
        this.selectFrom.innerHTML = optionsHTML;
        this.selectTo.innerHTML = optionsHTML;
        
        if (unitNames.length > 1) {
            this.selectTo.selectedIndex = 1;
        }
        
        this.favorites.sortOptions(this.selectFrom, this.currentCategory);
        this.favorites.sortOptions(this.selectTo, this.currentCategory);
        
        this.updateFavoriteStars();
        this.convert();
    }

    updateFavoriteStars() {
        const fromKey = `${this.currentCategory}:${this.selectFrom.value}`;
        const toKey = `${this.currentCategory}:${this.selectTo.value}`;
        
        document.querySelector('.favorite-star[data-target="from"]')
            ?.classList.toggle('active', this.favorites.has(fromKey));
        document.querySelector('.favorite-star[data-target="to"]')
            ?.classList.toggle('active', this.favorites.has(toKey));
    }

    convert() {
        const value = parseFloat(this.inputValue.value);
        if (isNaN(value)) {
            this.outputValue.value = '';
            return;
        }

        const fromUnit = this.selectFrom.value;
        const toUnit = this.selectTo.value;
        let result;

        if (this.currentCategory === 'temp') {
            result = this.convertTemperature(value, fromUnit, toUnit);
        } else {
            const baseValue = value * this.units[this.currentCategory][fromUnit];
            result = baseValue / this.units[this.currentCategory][toUnit];
        }

        this.outputValue.value = parseFloat(result.toFixed(6));
        
        this.history.add({
            type: 'conversion',
            display: `${value} ${fromUnit} → ${result.toFixed(2)} ${toUnit}`,
            callback: () => {
                this.inputValue.value = value;
                this.selectFrom.value = fromUnit;
                this.selectTo.value = toUnit;
                this.convert();
            }
        });
    }

    convertTemperature(value, from, to) {
        let celsius = value;
        if (from === "Fahrenheit (°F)") {
            celsius = (value - 32) * 5 / 9;
        } else if (from === "Kelvin (K)") {
            celsius = value - 273.15;
        }

        if (to === "Fahrenheit (°F)") {
            return (celsius * 9 / 5) + 32;
        } else if (to === "Kelvin (K)") {
            return celsius + 273.15;
        }
        return celsius;
    }

    showHistory() {
        const modal = document.getElementById('history-modal');
        this.history.renderToModal('history-list');
        modal.classList.add('active');
    }
}

// ==========================================
// SYSTÈME DE DEVISES
// ==========================================
class CurrencyConverter {
    constructor() {
        this.rates = null;
        this.lastUpdate = null;
        this.apiUrl = 'https://open.er-api.com/v6/latest/EUR';
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.initInputs();
        this.initButtons();
        this.initSearch();
        this.loadRates();
    }

    cacheElements() {
        this.inputCurr = document.getElementById('curr-input');
        this.outputCurr = document.getElementById('curr-output');
        this.selectFrom = document.getElementById('curr-from');
        this.selectTo = document.getElementById('curr-to');
        this.statusBadge = document.getElementById('api-status');
        this.lastUpdateText = document.getElementById('last-update');
        this.swapBtn = document.getElementById('btn-swap-curr');
        this.copyBtn = document.getElementById('btn-copy-curr');
        this.refreshBtn = document.getElementById('btn-refresh-rates');
    }

    initInputs() {
        this.inputCurr.addEventListener('input', () => this.convert());
        this.selectFrom.addEventListener('change', () => this.convert());
        this.selectTo.addEventListener('change', () => this.convert());
    }

    initButtons() {
        this.swapBtn?.addEventListener('click', () => {
            [this.selectFrom.value, this.selectTo.value] = 
            [this.selectTo.value, this.selectFrom.value];
            this.convert();
            UnitixUtils.hapticFeedback(this.swapBtn);
        });

        this.copyBtn?.addEventListener('click', () => {
            const value = this.outputCurr.value;
            if (value) {
                UnitixUtils.copyToClipboard(value);
                this.copyBtn.classList.add('success');
                setTimeout(() => this.copyBtn.classList.remove('success'), 1000);
                UnitixUtils.hapticFeedback(this.copyBtn);
            }
        });

        this.refreshBtn?.addEventListener('click', () => {
            this.loadRates(true);
            UnitixUtils.hapticFeedback(this.refreshBtn);
        });
    }

    initSearch() {
        const searchInputs = [
            { input: document.getElementById('search-curr-from'), select: this.selectFrom },
            { input: document.getElementById('search-curr-to'), select: this.selectTo }
        ];

        searchInputs.forEach(({ input, select }) => {
            if (!input) return;

            select.addEventListener('focus', () => {
                input.classList.add('active');
                input.focus();
            });

            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                Array.from(select.options).forEach(option => {
                    const text = option.text.toLowerCase();
                    option.style.display = text.includes(query) ? '' : 'none';
                });
            });

            input.addEventListener('blur', () => {
                setTimeout(() => {
                    input.classList.remove('active');
                    input.value = '';
                    Array.from(select.options).forEach(opt => opt.style.display = '');
                }, 200);
            });
        });
    }

    async loadRates(forceRefresh = false) {
        try {
            const cached = localStorage.getItem('unitix_currency_cache');
            const cacheTime = localStorage.getItem('unitix_currency_cache_time');
            const now = Date.now();
            
            // NOUVEAU : Adaptation fréquence selon mode éco
            const cacheValidityHours = EcoModeManager.isEnabled() ? 48 : 24;
            const isValid = cached && cacheTime && (now - parseInt(cacheTime)) < cacheValidityHours * 3600000;

            if (!forceRefresh && isValid) {
                this.rates = JSON.parse(cached);
                this.lastUpdate = new Date(parseInt(cacheTime));
                this.populateSelects();
                this.updateStatus(true, false);
                return;
            }

            this.updateStatus(false, false);
            
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Erreur API');
            
            const data = await response.json();
            this.rates = data.rates;
            this.lastUpdate = new Date();
            
            localStorage.setItem('unitix_currency_cache', JSON.stringify(this.rates));
            localStorage.setItem('unitix_currency_cache_time', now.toString());
            
            this.populateSelects();
            this.updateStatus(true, true);
            
        } catch (error) {
            console.error('Erreur chargement devises:', error);
            
            const cached = localStorage.getItem('unitix_currency_cache');
            if (cached) {
                this.rates = JSON.parse(cached);
                this.populateSelects();
                this.updateStatus(false, true);
                UnitixUtils.showToast('⚠ Utilisation des taux en cache');
            } else {
                UnitixUtils.showToast('✗ Impossible de charger les taux');
                this.statusBadge.textContent = 'Erreur';
                this.statusBadge.className = 'status-badge offline';
            }
        }
    }

    updateStatus(online, fresh) {
        if (online) {
            this.statusBadge.textContent = 'En ligne';
            this.statusBadge.className = 'status-badge online';
        } else {
            this.statusBadge.textContent = 'Hors ligne';
            this.statusBadge.className = 'status-badge offline';
        }
        
        if (this.lastUpdate) {
            const timeStr = this.lastUpdate.toLocaleString('fr-FR');
            this.lastUpdateText.textContent = `Dernière mise à jour : ${timeStr}${fresh ? ' (actualisé)' : ' (cache)'}`;
        }
    }

    populateSelects() {
        if (!this.rates) return;

        const currencies = Object.keys(this.rates).sort();
        const optionsHTML = currencies.map(code => 
            `<option value="${code}">${code}</option>`
        ).join('');
        
        this.selectFrom.innerHTML = optionsHTML;
        this.selectTo.innerHTML = optionsHTML;
        
        this.selectFrom.value = 'EUR';
        this.selectTo.value = 'USD';
        
        this.convert();
    }

    convert() {
        if (!this.rates) return;

        const value = parseFloat(this.inputCurr.value);
        if (isNaN(value)) {
            this.outputCurr.value = '';
            return;
        }

        const from = this.selectFrom.value;
        const to = this.selectTo.value;
        
        const rate = this.rates[to] / this.rates[from];
        const result = value * rate;
        
        this.outputCurr.value = result.toFixed(2);
    }
}

// ==========================================
// CALCULATEUR DE DATES
// ==========================================
class DateCalculator {
    constructor() {
        this.init();
    }

    init() {
        const startInput = document.getElementById('date-start');
        const endInput = document.getElementById('date-end');
        const output = document.getElementById('date-diff-output');

        if (!startInput || !endInput || !output) return;

        const calculate = () => {
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);

            if (!startInput.value || !endInput.value) {
                output.textContent = 'Veuillez choisir deux dates pour calculer l\'écart.';
                return;
            }

            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);

            let result = `<strong>${diffDays} jours</strong>`;
            if (diffWeeks > 0) result += ` (${diffWeeks} semaines)`;
            if (diffMonths > 0) result += ` ou ${diffMonths} mois`;
            if (diffYears > 0) result += ` ou ${diffYears} an${diffYears > 1 ? 's' : ''}`;

            output.innerHTML = result;
        };

        startInput.addEventListener('change', calculate);
        endInput.addEventListener('change', calculate);
    }
}

// ==========================================
// CALCULATRICE - OPTIMISÉE PC
// ==========================================
class Calculator {
    constructor() {
        this.current = '0';
        this.previous = '';
        this.operation = null;
        this.scientific = false;
        this.history = new HistoryManager('unitix_calc_history');
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.initButtons();
        this.renderButtons();
        this.initKeyboardSupport();
        this.renderHistory();
    }

    cacheElements() {
        this.display = document.getElementById('calc-main');
        this.historyDisplay = document.getElementById('calc-history-display');
        this.grid = document.getElementById('calc-grid');
        this.modeBtn = document.getElementById('calc-mode-btn');
    }

    initButtons() {
        this.modeBtn?.addEventListener('click', () => {
            this.scientific = !this.scientific;
            this.modeBtn.textContent = this.scientific ? 'Mode Standard' : 'Mode Scientifique';
            this.renderButtons();
            UnitixUtils.hapticFeedback(this.modeBtn);
        });

        // NOUVEAU : Bouton clear history
        document.getElementById('clear-calc-history')?.addEventListener('click', () => {
            this.history.clear();
            this.renderHistory();
            UnitixUtils.showToast('✓ Historique effacé');
        });
    }

    // NOUVEAU : Support complet clavier
    initKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            // Only when calc panel is active
            if (!document.getElementById('panel-calc').classList.contains('active')) return;

            const key = e.key;
            
            // Chiffres
            if (/[0-9]/.test(key)) {
                this.inputNumber(key);
                e.preventDefault();
            }
            // Opérateurs
            else if (key === '+') {
                this.setOperation('+');
                e.preventDefault();
            }
            else if (key === '-') {
                this.setOperation('-');
                e.preventDefault();
            }
            else if (key === '*') {
                this.setOperation('×');
                e.preventDefault();
            }
            else if (key === '/') {
                this.setOperation('÷');
                e.preventDefault();
            }
            // Décimale
            else if (key === '.' || key === ',') {
                this.inputDecimal();
                e.preventDefault();
            }
            // Égal
            else if (key === 'Enter' || key === '=') {
                this.calculate();
                e.preventDefault();
            }
            // Effacer
            else if (key === 'Backspace') {
                this.backspace();
                e.preventDefault();
            }
            // Clear
            else if (key === 'Escape') {
                this.clear();
                e.preventDefault();
            }
        });
    }

    renderButtons() {
        const standard = [
            { label: 'C', action: 'clear', class: 'clear' },
            { label: '±', action: 'negate', class: 'function' },
            { label: '%', action: 'percent', class: 'function' },
            { label: '÷', action: 'divide', class: 'operator' },
            
            { label: '7', action: '7', class: '' },
            { label: '8', action: '8', class: '' },
            { label: '9', action: '9', class: '' },
            { label: '×', action: 'multiply', class: 'operator' },
            
            { label: '4', action: '4', class: '' },
            { label: '5', action: '5', class: '' },
            { label: '6', action: '6', class: '' },
            { label: '-', action: 'subtract', class: 'operator' },
            
            { label: '1', action: '1', class: '' },
            { label: '2', action: '2', class: '' },
            { label: '3', action: '3', class: '' },
            { label: '+', action: 'add', class: 'operator' },
            
            { label: '0', action: '0', class: '' },
            { label: '.', action: 'decimal', class: '' },
            { label: '⌫', action: 'backspace', class: 'function' },
            { label: '=', action: 'equals', class: 'operator' }
        ];

        const scientific = [
            ...standard.slice(0, 4),
            { label: 'sin', action: 'sin', class: 'function' },
            { label: 'cos', action: 'cos', class: 'function' },
            { label: 'tan', action: 'tan', class: 'function' },
            ...standard.slice(4)
        ];

        const buttons = this.scientific ? scientific : standard;
        
        this.grid.innerHTML = buttons.map(btn => `
            <button class="calc-btn ${btn.class}" data-action="${btn.action}" aria-label="${btn.label}">
                ${btn.label}
            </button>
        `).join('');

        this.grid.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleButton(btn.dataset.action);
                UnitixUtils.hapticFeedback(btn);
            });
        });
    }

    handleButton(action) {
        if (/[0-9]/.test(action)) {
            this.inputNumber(action);
        } else {
            switch (action) {
                case 'clear': this.clear(); break;
                case 'negate': this.negate(); break;
                case 'percent': this.percent(); break;
                case 'decimal': this.inputDecimal(); break;
                case 'backspace': this.backspace(); break;
                case 'add': this.setOperation('+'); break;
                case 'subtract': this.setOperation('-'); break;
                case 'multiply': this.setOperation('×'); break;
                case 'divide': this.setOperation('÷'); break;
                case 'equals': this.calculate(); break;
                case 'sin': this.scientificOp('sin'); break;
                case 'cos': this.scientificOp('cos'); break;
                case 'tan': this.scientificOp('tan'); break;
            }
        }
    }

    inputNumber(num) {
        if (this.current === '0') {
            this.current = num;
        } else {
            this.current += num;
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (!this.current.includes('.')) {
            this.current += '.';
            this.updateDisplay();
        }
    }

    backspace() {
        if (this.current.length > 1) {
            this.current = this.current.slice(0, -1);
        } else {
            this.current = '0';
        }
        this.updateDisplay();
    }

    clear() {
        this.current = '0';
        this.previous = '';
        this.operation = null;
        this.updateDisplay();
    }

    negate() {
        this.current = (parseFloat(this.current) * -1).toString();
        this.updateDisplay();
    }

    percent() {
        this.current = (parseFloat(this.current) / 100).toString();
        this.updateDisplay();
    }

    setOperation(op) {
        if (this.operation && this.previous) {
            this.calculate();
        }
        this.operation = op;
        this.previous = this.current;
        this.current = '0';
        this.historyDisplay.textContent = `${this.previous} ${op}`;
    }

    calculate() {
        if (!this.operation || !this.previous) return;

        const prev = parseFloat(this.previous);
        const curr = parseFloat(this.current);
        let result;

        switch (this.operation) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '×': result = prev * curr; break;
            case '÷': result = prev / curr; break;
            default: return;
        }

        const expression = `${this.previous} ${this.operation} ${this.current} = ${result}`;
        
        // Ajouter à l'historique
        this.history.add({
            type: 'calculation',
            display: expression,
            callback: () => {
                this.current = result.toString();
                this.updateDisplay();
            }
        });

        this.current = result.toString();
        this.previous = '';
        this.operation = null;
        this.historyDisplay.textContent = '';
        this.updateDisplay();
        
        // Mettre à jour l'historique sidebar
        this.renderHistory();
    }

    scientificOp(func) {
        const value = parseFloat(this.current);
        const radians = value * (Math.PI / 180);
        let result;

        switch (func) {
            case 'sin': result = Math.sin(radians); break;
            case 'cos': result = Math.cos(radians); break;
            case 'tan': result = Math.tan(radians); break;
        }

        this.current = result.toString();
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.current;
    }

    // NOUVEAU : Render history to sidebar
    renderHistory() {
        this.history.renderToSidebar('calc-history-list');
    }
}

// ==========================================
// OUTILS RAPIDES (NOUVEAU)
// ==========================================
class QuickTools {
    constructor() {
        this.init();
    }

    init() {
        this.initIMC();
        this.initPasswordGenerator();
        this.initDownloadCalculator();
        this.initQuickConversions();
    }

    // Calculateur IMC
    initIMC() {
        const calcBtn = document.getElementById('calc-imc');
        const weightInput = document.getElementById('imc-weight');
        const heightInput = document.getElementById('imc-height');
        const resultDiv = document.getElementById('imc-result');

        calcBtn?.addEventListener('click', () => {
            const weight = parseFloat(weightInput.value);
            const height = parseFloat(heightInput.value) / 100; // cm to m

            if (isNaN(weight) || isNaN(height) || height <= 0) {
                resultDiv.innerHTML = '<span style="color: var(--text-sec)">Veuillez entrer des valeurs valides</span>';
                return;
            }

            const imc = weight / (height * height);
            let category, color;

            if (imc < 18.5) {
                category = 'Insuffisance pondérale';
                color = '#FF9500';
            } else if (imc < 25) {
                category = 'Poids normal';
                color = '#34C759';
            } else if (imc < 30) {
                category = 'Surpoids';
                color = '#FF9500';
            } else {
                category = 'Obésité';
                color = '#FF3B30';
            }

            resultDiv.innerHTML = `
                <div style="font-size: 24px; font-weight: 800; color: ${color};">
                    IMC: ${imc.toFixed(1)}
                </div>
                <div style="font-size: 14px; color: var(--text-sec); margin-top: 8px;">
                    ${category}
                </div>
            `;

            UnitixUtils.hapticFeedback(calcBtn);
        });
    }

    // Générateur de mots de passe
    initPasswordGenerator() {
        const generateBtn = document.getElementById('generate-pwd');
        const resultInput = document.getElementById('pwd-result');
        const copyBtn = document.getElementById('copy-pwd');
        const lengthInput = document.getElementById('pwd-length');
        const uppercaseCheck = document.getElementById('pwd-uppercase');
        const numbersCheck = document.getElementById('pwd-numbers');
        const symbolsCheck = document.getElementById('pwd-symbols');

        const generate = () => {
            const length = parseInt(lengthInput.value) || 16;
            let charset = 'abcdefghijklmnopqrstuvwxyz';
            
            if (uppercaseCheck.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (numbersCheck.checked) charset += '0123456789';
            if (symbolsCheck.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            let password = '';
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }

            resultInput.value = password;
            UnitixUtils.hapticFeedback(generateBtn);
        };

        generateBtn?.addEventListener('click', generate);

        copyBtn?.addEventListener('click', () => {
            if (resultInput.value) {
                UnitixUtils.copyToClipboard(resultInput.value);
                copyBtn.classList.add('success');
                setTimeout(() => copyBtn.classList.remove('success'), 1000);
                UnitixUtils.hapticFeedback(copyBtn);
            }
        });

        // Générer au chargement
        generate();
    }

    // Calculateur temps de téléchargement
    initDownloadCalculator() {
        const calcBtn = document.getElementById('calc-download');
        const sizeInput = document.getElementById('file-size');
        const speedInput = document.getElementById('connection-speed');
        const resultDiv = document.getElementById('download-result');

        calcBtn?.addEventListener('click', () => {
            const sizeGB = parseFloat(sizeInput.value);
            const speedMbps = parseFloat(speedInput.value);

            if (isNaN(sizeGB) || isNaN(speedMbps) || speedMbps <= 0) {
                resultDiv.innerHTML = '<span style="color: var(--text-sec)">Veuillez entrer des valeurs valides</span>';
                return;
            }

            // Conversion: GB to bits, then divide by Mbps
            const sizeBits = sizeGB * 8 * 1024; // GB to Megabits
            const timeSeconds = sizeBits / speedMbps;

            resultDiv.innerHTML = `
                <div style="font-size: 24px; font-weight: 800; color: var(--primary);">
                    ${UnitixUtils.formatTime(timeSeconds)}
                </div>
                <div style="font-size: 14px; color: var(--text-sec); margin-top: 8px;">
                    Temps de téléchargement estimé
                </div>
            `;

            UnitixUtils.hapticFeedback(calcBtn);
        });
    }

    // Conversions rapides
    initQuickConversions() {
        const quickBtns = document.querySelectorAll('.quick-btn');

        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const conversion = btn.dataset.quick;
                const value = prompt('Entrez la valeur à convertir:');
                
                if (!value || isNaN(parseFloat(value))) return;

                const num = parseFloat(value);
                let result, unit;

                switch (conversion) {
                    case 'km-mi':
                        result = num * 0.621371;
                        unit = 'miles';
                        break;
                    case 'mi-km':
                        result = num * 1.60934;
                        unit = 'km';
                        break;
                    case 'kg-lb':
                        result = num * 2.20462;
                        unit = 'lb';
                        break;
                    case 'lb-kg':
                        result = num / 2.20462;
                        unit = 'kg';
                        break;
                    case 'c-f':
                        result = (num * 9/5) + 32;
                        unit = '°F';
                        break;
                    case 'f-c':
                        result = (num - 32) * 5/9;
                        unit = '°C';
                        break;
                }

                UnitixUtils.showToast(`${value} = ${result.toFixed(2)} ${unit}`);
                UnitixUtils.hapticFeedback(btn);
            });
        });
    }
}

// ==========================================
// NIVEAU À BULLE
// ==========================================
class BubbleLevel {
    constructor() {
        this.bubble = document.getElementById('level-bubble');
        this.dataDisplay = document.getElementById('level-data');
        this.calibrateBtn = document.getElementById('btn-calibrate');
        this.offset = { beta: 0, gamma: 0 };
        
        this.init();
    }

    init() {
        if (!window.DeviceOrientationEvent) {
            this.dataDisplay.textContent = 'Non supporté sur cet appareil';
            return;
        }

        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));

        this.calibrateBtn?.addEventListener('click', () => {
            this.calibrate();
            UnitixUtils.hapticFeedback(this.calibrateBtn);
        });
    }

    handleOrientation(event) {
        const beta = event.beta - this.offset.beta;
        const gamma = event.gamma - this.offset.gamma;

        const maxTilt = 30;
        const clampedBeta = Math.max(-maxTilt, Math.min(maxTilt, beta));
        const clampedGamma = Math.max(-maxTilt, Math.min(maxTilt, gamma));

        const x = (clampedGamma / maxTilt) * 130;
        const y = (clampedBeta / maxTilt) * 130;

        this.bubble.style.transform = `translate(${x}px, ${y}px)`;

        const totalTilt = Math.sqrt(beta * beta + gamma * gamma);
        this.dataDisplay.textContent = `${totalTilt.toFixed(1)}°`;
    }

    calibrate() {
        if (event && event.beta && event.gamma) {
            this.offset = {
                beta: event.beta,
                gamma: event.gamma
            };
            UnitixUtils.showToast('✓ Niveau calibré');
        }
    }
}

// ==========================================
// BLOC-NOTES
// ==========================================
class NotesManager {
    constructor() {
        this.textarea = document.getElementById('notes-area');
        this.init();
    }

    init() {
        if (!this.textarea) return;

        const savedNotes = localStorage.getItem('unitix_notes_data') || '';
        this.textarea.value = savedNotes;

        let saveTimeout;
        this.textarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('unitix_notes_data', this.textarea.value);
            }, 500);
        });
    }
}

// ==========================================
// PARAMÈTRES
// ==========================================
class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.initTheme();
        this.initNotesToggle();
        this.initAccentColor();
        this.initHaptic();
        this.initReset();
    }

    initTheme() {
        const buttons = document.querySelectorAll('[data-theme-btn]');
        const savedTheme = localStorage.getItem('unitix_theme_pref') || 'auto';

        this.applyTheme(savedTheme);
        
        buttons.forEach(btn => {
            if (btn.dataset.themeBtn === savedTheme) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const theme = btn.dataset.themeBtn;
                this.applyTheme(theme);
                localStorage.setItem('unitix_theme_pref', theme);
                UnitixUtils.hapticFeedback(btn);
            });
        });
    }

    applyTheme(theme) {
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
    }

    initNotesToggle() {
        const toggle = document.getElementById('toggle-notes');
        const navNotes = document.getElementById('nav-notes');
        const saved = localStorage.getItem('unitix_notes_enabled') === 'true';

        if (saved) {
            toggle.checked = true;
            navNotes?.classList.remove('hidden');
        }

        toggle?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('unitix_notes_enabled', enabled);
            
            if (enabled) {
                navNotes?.classList.remove('hidden');
                UnitixUtils.showToast('✓ Bloc-notes activé');
            } else {
                navNotes?.classList.add('hidden');
                UnitixUtils.showToast('✓ Bloc-notes masqué');
            }
        });
    }

    initAccentColor() {
        const dots = document.querySelectorAll('.accent-list .dot');
        const savedColor = localStorage.getItem('unitix_accent_color') || '#007AFF';

        document.documentElement.style.setProperty('--primary', savedColor);
        
        dots.forEach(dot => {
            const color = dot.dataset.color;
            if (color === savedColor) {
                dot.classList.add('active');
            }

            dot.addEventListener('click', () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                document.documentElement.style.setProperty('--primary', color);
                localStorage.setItem('unitix_accent_color', color);
                UnitixUtils.showToast('✓ Couleur modifiée');
                UnitixUtils.hapticFeedback(dot);
            });
        });
    }

    initHaptic() {
        const toggle = document.getElementById('toggle-haptic');
        const saved = localStorage.getItem('unitix_haptic_enabled');

        if (saved === 'false') {
            toggle.checked = false;
        }

        toggle?.addEventListener('change', (e) => {
            localStorage.setItem('unitix_haptic_enabled', e.target.checked);
            UnitixUtils.showToast(e.target.checked ? '✓ Feedback activé' : '✓ Feedback désactivé');
        });
    }

    initReset() {
        const resetBtn = document.getElementById('app-reset');

        resetBtn?.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
}

// ==========================================
// SYSTÈME DE MODALES
// ==========================================
class ModalSystem {
    constructor() {
        this.init();
    }

    init() {
        const modal = document.getElementById('history-modal');
        const closeBtn = modal?.querySelector('.modal-close');
        const clearBtn = document.getElementById('clear-history');

        closeBtn?.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        clearBtn?.addEventListener('click', () => {
            const convertHistory = new HistoryManager('unitix_convert_history');
            convertHistory.clear();
            modal.classList.remove('active');
            UnitixUtils.showToast('✓ Historique effacé');
        });

        // Fermeture avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }
}

// ==========================================
// SERVICE WORKER REGISTRATION
// ==========================================
class PWAManager {
    static register() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('✓ Service Worker enregistré'))
                .catch(err => console.log('✗ Erreur SW:', err));
        }
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Unitix 7.0 - Power Edition');
    
    // Initialiser tous les modules
    const navigation = new NavigationSystem();
    const unitConverter = new UnitConverter();
    const currencyConverter = new CurrencyConverter();
    const dateCalculator = new DateCalculator();
    const calculator = new Calculator();
    const quickTools = new QuickTools();
    const bubbleLevel = new BubbleLevel();
    const notesManager = new NotesManager();
    const settingsManager = new SettingsManager();
    const modalSystem = new ModalSystem();
    
    // Initialiser le mode éco
    EcoModeManager.init();
    
    // Enregistrer le Service Worker
    PWAManager.register();
    
    // Détection système auto-thème
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('unitix_theme_pref') === 'auto') {
            document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });

    console.log('✅ Tous les modules chargés');
});

// Cleanup global pour éviter fuites mémoire
window.addEventListener('beforeunload', () => {
    // Cleanup si nécessaire
});

