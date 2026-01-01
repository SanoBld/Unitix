// --- ÉTAT GLOBAL & STOCKAGE ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    accent: localStorage.getItem('u-accent') || '#007AFF',
    note: localStorage.getItem('u-note') || ''
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    applyAccent(state.accent);
    initNavigation();
    initSettings();
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();
    animateCounter('total-conv', 1420);
});

// --- SYSTÈME DE THÈME ---
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
}

function initSettings() {
    const panel = document.getElementById('settings-panel');
    document.getElementById('settings-toggle').onclick = () => panel.classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => panel.classList.add('hidden');

    document.querySelectorAll('.seg-btn').forEach(btn => {
        if(btn.dataset.mode === state.theme) btn.classList.add('active');
        btn.onclick = () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.mode;
            localStorage.setItem('u-theme', state.theme);
            applyTheme(state.theme);
        };
    });

    document.querySelectorAll('.color-circle').forEach(circle => {
        circle.onclick = () => {
            state.accent = circle.dataset.color;
            localStorage.setItem('u-accent', state.accent);
            applyAccent(state.accent);
        };
    });
}

// --- ANIMATION DE CHIFFRES ---
function triggerDigitAnim(element) {
    element.classList.remove('digit-update');
    void element.offsetWidth; // Force reflow
    element.classList.add('digit-update');
}

// --- CONVERTISSEUR D'UNITÉS ---
const unitData = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048 },
    mass: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.4535, oz: 0.0283 },
    volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.785, pt: 0.473 },
    speed: { "km/h": 1, mph: 1.609, "m/s": 3.6, kn: 1.852 },
    temperature: { type: 'special' }
};

function initUnits() {
    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');

    function fill() {
        const units = unitData[cat.value].type === 'special' 
            ? ['Celsius', 'Fahrenheit', 'Kelvin'] 
            : Object.keys(unitData[cat.value]);
        const options = units.map(u => `<option value="${u}">${u}</option>`).join('');
        from.innerHTML = options; to.innerHTML = options;
        to.selectedIndex = 1;
        convert();
    }

    function convert() {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ''; return; }
        
        let res;
        if (cat.value === 'temperature') {
            res = convertTemp(val, from.value, to.value);
        } else {
            const rates = unitData[cat.value];
            res = (val * rates[from.value]) / rates[to.value];
        }
        output.value = parseFloat(res.toPrecision(7));
        triggerDigitAnim(output);
    }

    cat.onchange = fill;
    [input, from, to].forEach(el => el.oninput = convert);
    fill();
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

// --- DEVISES (API) ---
async function initCurrency() {
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const log = document.getElementById('last-update');

    const codes = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RUB', 'BRL'];
    const opts = codes.map(c => `<option value="${c}">${c}</option>`).join('');
    from.innerHTML = opts; to.innerHTML = opts;
    to.value = 'USD';

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await res.json();
        const rates = data.rates;
        log.innerText = "Taux à jour (Source: Open Exchange)";

        const calc = () => {
            const val = parseFloat(input.value);
            if (isNaN(val)) return;
            const resVal = (val / rates[from.value]) * rates[to.value];
            output.value = resVal.toFixed(2);
            triggerDigitAnim(output);
        };

        [input, from, to].forEach(el => el.oninput = calc);
        calc();
    } catch (e) { log.innerText = "Mode hors-ligne"; }
}

// --- CALCULATRICE ---
function initCalculator() {
    const curr = document.getElementById('calc-current');
    const prev = document.getElementById('calc-prev');
    const container = document.getElementById('calc-btns');
    let state = { cur: '0', pre: '', op: null };

    const keys = ['AC', '⌫', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
    keys.forEach(k => {
        const b = document.createElement('button');
        b.innerText = k;
        if(['/','*','-','+','='].includes(k)) b.className = 'op';
        b.onclick = () => handleCalc(k);
        container.appendChild(b);
    });

    function handleCalc(k) {
        if(!isNaN(k) || k === '.') {
            if(state.cur === '0' && k !== '.') state.cur = k;
            else state.cur += k;
        } else if(k === 'AC') { state = { cur: '0', pre: '', op: null }; }
        else if(k === '=') {
            if(!state.op) return;
            state.cur = eval(`${state.pre}${state.op}${state.cur}`).toString();
            state.op = null; state.pre = '';
        } else {
            state.op = k; state.pre = state.cur; state.cur = '0';
        }
        curr.innerText = state.cur;
        prev.innerText = state.pre + (state.op || '');
        triggerDigitAnim(curr);
    }
}

// --- BLOC-NOTES ---
function initNotes() {
    const pad = document.getElementById('note-pad');
    const status = document.getElementById('save-status');
    pad.value = state.note;

    pad.oninput = () => {
        localStorage.setItem('u-note', pad.value);
        status.innerText = "Enregistrement...";
        setTimeout(() => status.innerText = "Sauvegardé localement", 800);
    };

    document.getElementById('download-note').onclick = () => {
        const blob = new Blob([pad.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'unitix_notes.txt';
        a.click();
    };
}

// --- NAVIGATION ---
function initNavigation() {
    document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn, .panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        };
    });
}

function animateCounter(id, target) {
    let c = 0;
    const el = document.getElementById(id);
    const interval = setInterval(() => {
        c += Math.ceil(target/40);
        if(c >= target) { el.innerText = target; clearInterval(interval); }
        else el.innerText = c;
    }, 20);
}