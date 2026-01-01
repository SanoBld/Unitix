// --- ENREGISTREMENT SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Unitix SW Registered'))
        .catch(err => console.error('SW Error:', err));
}

// --- ÉTAT GLOBAL & CONFIG ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    accent: localStorage.getItem('u-accent') || '#007AFF',
    haptic: localStorage.getItem('u-haptic') !== 'false', // Default true
    sidebar: localStorage.getItem('u-sidebar') === 'true'
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    applyAccent(state.accent);
    if(state.sidebar) document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('toggle-haptic').checked = state.haptic;
    
    initNavigation();
    initSettings();
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();
});

/* --- UTILITAIRES --- */
const formatNumber = (num) => {
    if (num === '' || num === null) return '';
    const n = parseFloat(num);
    if (isNaN(n)) return 'Erreur';
    // Évite les 0.300000004
    return parseFloat(n.toFixed(10)).toString(); 
};

// --- RETOUR HAPTIQUE AVANCÉ ---
const vibrate = (type = 'click') => {
    if (!state.haptic || !navigator.vibrate) return;
    
    const patterns = {
        click: 10,
        success: [10, 30, 10],
        error: [50, 30, 50]
    };

    navigator.vibrate(patterns[type] || 10);
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
    document.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('active', d.dataset.color === color);
    });
}

function initSettings() {
    // Thème
    document.querySelectorAll('.seg-btn').forEach(btn => {
        if(btn.dataset.mode === state.theme) btn.classList.add('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.mode;
            localStorage.setItem('u-theme', state.theme);
            applyTheme(state.theme);
            vibrate('click');
        });
    });

    // Accent
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.accent = dot.dataset.color;
            localStorage.setItem('u-accent', state.accent);
            applyAccent(state.accent);
            vibrate('success');
        });
    });

    // Haptique
    document.getElementById('toggle-haptic').addEventListener('change', (e) => {
        state.haptic = e.target.checked;
        localStorage.setItem('u-haptic', state.haptic);
        if(state.haptic) vibrate('success');
    });

    // Sidebar
    document.getElementById('collapse-btn').addEventListener('click', () => {
        const bar = document.getElementById('sidebar');
        bar.classList.toggle('collapsed');
        state.sidebar = bar.classList.contains('collapsed');
        localStorage.setItem('u-sidebar', state.sidebar);
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser l'application ?")) {
            localStorage.clear();
            vibrate('error');
            setTimeout(() => location.reload(), 200);
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
            
            const target = document.getElementById(btn.dataset.target);
            target.style.display = 'block';
            setTimeout(() => target.classList.add('active'), 10);
            
            vibrate('click');
        });
    });
}

/* --- CONVERTISSEUR PRO & FILTRES --- */
const unitData = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
    mass: { kg: 1, g: 0.001, t: 1000, lb: 0.453592, oz: 0.0283495 },
    volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541, pt: 0.473176 },
    speed: { "km/h": 1, mph: 1.60934, "m/s": 3.6, kn: 1.852 },
    pressure: { Pa: 1, bar: 100000, psi: 6894.76, atm: 101325 },
    energy: { J: 1, cal: 4.184, kWh: 3.6e6 },
    angle: { deg: 1, rad: 57.2958 },
    data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
    cooking: { ml: 1, tsp: 4.92, tbsp: 14.78, cup: 236.58, fl_oz: 29.57 },
    temperature: { type: 'special' }
};

