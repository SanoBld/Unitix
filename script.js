/* --- ETAT GLOBAL --- */
const state = {
    theme: localStorage.getItem('ux-theme') || 'auto',
    color: localStorage.getItem('ux-color') || '#007AFF',
    haptic: localStorage.getItem('ux-haptic') !== 'false',
    notepad: localStorage.getItem('ux-notepad') === 'true',
    wakeLock: localStorage.getItem('ux-wake') === 'true',
    calcMode: 'standard', // 'standard' ou 'scientific'
    rates: {} // Cache devises
};

let wakeLockSentinel = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSettings();
    initNavigation();
    initNotepad();
    initConverter();
    initCurrency();
    initCalculator();
    initDateCalc();
    applyWakeLock();

    // Listener Système Thème
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'auto') initTheme();
    });
});

/* --- UTILITAIRES --- */
const vibrate = () => {
    // Vibre seulement sur mobile (détection sommaire) et si activé
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (state.haptic && isMobile && navigator.vibrate) {
        navigator.vibrate(10);
    }
};

const showToast = (msg) => {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2000);
};

const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        vibrate();
        showToast("Copié !");
    });
};

/* --- THEME & WAKE LOCK --- */
function initTheme() {
    let effectiveTheme = state.theme;
    if (state.theme === 'auto') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.setAttribute('data-theme', effectiveTheme);
    document.documentElement.style.setProperty('--primary', state.color);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = effectiveTheme === 'dark' ? '#000000' : '#F5F5F7';
}

async function applyWakeLock() {
    if (state.wakeLock && 'wakeLock' in navigator) {
        try {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (err) { console.log('Wake Lock error:', err); }
    } else if (!state.wakeLock && wakeLockSentinel) {
        wakeLockSentinel.release();
        wakeLockSentinel = null;
    }
}

/* --- REGLAGES --- */
function initSettings() {
    // Thème
    const ts = document.getElementById('theme-select');
    ts.value = state.theme;
    ts.addEventListener('change', (e) => {
        state.theme = e.target.value;
        localStorage.setItem('ux-theme', state.theme);
        initTheme();
    });

    // Couleurs
    document.querySelectorAll('.color-opt').forEach(opt => {
        if(opt.dataset.color === state.color) opt.classList.add('active');
        opt.addEventListener('click', () => {
            vibrate();
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.color = opt.dataset.color;
            localStorage.setItem('ux-color', state.color);
            initTheme();
        });
    });

    // Switches
    setupSwitch('toggle-haptic', 'haptic', 'ux-haptic');
    setupSwitch('toggle-notepad', 'notepad', 'ux-notepad', initNotepad);
    setupSwitch('toggle-wake', 'wakeLock', 'ux-wake', applyWakeLock);

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser toutes les données ?")) {
            localStorage.clear();
            location.reload();
        }
    });
}

function setupSwitch(id, stateKey, storageKey, callback) {
    const el = document.getElementById(id);
    if(!el) return;
    el.checked = state[stateKey];
    el.addEventListener('change', (e) => {
        state[stateKey] = e.target.checked;
        localStorage.setItem(storageKey, state[stateKey]);
        if(callback) callback();
    });
}

/* --- NAVIGATION & NOTEPAD --- */
function initNavigation() {
    const btns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            
            pages.forEach(p => {
                if(p.id === target) {
                    p.style.display = 'block';
                    setTimeout(() => p.classList.add('active'), 10);
                } else {
                    p.classList.remove('active');
                    setTimeout(() => p.style.display = 'none', 300);
                }
            });
        });
    });

    // Auto copy inputs
    document.querySelectorAll('.copyable').forEach(el => {
        el.addEventListener('click', () => copyToClipboard(el.value));
    });
}

function initNotepad() {
    const container = document.getElementById('notepad-container');
    const area = document.getElementById('notepad-area');
    
    if (state.notepad) {
        container.style.display = 'block';
        area.value = localStorage.getItem('ux-notepad-content') || "";
        area.addEventListener('input', () => {
            localStorage.setItem('ux-notepad-content', area.value);
        });
    } else {
        container.style.display = 'none';
    }
}

