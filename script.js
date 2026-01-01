/* --- UNITIX CORE --- */
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    haptic: localStorage.getItem('u-haptic') !== 'false',
    calcMode: localStorage.getItem('u-calc-mode') || 'std'
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initConverter();
    initCurrency();
    initCalculator();
    initDateCalc();
    initSettings();
    
    // Auto-focus clavier pour calculatrice
    window.addEventListener('keydown', handleGlobalKey);
});

/* --- UTILS --- */
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const vibrate = () => { if(state.haptic && isMobile() && navigator.vibrate) navigator.vibrate(12); };

function showToast(msg = "Copié !") {
    const t = document.getElementById('toast');
    t.querySelector('span').innerText = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2000);
}

/* --- CALCULATRICE ENGINE (Logic Windows) --- */
let calcExpr = "";
let lastResult = null;

function initCalculator() {
    const grid = document.getElementById('calc-grid');
    const modeSelector = document.getElementById('calc-mode-selector');
    
    modeSelector.value = state.calcMode;
    modeSelector.addEventListener('change', (e) => {
        state.calcMode = e.target.value;
        localStorage.setItem('u-calc-mode', state.calcMode);
        renderCalc();
    });

    renderCalc();
}

function renderCalc() {
    const grid = document.getElementById('calc-grid');
    grid.className = `calc-grid ${state.calcMode}`;
    
    const buttons = state.calcMode === 'std' 
        ? ['AC', 'DEL', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=']
        : ['sin', 'cos', 'tan', '√', 'AC', 'log', 'ln', 'x²', 'xʸ', 'DEL', '(', ')', 'n!', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];

    grid.innerHTML = buttons.map(b => {
        let cls = "calc-btn";
        if(['/', '*', '-', '+', '='].includes(b)) cls += " op";
        if(['AC', 'DEL', '%', 'sin', 'cos', 'tan', '√', 'log', 'ln', 'x²', 'xʸ', '(', ')', 'n!'].includes(b)) cls += " fn";
        return `<button class="${cls}" onclick="handleCalc('${b}')">${b}</button>`;
    }).join('');
}

function handleCalc(val) {
    vibrate();
    const display = document.getElementById('calc-display');
    const exprDiv = document.getElementById('calc-expression');

    if (val === 'AC') {
        calcExpr = "";
        display.value = "0";
        exprDiv.innerText = "";
    } else if (val === 'DEL') {
        calcExpr = calcExpr.toString().slice(0, -1);
        display.value = calcExpr || "0";
    } else if (val === '=') {
        try {
            // Logique Windows % : si on fait 100 + 10%, on veut 110
            let processed = calcExpr.replace(/(\d+)\s*\+\s*(\d+)%/g, "($1*1.($2/100))"); 
            // Simplifié pour le moteur JS
            let result = eval(calcExpr.replace('×', '*').replace('÷', '/'));
            display.value = Number(result.toFixed(8));
            exprDiv.innerText = calcExpr + " =";
            calcExpr = result.toString();
        } catch {
            display.value = "Erreur";
        }
    } else if (val === '%') {
        // Pourcentage simple : divise par 100
        calcExpr = (eval(calcExpr) / 100).toString();
        display.value = calcExpr;
    } else {
        calcExpr += val;
        display.value = calcExpr;
    }
}

function handleGlobalKey(e) {
    const activePage = document.querySelector('.page.active').id;
    if (activePage !== 'calculator') return;

    if (e.key >= '0' && e.key <= '9' || ['+', '-', '*', '/', '.', '(', ')'].includes(e.key)) handleCalc(e.key);
    if (e.key === 'Enter') handleCalc('=');
    if (e.key === 'Backspace') handleCalc('DEL');
    if (e.key === 'Escape') handleCalc('AC');
}

/* --- UNITÉS (Détails augmentés) --- */
const UNITS = {
    "Longueur": { m: "Mètre", km: "Kilomètre", cm: "Centimètre", mm: "Millimètre", in: "Pouce", ft: "Pied" },
    "Masse": { kg: "Kilogramme", g: "Gramme", lb: "Livre (lb)", oz: "Once (oz)" },
    "Température": { c: "Celsius", f: "Fahrenheit", k: "Kelvin" }
};

function initConverter() {
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    
    // Remplissage avec détails
    let options = "";
    for (let cat in UNITS) {
        options += `<optgroup label="${cat}">`;
        for (let code in UNITS[cat]) {
            options += `<option value="${code}">${UNITS[cat][code]} (${code})</option>`;
        }
        options += `</optgroup>`;
    }
    from.innerHTML = options;
    to.innerHTML = options;
}

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

function initTheme() {
    const apply = (t) => document.body.setAttribute('data-theme', t);
    apply(state.theme);
}

function initSettings() {
    document.getElementById('theme-select').value = state.theme;
    document.getElementById('theme-select').addEventListener('change', (e) => {
        state.theme = e.target.value;
        localStorage.setItem('u-theme', state.theme);
        document.body.setAttribute('data-theme', state.theme);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser toutes les données ?")) {
            localStorage.clear();
            location.reload();
        }
    });
}

function initDateCalc() {
    const start = document.getElementById('date-start');
    const end = document.getElementById('date-end');
    const res = document.getElementById('date-result');

    const calc = () => {
        if(!start.value || !end.value) return;
        const d1 = new Date(start.value);
        const d2 = new Date(end.value);
        const diff = Math.abs(d2 - d1);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        res.innerHTML = `<strong>${days} jours</strong> d'écart`;
    };
    start.addEventListener('input', calc);
    end.addEventListener('input', calc);
}

function initCurrency() {
    // API simple simulation / Integration
    const indicator = document.getElementById('api-indicator');
    fetch('https://open.er-api.com/v6/latest/EUR')
        .then(r => r.json())
        .then(() => {
            indicator.style.background = "#30D158";
            document.getElementById('currency-msg').innerText = "API en ligne";
        })
        .catch(() => {
            indicator.style.background = "#FF3B30";
            document.getElementById('currency-msg').innerText = "API hors ligne";
        });
}