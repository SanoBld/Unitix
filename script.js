// --- ÉTAT GLOBAL ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    accent: localStorage.getItem('u-accent') || '#007AFF',
    history: JSON.parse(localStorage.getItem('u-history')) || { unit: [], currency: [] }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    applyAccent(state.accent);
    
    // Initialisation des modules
    initNavigation();
    initSettings();
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();
});

/* --- UTILITAIRES --- */
const formatNumber = (num) => {
    if (num === '') return '';
    // Gestion des décimales pour éviter 1,000.0000
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(n);
};

const updateHistory = (type, text) => {
    // Ajouter au début et garder max 5
    state.history[type].unshift(text);
    if (state.history[type].length > 5) state.history[type].pop();
    
    localStorage.setItem('u-history', JSON.stringify(state.history));
    renderHistory(type);
};

const renderHistory = (type) => {
    const list = document.getElementById(`${type}-history`);
    list.innerHTML = state.history[type].map(item => 
        `<li><span>${item.split(' = ')[0]}</span> ${item.split(' = ')[1]}</li>`
    ).join('');
};

/* --- THEME & REGLAGES --- */
function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', mode);
    }
}

function applyAccent(color) {
    document.documentElement.style.setProperty('--primary', color);
    // Mise à jour visuelle des boutons de couleur
    document.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('active', d.dataset.color === color);
    });
}

function initSettings() {
    // Boutons de thème
    document.querySelectorAll('.seg-btn').forEach(btn => {
        if(btn.dataset.mode === state.theme) btn.classList.add('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.mode;
            localStorage.setItem('u-theme', state.theme);
            applyTheme(state.theme);
        });
    });

    // Boutons de couleur
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.accent = dot.dataset.color;
            localStorage.setItem('u-accent', state.accent);
            applyAccent(state.accent);
        });
    });

    // Reset total
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Tout effacer (notes, historique, préférences) ?")) {
            localStorage.clear();
            location.reload();
        }
    });
}

/* --- NAVIGATION --- */
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-target]');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn, .panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });
}

/* --- CONVERTISSEUR UNITÉS --- */
const unitData = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
    mass: { kg: 1, g: 0.001, t: 1000, lb: 0.453592, oz: 0.0283495 },
    volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541 },
    speed: { "km/h": 1, mph: 1.60934, "m/s": 3.6, kn: 1.852 },
    data: { MB: 1, GB: 1024, TB: 1048576, KB: 0.0009765625 },
    temperature: { type: 'special' }
};

function initUnits() {
    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    renderHistory('unit');

    function populate() {
        const type = cat.value;
        const units = type === 'temperature' 
            ? ['Celsius', 'Fahrenheit', 'Kelvin'] 
            : Object.keys(unitData[type]);
        
        const html = units.map(u => `<option value="${u}">${u}</option>`).join('');
        from.innerHTML = html;
        to.innerHTML = html;
        to.selectedIndex = 1;
        calculate();
    }

    function calculate() {
        let val = input.value.replace(',', '.'); // Accepte virgules
        if(val === '' || isNaN(val)) { output.value = ''; return; }
        val = parseFloat(val);

        let result;
        const type = cat.value;
        const uFrom = from.value;
        const uTo = to.value;

        if(type === 'temperature') {
            result = convertTemp(val, uFrom, uTo);
        } else {
            const rates = unitData[type];
            result = (val * rates[uFrom]) / rates[uTo];
        }

        const formattedResult = parseFloat(result.toPrecision(7));
        output.value = formatNumber(formattedResult);
        
        // Debounce simple pour historique
        clearTimeout(window.unitTimer);
        window.unitTimer = setTimeout(() => {
            updateHistory('unit', `${val} ${uFrom} = ${formattedResult} ${uTo}`);
        }, 2000);
    }

    function convertTemp(v, f, t) {
        let k;
        if(f === 'Celsius') k = v + 273.15;
        else if(f === 'Fahrenheit') k = (v - 32) * 5/9 + 273.15;
        else k = v;
        if(t === 'Celsius') return k - 273.15;
        if(t === 'Fahrenheit') return (k - 273.15) * 9/5 + 32;
        return k;
    }

    // Swap Logic
    swapBtn.addEventListener('click', () => {
        const temp = from.value;
        from.value = to.value;
        to.value = temp;
        calculate();
    });

    cat.addEventListener('change', populate);
    input.addEventListener('input', calculate);
    from.addEventListener('change', calculate);
    to.addEventListener('change', calculate);

    populate();
}