/* --- CONVERTISSEUR (Unifié) --- */
const UNITS = {
    "Longueur": { base: "m", units: { m:1, km:1000, cm:0.01, mm:0.001, in:0.0254, ft:0.3048, mi:1609.34 } },
    "Masse": { base: "g", units: { g:1, kg:1000, mg:0.001, lb:453.592, oz:28.3495 } },
    "Température": { base: "c", special: true, units: { c:"Celsius", f:"Fahrenheit", k:"Kelvin" } },
    "Volume": { base: "l", units: { l:1, ml:0.001, gal:3.785, fl_oz:0.02957 } },
    "Vitesse": { base: "mps", units: { mps:1, kmh:0.2777, mph:0.4470, kn:0.5144 } }
};

function initConverter() {
    const catBtns = document.querySelectorAll('.cat-btn');
    const fromSel = document.getElementById('unit-from');
    const toSel = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    
    let currentCat = "Longueur";

    function populateSelects() {
        const data = UNITS[currentCat].units;
        const opts = Object.keys(data).map(k => `<option value="${k}">${k}</option>`).join('');
        fromSel.innerHTML = opts;
        toSel.innerHTML = opts;
        // Defaults
        if(currentCat === "Longueur") { fromSel.value="m"; toSel.value="km"; }
        if(currentCat === "Température") { fromSel.value="c"; toSel.value="f"; }
        calculate();
    }

    function calculate() {
        const val = parseFloat(input.value);
        if(isNaN(val)) { output.value = ""; return; }
        
        const u1 = fromSel.value;
        const u2 = toSel.value;
        let res = 0;

        if(UNITS[currentCat].special) { // Temp
            let c = val;
            if(u1 === 'f') c = (val - 32) * 5/9;
            if(u1 === 'k') c = val - 273.15;
            if(u2 === 'c') res = c;
            if(u2 === 'f') res = (c * 9/5) + 32;
            if(u2 === 'k') res = c + 273.15;
        } else {
            const base = val * UNITS[currentCat].units[u1];
            res = base / UNITS[currentCat].units[u2];
        }
        
        output.value = parseFloat(res.toFixed(6));
    }

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCat = btn.dataset.cat;
            populateSelects();
        });
    });

    input.addEventListener('input', calculate);
    fromSel.addEventListener('change', calculate);
    toSel.addEventListener('change', calculate);
    document.getElementById('btn-swap-unit').addEventListener('click', () => {
        vibrate();
        const tmp = fromSel.value; fromSel.value = toSel.value; toSel.value = tmp;
        calculate();
    });

    populateSelects();
}

/* --- DEVISES (API) --- */
async function initCurrency() {
    const fromSel = document.getElementById('curr-from');
    const toSel = document.getElementById('curr-to');
    const input = document.getElementById('curr-input');
    const output = document.getElementById('curr-output');
    const info = document.getElementById('curr-rate-info');
    
    // Liste courante
    const currs = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY"];
    const opts = currs.map(c => `<option value="${c}">${c}</option>`).join('');
    fromSel.innerHTML = opts; toSel.innerHTML = opts;
    toSel.value = "USD";

    async function fetchRates() {
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/EUR');
            const data = await res.json();
            state.rates = data.rates;
            calcCurr();
        } catch(e) {
            info.innerText = "Erreur de connexion";
        }
    }

    function calcCurr() {
        if(!state.rates.EUR) return;
        const amount = parseFloat(input.value);
        if(isNaN(amount)) { output.value = ""; return; }
        
        const base = state.rates[fromSel.value];
        const target = state.rates[toSel.value];
        
        // Convertir en EUR puis vers cible (car base API est EUR)
        const inEur = amount / base;
        const res = inEur * target;
        
        output.value = res.toFixed(2);
        info.innerText = `1 ${fromSel.value} = ${(target/base).toFixed(4)} ${toSel.value}`;
    }

    input.addEventListener('input', calcCurr);
    fromSel.addEventListener('change', calcCurr);
    toSel.addEventListener('change', calcCurr);
    document.getElementById('btn-swap-curr').addEventListener('click', () => {
        vibrate();
        const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t;
        calcCurr();
    });

    await fetchRates();
}

/* --- CALCULATRICE WINDOWS LIKE --- */
let calcData = {
    curr: "0",
    prev: null,
    op: null,
    hist: [],
    newNumber: true // Si true, le prochain chiffre remplace curr
};