function initUnits() {
    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const search = document.getElementById('unit-search');

    const updateOptions = () => {
        const type = cat.value;
        let units = [];
        if (type === 'temperature') units = ['Celsius', 'Fahrenheit', 'Kelvin'];
        else units = Object.keys(unitData[type]);
        
        const html = units.map(u => `<option value="${u}">${u}</option>`).join('');
        from.innerHTML = html;
        to.innerHTML = html;
        to.selectedIndex = 1;
        search.value = '';
        filterUnits(''); 
        calculate();
    };

    // --- RECHERCHE DYNAMIQUE ---
    const filterUnits = (query) => {
        const q = query.toLowerCase();
        [from, to].forEach(select => {
            Array.from(select.options).forEach(opt => {
                const match = opt.value.toLowerCase().includes(q);
                // Utilisation de hidden et display pour compatibilité max
                opt.hidden = !match;
                opt.style.display = match ? 'block' : 'none';
            });
            // Resélectionne le premier élément visible si la sélection actuelle est masquée
            if(select.selectedOptions.length > 0 && select.selectedOptions[0].hidden) {
                const firstVisible = Array.from(select.options).find(o => !o.hidden);
                if(firstVisible) select.value = firstVisible.value;
            }
        });
        calculate();
    };

    const calculate = () => {
        let val = parseFloat(input.value.replace(',', '.'));
        if(isNaN(val)) { output.value = ''; return; }

        const type = cat.value;
        const uFrom = from.value;
        const uTo = to.value;
        let res;

        if(type === 'temperature') {
            res = convertTemp(val, uFrom, uTo);
        } else {
            const rates = unitData[type];
            const base = val * rates[uFrom]; 
            res = base / rates[uTo];
        }
        output.value = formatNumber(res);
    };

    const convertTemp = (v, f, t) => {
        let k;
        if(f === 'Celsius') k = v + 273.15;
        else if(f === 'Fahrenheit') k = (v - 32) * 5/9 + 273.15;
        else k = v;
        if(t === 'Celsius') return k - 273.15;
        if(t === 'Fahrenheit') return (k - 273.15) * 9/5 + 32;
        return k;
    };

    cat.addEventListener('change', updateOptions);
    input.addEventListener('input', calculate);
    from.addEventListener('change', calculate);
    to.addEventListener('change', calculate);
    
    search.addEventListener('input', (e) => filterUnits(e.target.value));

    document.getElementById('btn-swap-unit').addEventListener('click', () => {
        const temp = from.value; from.value = to.value; to.value = temp;
        calculate(); vibrate('click');
    });

    updateOptions();
}

/* --- DEVISES --- */
async function initCurrency() {
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const codes = ["EUR","USD","GBP","JPY","CHF","CAD","AUD","CNY"]; // Liste abrégée pour l'exemple
    
    const opts = codes.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('currency-from').innerHTML = opts;
    document.getElementById('currency-to').innerHTML = opts;
    document.getElementById('currency-to').value = 'USD';

    let rates = null;
    const fetchRates = async () => {
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/EUR');
            const data = await res.json();
            rates = data.rates;
            document.getElementById('api-status-dot').style.background = '#30D158';
            document.getElementById('api-details').innerText = 'À jour';
            convert();
        } catch(e) {
            document.getElementById('api-status-dot').style.background = '#FF3B30';
            document.getElementById('api-details').innerText = 'Offline';
        }
    };

    const convert = () => {
        if(!rates) return;
        const val = parseFloat(input.value);
        if(isNaN(val)) return;
        const res = (val / rates[document.getElementById('currency-from').value]) * rates[document.getElementById('currency-to').value];
        output.value = res.toFixed(2);
    };

    [input, document.getElementById('currency-from'), document.getElementById('currency-to')].forEach(e => e.addEventListener('input', convert));
    fetchRates();
}