/* --- DEVISES (API SÉCURISÉE & CACHE) --- */
async function initCurrency() {
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const statusDot = document.getElementById('api-status-dot');
    const statusTxt = document.getElementById('api-details');
    const swapBtn = document.getElementById('btn-swap-currency');

    renderHistory('currency');

    // Liste étendue
    const currencies = [
        "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "BRL", 
        "RUB", "KRW", "SGD", "MXN", "HKD", "NZD", "SEK", "ZAR", "TRY"
    ];
    
    // Remplissage avec tri alphabétique
    const opts = currencies.sort().map(c => `<option value="${c}">${c}</option>`).join('');
    from.innerHTML = opts; to.innerHTML = opts;
    from.value = 'EUR'; to.value = 'USD';

    let rates = {};

    // Fonction de récupération avec Cache
    async function fetchRates() {
        const CACHE_KEY = 'u-currency-data';
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        const now = Date.now();

        // Utiliser le cache si valide
        if (cached && (now - cached.timestamp < CACHE_DURATION)) {
            rates = cached.rates;
            updateStatus(true, "Cache", new Date(cached.timestamp));
            convert();
            return;
        }

        try {
            statusTxt.innerText = "Mise à jour...";
            const res = await fetch('https://open.er-api.com/v6/latest/EUR');
            const data = await res.json();
            
            if(data.result === "success") {
                rates = data.rates;
                // Sauvegarde
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: now,
                    rates: rates,
                    date: data.time_last_update_utc
                }));
                updateStatus(true, "API", new Date());
                convert();
            } else { throw new Error("API Error"); }
        } catch (e) {
            if(cached) {
                rates = cached.rates;
                updateStatus(false, "Hors-ligne (Cache)", new Date(cached.timestamp));
            } else {
                updateStatus(false, "Erreur connexion", null);
            }
        }
    }

    function updateStatus(success, source, date) {
        statusDot.style.background = success ? '#34C759' : '#FF9500'; // Vert ou Orange
        const dateStr = date ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
        statusTxt.innerText = `Source: ${source} • MàJ: ${dateStr}`;
    }

    function convert() {
        if(!rates[from.value]) return;
        let val = parseFloat(input.value.replace(',', '.'));
        if(isNaN(val)) { output.value = ''; return; }

        // Conversion via EUR (Base de l'API)
        // Rate(From -> To) = (1 / Rate(From)) * Rate(To)
        const rateFrom = rates[from.value];
        const rateTo = rates[to.value];
        const result = (val / rateFrom) * rateTo;

        const formatted = result.toFixed(2);
        output.value = formatNumber(formatted);

        clearTimeout(window.currTimer);
        window.currTimer = setTimeout(() => {
            updateHistory('currency', `${val} ${from.value} = ${formatted} ${to.value}`);
        }, 2000);
    }

    swapBtn.addEventListener('click', () => {
        const t = from.value; from.value = to.value; to.value = t;
        convert();
    });

    [input, from, to].forEach(e => e.addEventListener('input', convert));
    
    await fetchRates();
}

/* --- CALCULATRICE SÉCURISÉE --- */
function initCalculator() {
    const curr = document.getElementById('calc-current');
    const prev = document.getElementById('calc-prev');
    const pad = document.getElementById('calc-btns');

    let currentOperand = '0';
    let previousOperand = '';
    let operation = undefined;

    const buttons = [
        {txt: 'AC', cls: 'func-btn'}, {txt: 'DEL', cls: 'func-btn'}, {txt: '%', cls: 'func-btn'}, {txt: '÷', cls: 'op-btn', val: '/'},
        {txt: '7'}, {txt: '8'}, {txt: '9'}, {txt: '×', cls: 'op-btn', val: '*'},
        {txt: '4'}, {txt: '5'}, {txt: '6'}, {txt: '-', cls: 'op-btn', val: '-'},
        {txt: '1'}, {txt: '2'}, {txt: '3'}, {txt: '+', cls: 'op-btn', val: '+'},
        {txt: '0', cls: 'zero-btn'}, {txt: '.'}, {txt: '=', cls: 'op-btn'}
    ];

    // Génération HTML
    pad.innerHTML = buttons.map(b => 
        `<button class="${b.cls || ''}" data-val="${b.val || b.txt}">${b.txt}</button>`
    ).join('');

    pad.addEventListener('click', (e) => {
        if(!e.target.matches('button')) return;
        const val = e.target.dataset.val;

        switch(val) {
            case 'AC': 
                currentOperand = '0'; previousOperand = ''; operation = undefined; 
                break;
            case 'DEL': 
                currentOperand = currentOperand.toString().slice(0, -1);
                if(currentOperand === '') currentOperand = '0';
                break;
            case '=':
                compute();
                operation = undefined; previousOperand = '';
                break;
            case '+': case '-': case '*': case '/':
                if(currentOperand === '') return;
                if(previousOperand !== '') compute();
                operation = val;
                previousOperand = currentOperand;
                currentOperand = '';
                break;
            case '%':
                currentOperand = (parseFloat(currentOperand) / 100).toString();
                break;
            default: // Chiffres et points
                if(val === '.' && currentOperand.includes('.')) return;
                if(currentOperand === '0' && val !== '.') currentOperand = val;
                else currentOperand += val;
        }
        updateDisplay();
    });

    function compute() {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);
        if(isNaN(prev) || isNaN(current)) return;

        switch(operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '*': computation = prev * current; break;
            case '/': computation = prev / current; break;
            default: return;
        }
        currentOperand = computation.toString();
        operation = undefined;
        previousOperand = '';
    }

    function updateDisplay() {
        curr.innerText = formatNumber(currentOperand) || currentOperand;
        prev.innerText = previousOperand ? `${formatNumber(previousOperand)} ${getSymbol(operation)}` : '';
    }

    function getSymbol(op) {
        if(op === '*') return '×';
        if(op === '/') return '÷';
        return op;
    }
}

/* --- BLOC-NOTES --- */
function initNotes() {
    const pad = document.getElementById('note-pad');
    const status = document.getElementById('save-status');
    
    // Charger
    pad.value = localStorage.getItem('u-note') || '';

    // Sauvegarder
    pad.addEventListener('input', () => {
        localStorage.setItem('u-note', pad.value);
        status.innerText = "Enregistrement...";
        clearTimeout(window.noteTimer);
        window.noteTimer = setTimeout(() => status.innerText = "Synchronisé", 800);
    });

    // Télécharger
    document.getElementById('download-note').addEventListener('click', () => {
        const blob = new Blob([pad.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Note_Unitix_${new Date().toLocaleDateString().replace(/\//g,'-')}.txt`;
        a.click();
    });
}