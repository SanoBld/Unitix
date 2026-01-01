/**
 * UNITIX PRO - LOGIQUE COMPLÈTE
 */

// --- ÉTAT GLOBAL DE L'APPLICATION ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    showNotes: localStorage.getItem('u-notes-enabled') === 'true',
    currencyRates: null,
    history: JSON.parse(localStorage.getItem('u-history')) || { unit: [], currency: [] }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    initNavigation();
    initUnits();
    initCurrency();
    initCalculator();
    initDates();
    initNotes();
    initSettings();
});

// --- NAVIGATION ---
function initNavigation() {
    const btns = document.querySelectorAll('.nav-btn[data-target]');
    const panels = document.querySelectorAll('.panel');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            
            // Mise à jour visuelle des boutons
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Affichage du panel correspondant
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === target) p.classList.add('active');
            });
        });
    });
}

// --- MODULE : CONVERSION DE MESURES ---
function initUnits() {
    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    const unitsData = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
        mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.4535, oz: 0.0283 },
        data: { MB: 1, GB: 1024, TB: 1048576, KB: 0.00097, B: 0.00000095 },
        volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.785, cup: 0.236 },
        temperature: { type: 'special' }
    };

    function populateUnits() {
        const type = cat.value;
        let options = '';
        if (type === 'temperature') {
            options = '<option value="C">Celsius</option><option value="F">Fahrenheit</option><option value="K">Kelvin</option>';
        } else {
            options = Object.keys(unitsData[type]).map(u => `<option value="${u}">${u}</option>`).join('');
        }
        from.innerHTML = to.innerHTML = options;
        to.selectedIndex = 1;
        performConversion();
    }

    function performConversion() {
        const val = parseFloat(input.value.replace(',', '.'));
        if (isNaN(val)) { output.value = ''; return; }

        const type = cat.value;
        let result;

        if (type === 'temperature') {
            result = convertTemp(val, from.value, to.value);
        } else {
            const map = unitsData[type];
            result = (val * map[from.value]) / map[to.value];
        }
        output.value = Number(result.toFixed(6)).toString();
    }

    function convertTemp(v, f, t) {
        let celsius;
        if (f === 'C') celsius = v;
        else if (f === 'F') celsius = (v - 32) * 5/9;
        else celsius = v - 273.15;

        if (t === 'C') return celsius;
        if (t === 'F') return (celsius * 9/5) + 32;
        return celsius + 273.15;
    }

    cat.onchange = populateUnits;
    [input, from, to].forEach(el => el.oninput = performConversion);
    
    swapBtn.onclick = () => {
        const temp = from.value;
        from.value = to.value;
        to.value = temp;
        performConversion();
    };

    populateUnits();
}

// --- MODULE : DEVISES (API EXTERNE) ---
async function initCurrency() {
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const apiLog = document.getElementById('api-log');

    const codes = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "BRL"];
    const optionsHtml = codes.map(c => `<option value="${c}">${c}</option>`).join('');
    from.innerHTML = to.innerHTML = optionsHtml;
    to.value = "USD";

    async function fetchRates() {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/EUR');
            const data = await response.json();
            state.currencyRates = data.rates;
            if(apiLog) apiLog.innerText = "Taux à jour";
            const dot = document.getElementById('api-dot');
            if(dot) dot.style.background = "#34C759";
            convertCurrency();
        } catch (e) {
            if(apiLog) apiLog.innerText = "Mode hors-ligne";
            const dot = document.getElementById('api-dot');
            if(dot) dot.style.background = "#FF3B30";
        }
    }

    function convertCurrency() {
        if (!state.currencyRates) return;
        const val = parseFloat(input.value.replace(',', '.'));
        if (isNaN(val)) { output.value = ''; return; }

        const eurBase = val / state.currencyRates[from.value];
        const result = eurBase * state.currencyRates[to.value];
        output.value = result.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    input.oninput = convertCurrency;
    from.onchange = convertCurrency;
    to.onchange = convertCurrency;
    
    const swapCurr = document.getElementById('btn-swap-currency');
    if(swapCurr) {
        swapCurr.onclick = () => {
            const t = from.value; from.value = to.value; to.value = t;
            convertCurrency();
        };
    }

    fetchRates();
}

