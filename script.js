/* --- UNITIX CORE --- */
const state = {
    theme: localStorage.getItem('ux-theme') || 'auto',
    haptic: localStorage.getItem('ux-haptic') !== 'false'
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initConverter();
    initCalculator();
    initSettings();
});

const vibrate = () => { if(state.haptic && navigator.vibrate) navigator.vibrate(12); };

/* --- NAVIGATION --- */
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });
}

/* --- CALCULATRICE CORRIGÉE --- */
let calcExpr = "";
function initCalculator() {
    const grid = document.getElementById('calc-grid');
    const buttons = [
        {txt:'AC', cl:'fn'}, {txt:'+/-', cl:'fn'}, {txt:'%', cl:'fn'}, {txt:'÷', cl:'op', val:'/'},
        {txt:'7', cl:'num'}, {txt:'8', cl:'num'}, {txt:'9', cl:'num'}, {txt:'×', cl:'op', val:'*'},
        {txt:'4', cl:'num'}, {txt:'5', cl:'num'}, {txt:'6', cl:'num'}, {txt:'-', cl:'op', val:'-'},
        {txt:'1', cl:'num'}, {txt:'2', cl:'num'}, {txt:'3', cl:'num'}, {txt:'+', cl:'op', val:'+'},
        {txt:'0', cl:'num', span: true}, {txt:'.', cl:'num'}, {txt:'=', cl:'op'}
    ];

    grid.innerHTML = buttons.map(b => `
        <button class="calc-btn ${b.cl}" 
                style="${b.span ? 'grid-column: span 2; aspect-ratio: auto; border-radius: 50px;' : ''}"
                onclick="handleCalc('${b.val || b.txt}')">${b.txt}</button>
    `).join('');
}

function handleCalc(v) {
    vibrate();
    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');

    if (v === 'AC') {
        calcExpr = "";
        display.value = "0";
        history.innerText = "";
    } else if (v === '=') {
        try {
            let result = eval(calcExpr);
            history.innerText = calcExpr + " =";
            display.value = Number(result.toFixed(8));
            calcExpr = result.toString();
        } catch { display.value = "Erreur"; }
    } else if (v === '%') {
        let val = parseFloat(display.value) / 100;
        display.value = val;
        calcExpr = val.toString();
    } else {
        if (display.value === "0" && !isNaN(v)) calcExpr = v;
        else calcExpr += v;
        display.value = calcExpr;
    }
}

/* --- CONVERTISSEUR DÉTAILLÉ --- */
const UNITS = {
    "Longueur": { m: "Mètres", km: "Kilomètres", cm: "Centimètres", mm: "Millimètres", in: "Pouces", ft: "Pieds" },
    "Masse": { kg: "Kilogrammes", g: "Grammes", lb: "Livres (lb)", oz: "Onces (oz)" },
    "Température": { c: "Celsius", f: "Fahrenheit", k: "Kelvin" }
};

function initConverter() {
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    
    let html = "";
    for (let cat in UNITS) {
        html += `<optgroup label="${cat}">`;
        for (let key in UNITS[cat]) {
            html += `<option value="${key}">${UNITS[cat][key]}</option>`;
        }
        html += `</optgroup>`;
    }
    from.innerHTML = html;
    to.innerHTML = html;
    to.value = "km";
}

/* --- THEME & SETTINGS --- */
function initTheme() {
    document.body.setAttribute('data-theme', state.theme);
}

function initSettings() {
    const ts = document.getElementById('theme-select');
    ts.value = state.theme;
    ts.addEventListener('change', (e) => {
        state.theme = e.target.value;
        localStorage.setItem('ux-theme', state.theme);
        initTheme();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser ?")) { localStorage.clear(); location.reload(); }
    });
}