/* --- CALCULATRICE : PEMDAS & DÉCIMALES --- */
function initCalculator() {
    const currentEl = document.getElementById('calc-current');
    const exprEl = document.getElementById('calc-expr');
    let expression = ''; // Chaîne brute pour l'eval (ex: "2+2*5")
    let displayVal = '0'; // Affichage utilisateur
    let resetNext = false;

    // Toggle Mode
    document.getElementById('toggle-sci').addEventListener('click', function() {
        document.getElementById('calculator').classList.toggle('scientific');
        this.classList.toggle('active');
        vibrate('click');
    });

    // Animation Effect
    const triggerAnim = () => {
        currentEl.classList.remove('pop-anim');
        void currentEl.offsetWidth; // Trigger reflow
        currentEl.classList.add('pop-anim');
    };

    const updateDisplay = () => {
        currentEl.innerText = displayVal;
        exprEl.innerText = expression.replace(/\*/g, '×').replace(/\//g, '÷').replace('Math.', '');
        triggerAnim();
    };

    const addToExpr = (val) => {
        if(resetNext) {
            expression = '';
            displayVal = '';
            resetNext = false;
        }
        // Évite double opérateurs
        const lastChar = expression.slice(-1);
        if(['+','-','*','/'].includes(val) && ['+','-','*','/'].includes(lastChar)) {
            expression = expression.slice(0, -1) + val;
        } else {
            expression += val;
            if(['+','-','*','/'].includes(val)) displayVal = '';
            else displayVal = (displayVal === '0' ? val : displayVal + val);
        }
        updateDisplay();
    };

    const safeCalculate = () => {
        try {
            // Utilisation de Function() pour un eval scopé (respecte PEMDAS)
            // On remplace les fonctions mathématiques pour JS
            let safeExpr = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/');
                
            // Execution
            let result = new Function('return ' + safeExpr)();
            
            // Correction décimale (ex: 0.1+0.2 -> 0.3)
            // .toPrecision(12) nettoie les queues de flottants, parseFloat supprime les zéros inutiles
            result = parseFloat(parseFloat(result).toPrecision(12));

            displayVal = result.toString();
            expression = result.toString(); // On garde le résultat pour enchainer
            resetNext = true;
            updateDisplay();
            vibrate('success');
        } catch (e) {
            displayVal = 'Erreur';
            expression = '';
            updateDisplay();
            vibrate('error');
        }
    };

    const mathFunc = (fn) => {
        if(resetNext) { expression = displayVal; resetNext = false; }
        
        let val = parseFloat(displayVal || expression);
        if(isNaN(val)) return;

        let snippet = '';
        if(fn === 'sin') snippet = `Math.sin(${val} * Math.PI / 180)`;
        else if(fn === 'cos') snippet = `Math.cos(${val} * Math.PI / 180)`;
        else if(fn === 'tan') snippet = `Math.tan(${val} * Math.PI / 180)`;
        else if(fn === 'sqrt') snippet = `Math.sqrt(${val})`;
        else if(fn === 'log') snippet = `Math.log10(${val})`;
        else if(fn === 'ln') snippet = `Math.log(${val})`;
        else if(fn === 'pow') snippet = `Math.pow(${val}, 2)`;
        else if(fn === 'pi') { 
            val = Math.PI; 
            displayVal = val.toFixed(4); 
            expression += val; 
            updateDisplay(); 
            return;
        }

        // Remplace le dernier nombre par la fonction
        // Note: C'est une implémentation simplifiée pour le display
        expression = snippet;
        safeCalculate();
    };

    document.querySelector('.calculator-wrapper').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        
        const key = btn.dataset.key;
        const fn = btn.dataset.fn;
        
        vibrate('click');

        if(key) {
            if(key === 'AC') { expression = ''; displayVal = '0'; updateDisplay(); }
            else if(key === 'DEL') { 
                expression = expression.slice(0, -1);
                displayVal = displayVal.slice(0, -1) || '0';
                updateDisplay();
            }
            else if(key === '=') safeCalculate();
            else addToExpr(key);
        } else if(fn) {
            if(fn === '(' || fn === ')') addToExpr(fn);
            else mathFunc(fn);
        }
    });
}

function initNotes() {
    const pad = document.getElementById('note-pad');
    pad.value = localStorage.getItem('u-note') || '';
    pad.addEventListener('input', () => {
        localStorage.setItem('u-note', pad.value);
    });
    document.getElementById('copy-note').addEventListener('click', () => {
        navigator.clipboard.writeText(pad.value);
        vibrate('success');
    });
}