// --- MODULE : CALCUL DE DATES ---
function initDates() {
    const start = document.getElementById('date-start');
    const end = document.getElementById('date-end');
    const main = document.getElementById('date-output-main');
    const sub = document.getElementById('date-output-sub');

    function calculateDiff() {
        if (!start.value || !end.value) return;
        
        const d1 = new Date(start.value);
        const d2 = new Date(end.value);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if(main) main.innerText = `${diffDays} Jours`;
        
        const y = Math.floor(diffDays / 365);
        const m = Math.floor((diffDays % 365) / 30);
        const d = (diffDays % 365) % 30;
        
        if(sub) sub.innerText = `Équivaut à environ ${y} an(s), ${m} mois et ${d} jour(s)`;
    }

    if(start && end) {
        start.onchange = calculateDiff;
        end.onchange = calculateDiff;
    }
}

// --- MODULE : CALCULATRICE ---
function initCalculator() {
    const currDisplay = document.getElementById('calc-curr');
    const prevDisplay = document.getElementById('calc-prev');
    const grid = document.getElementById('calc-btns');
    if(!grid) return;

    let currentInput = '0';
    let previousInput = '';
    let operation = null;

    const keys = [
        'C', 'DEL', '%', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '='
    ];

    grid.innerHTML = keys.map(k => {
        const isOp = isNaN(k) && k !== '.';
        return `<button class="${isOp ? 'op-btn' : ''}" data-val="${k}">${k}</button>`;
    }).join('');

    grid.onclick = (e) => {
        const val = e.target.dataset.val;
        if (!val) return;

        if (val === 'C') {
            currentInput = '0';
            previousInput = '';
            operation = null;
        } else if (val === 'DEL') {
            currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
        } else if (val === '=') {
            if (!operation) return;
            try {
                const result = eval(`${previousInput}${operation}${currentInput}`);
                prevDisplay.innerText = `${previousInput} ${operation} ${currentInput} =`;
                currentInput = result.toString();
                operation = null;
                previousInput = '';
            } catch { currentInput = 'Erreur'; }
        } else if (['+', '-', '*', '/'].includes(val)) {
            operation = val;
            previousInput = currentInput;
            currentInput = '0';
        } else {
            currentInput = (currentInput === '0' && val !== '.') ? val : currentInput + val;
        }
        
        currDisplay.innerText = currentInput;
        if (operation && previousInput) prevDisplay.innerText = `${previousInput} ${operation}`;
    };
}

// --- MODULE : BLOC-NOTES ---
function initNotes() {
    const pad = document.getElementById('note-pad');
    const navBtn = document.getElementById('nav-notes');
    if(!pad) return;
    
    pad.value = localStorage.getItem('u-note-content') || '';
    pad.addEventListener('input', () => {
        localStorage.setItem('u-note-content', pad.value);
    });

    if (state.showNotes && navBtn) navBtn.classList.remove('hidden');

    const downloadBtn = document.getElementById('download-note');
    if(downloadBtn) {
        downloadBtn.onclick = () => {
            const blob = new Blob([pad.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notes_unitix.txt';
            a.click();
        };
    }
}

// --- MODULE : RÉGLAGES & THÈME ---
function initSettings() {
    const noteToggle = document.getElementById('toggle-notes-option');
    const navBtn = document.getElementById('nav-notes');

    if(noteToggle) {
        noteToggle.checked = state.showNotes;
        noteToggle.onchange = (e) => {
            const active = e.target.checked;
            localStorage.setItem('u-notes-enabled', active);
            if(navBtn) navBtn.classList.toggle('hidden', !active);
        };
    }

    document.querySelectorAll('.seg-btn').forEach(btn => {
        if (btn.dataset.theme === state.theme) btn.classList.add('active');
        btn.onclick = () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.theme;
            localStorage.setItem('u-theme', state.theme);
            applyTheme(state.theme);
        };
    });

    const resetBtn = document.getElementById('btn-reset-app');
    if(resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("Supprimer toutes les préférences et notes ?")) {
                localStorage.clear();
                location.reload();
            }
        };
    }
}

function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', mode);
    }
}