function initCalculator() {
    const grid = document.getElementById('calc-grid');
    const display = document.getElementById('calc-display');
    const preview = document.getElementById('calc-preview');
    const histList = document.getElementById('calc-history-list');

    // Layout Buttons
    const buttons = [
        // Ligne 1 (Sci)
        { t:'x²', c:'sci', act:'sqr' }, { t:'π', c:'sci', act:'pi' }, { t:'e', c:'sci', act:'e' }, { t:'C', c:'fn', act:'C' }, { t:'⌫', c:'fn', act:'back' },
        // Ligne 2
        { t:'x³', c:'sci', act:'cube' }, { t:'1/x', c:'sci', act:'inv' }, { t:'|x|', c:'sci', act:'abs' }, { t:'(', c:'sci', act:'(' }, { t:')', c:'sci', act:')' },
        // Ligne 3
        { t:'√', c:'sci', act:'sqrt' }, { t:'sin', c:'sci', act:'sin' }, { t:'cos', c:'sci', act:'cos' }, { t:'tan', c:'sci', act:'tan' }, { t:'n!', c:'sci', act:'fact' },
        // Standard Grid starts here (integrated visually)
        { t:'CE', c:'fn', act:'CE' }, { t:'C', c:'fn', act:'C' }, { t:'⌫', c:'fn', act:'back' }, { t:'÷', c:'op', act:'/' },
        { t:'7', c:'num', act:'num' }, { t:'8', c:'num', act:'num' }, { t:'9', c:'num', act:'num' }, { t:'×', c:'op', act:'*' },
        { t:'4', c:'num', act:'num' }, { t:'5', c:'num', act:'num' }, { t:'6', c:'num', act:'num' }, { t:'-', c:'op', act:'-' },
        { t:'1', c:'num', act:'num' }, { t:'2', c:'num', act:'num' }, { t:'3', c:'num', act:'num' }, { t:'+', c:'op', act:'+' },
        { t:'+/-', c:'num', act:'sign' }, { t:'0', c:'num', act:'num' }, { t:'.', c:'num', act:'dot' }, { t:'=', c:'eq', act:'=' }
    ];
    
    // Le grid layout CSS gère l'affichage Sci vs Std
    // Pour Std, on n'affiche que les 20 derniers boutons (index > 14) mais on va simplifier
    // On va générer tout, CSS cachera les .sci
    
    grid.innerHTML = buttons.map(b => `<button class="calc-btn ${b.c}" data-act="${b.act}" data-val="${b.t}">${b.t}</button>`).join('');

    // Mode Toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            if(mode === 'scientific') grid.classList.add('scientific-layout');
            else grid.classList.remove('scientific-layout');
        });
    });

    // Logic
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        handleCalcInput(btn.dataset.act, btn.dataset.val);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if(document.getElementById('calculator').style.display === 'none') return;
        
        const map = {
            'Enter': '=', 'Escape': 'C', 'Backspace': 'back',
            '/': '/', '*': '*', '-': '-', '+': '+', '.': 'dot'
        };
        
        if(!isNaN(e.key)) handleCalcInput('num', e.key);
        else if(map[e.key]) handleCalcInput(map[e.key], null);
        else if(e.key === 's') handleCalcInput('sin', null); // raccourci exemple
    });

    function handleCalcInput(action, val) {
        vibrate();
        
        switch(action) {
            case 'num':
                if (calcData.newNumber) {
                    calcData.curr = val;
                    calcData.newNumber = false;
                } else {
                    if (calcData.curr === "0") calcData.curr = val;
                    else calcData.curr += val;
                }
                break;
            case 'dot':
                if(calcData.newNumber) { calcData.curr = "0."; calcData.newNumber = false; }
                else if(!calcData.curr.includes('.')) calcData.curr += ".";
                break;
            case 'op':
                if(calcData.op && !calcData.newNumber) {
                    calculate(); // Chaine d'opérations
                }
                calcData.prev = calcData.curr;
                calcData.op = val || getOpFromAct(action); // si val null (keyboard)
                calcData.newNumber = true;
                break;
            case '=':
                calculate();
                calcData.op = null;
                calcData.newNumber = true;
                break;
            case 'C':
                calcData.curr = "0"; calcData.prev = null; calcData.op = null; calcData.newNumber = true;
                break;
            case 'CE':
                calcData.curr = "0";
                break;
            case 'back':
                if(calcData.curr.length > 1) calcData.curr = calcData.curr.slice(0, -1);
                else calcData.curr = "0";
                break;
            case 'sign':
                calcData.curr = (parseFloat(calcData.curr) * -1).toString();
                break;
            // Scientific / Unary
            case 'sqr': unaryOp(x => x*x); break;
            case 'sqrt': unaryOp(Math.sqrt); break;
            case 'sin': unaryOp(x => Math.sin(x)); break;
            case 'cos': unaryOp(x => Math.cos(x)); break;
            case 'tan': unaryOp(x => Math.tan(x)); break;
            case 'inv': unaryOp(x => 1/x); break;
            case 'pi': calcData.curr = Math.PI.toString(); calcData.newNumber = false; break;
        }

        // Logic Pourcentage Windows style
        // Si on a "100 +", et qu'on tape "10", puis "%" -> ça calcule 10% de 100 (10).
        // L'utilisateur verra "10" s'afficher. Au "=" suivant, 100+10=110.
        // Ici on simplifie : le bouton % n'est pas dans la liste par défaut mais si on l'ajoutait :
        if(val === '%') {
             if(calcData.op && calcData.prev) {
                 const base = parseFloat(calcData.prev);
                 const pct = parseFloat(calcData.curr);
                 const res = base * (pct/100);
                 calcData.curr = res.toString();
             } else {
                 calcData.curr = (parseFloat(calcData.curr)/100).toString();
             }
        }

        updateUI();
    }

    function calculate() {
        if(!calcData.op || calcData.prev === null) return;
        const a = parseFloat(calcData.prev);
        const b = parseFloat(calcData.curr);
        let res = 0;
        
        // Mapping visuel vers JS
        const opMap = {'×':'*', '÷':'/', '+':'+', '-':'-'};
        const jsOp = opMap[calcData.op] || calcData.op;

        if(jsOp === '+') res = a + b;
        if(jsOp === '-') res = a - b;
        if(jsOp === '*') res = a * b;
        if(jsOp === '/') res = a / b;

        // Historique
        addToHistory(`${a} ${calcData.op} ${b} = ${res}`);
        
        calcData.curr = res.toString();
        calcData.prev = null;
    }

    function unaryOp(func) {
        const v = parseFloat(calcData.curr);
        const res = func(v);
        calcData.curr = res.toString();
        calcData.newNumber = true;
    }

    function updateUI() {
        display.value = calcData.curr;
        if(calcData.op && calcData.prev) {
            preview.innerText = `${calcData.prev} ${calcData.op}`;
        } else {
            preview.innerText = "";
        }
    }

    function addToHistory(str) {
        const div = document.createElement('div');
        div.className = 'hist-item';
        div.innerText = str;
        histList.insertBefore(div, histList.firstChild);
    }
}

/* --- CALCUL DATE --- */
function initDateCalc() {
    const start = document.getElementById('date-start');
    const end = document.getElementById('date-end');
    const btn = document.getElementById('btn-calc-date');
    
    // Default today
    const today = new Date().toISOString().split('T')[0];
    start.value = today;
    end.value = today;

    btn.addEventListener('click', () => {
        vibrate();
        const d1 = new Date(start.value);
        const d2 = new Date(end.value);
        
        if(!start.value || !end.value) return;

        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Calcul détaillé Y/M/D (approximatif pour UX)
        let y = d2.getFullYear() - d1.getFullYear();
        let m = d2.getMonth() - d1.getMonth();
        let d = d2.getDate() - d1.getDate();

        if (d < 0) { m--; d += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        
        // Si d2 < d1, on inverse juste l'affichage en absolu
        if(d1 > d2) {
             // Recalcul simple inversé pour affichage propre
             // (Logic simplified for demo)
        }

        document.getElementById('res-years').innerText = Math.abs(y);
        document.getElementById('res-months').innerText = Math.abs(m);
        document.getElementById('res-days').innerText = Math.abs(d);
        document.getElementById('res-total-days').innerText = `(Total : ${diffDays} jours)`;
    });
}