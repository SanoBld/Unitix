// --- ÉTAT GLOBAL & CONFIG ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    accent: localStorage.getItem('u-accent') || '#007AFF',
    haptic: localStorage.getItem('u-haptic') !== 'false', // Default true
    history: JSON.parse(localStorage.getItem('u-history')) || { unit: [], currency: [] }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    applyAccent(state.accent);
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
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(n);
};

const vibrate = () => {
    if (state.haptic && navigator.vibrate) navigator.vibrate(10);
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
            vibrate();
        });
    });

    // Accent
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.accent = dot.dataset.color;
            localStorage.setItem('u-accent', state.accent);
            applyAccent(state.accent);
            vibrate();
        });
    });

    // Haptique
    document.getElementById('toggle-haptic').addEventListener('change', (e) => {
        state.haptic = e.target.checked;
        localStorage.setItem('u-haptic', state.haptic);
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser l'application ? Toutes vos données seront perdues.")) {
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
            vibrate();
        });
    });
}

/* --- CONVERTISSEUR PRO --- */
// Base des conversions (valeur * facteur = base)
const unitData = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254, nm: 1e-9 },
    mass: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.453592, oz: 0.0283495, st: 6.35029 },
    volume: { l: 1, ml: 0.001, cl: 0.01, m3: 1000, gal: 3.78541, pt: 0.473176 },
    speed: { "km/h": 1, mph: 1.60934, "m/s": 3.6, kn: 1.852, "mach": 1234.8 },
    pressure: { Pa: 1, hPa: 100, bar: 100000, psi: 6894.76, atm: 101325 },
    energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, BTU: 1055.06 },
    angle: { deg: 1, rad: 57.2958, grad: 0.9 },
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

    // Initial Population
    const updateOptions = () => {
        const type = cat.value;
        let units = [];
        if (type === 'temperature') units = ['Celsius', 'Fahrenheit', 'Kelvin'];
        else units = Object.keys(unitData[type]);
        
        const html = units.map(u => `<option value="${u}">${u}</option>`).join('');
        from.innerHTML = html;
        to.innerHTML = html;
        to.selectedIndex = 1; // Select second option by default
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
            // Convert to base then to target
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
    document.getElementById('btn-swap-unit').addEventListener('click', () => {
        const temp = from.value; from.value = to.value; to.value = temp;
        calculate(); vibrate();
    });

    updateOptions();
}

/* --- DEVISES --- */
async function initCurrency() {
    // Similaire à avant, mais optimisé
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    
    // Liste plus complète
    const codes = ["EUR","USD","GBP","JPY","CHF","CAD","AUD","CNY","HKD","NZD","SEK","KRW","SGD","NOK","MXN","INR","RUB","ZAR","TRY","BRL","TWD","DKK","PLN","THB","IDR","HUF","CZK","ILS","CLP","PHP","AED","COP","SAR","MYR","RON"];
    
    const opts = codes.sort().map(c => `<option value="${c}">${c}</option>`).join('');
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
            document.getElementById('api-details').innerText = 'Erreur réseau';
        }
    };

    const convert = () => {
        if(!rates) return;
        const val = parseFloat(input.value);
        const from = document.getElementById('currency-from').value;
        const to = document.getElementById('currency-to').value;
        if(isNaN(val)) return;
        
        const res = (val / rates[from]) * rates[to];
        output.value = formatNumber(res.toFixed(2));
    };

    [input, document.getElementById('currency-from'), document.getElementById('currency-to')].forEach(e => e.addEventListener('input', convert));
    
    document.getElementById('btn-swap-currency').addEventListener('click', () => {
        const f = document.getElementById('currency-from');
        const t = document.getElementById('currency-to');
        const temp = f.value; f.value = t.value; t.value = temp;
        convert(); vibrate();
    });

    fetchRates();
}

/* --- CALCULATRICE SCIENTIFIQUE --- */
function initCalculator() {
    const currentEl = document.getElementById('calc-current');
    const exprEl = document.getElementById('calc-expr');
    const tapeEl = document.getElementById('calc-tape');
    let current = '0';
    let previous = '';
    let operation = null;
    let resetNext = false;

    // Toggle Scientific
    document.getElementById('toggle-sci').addEventListener('click', function() {
        document.getElementById('calculator').classList.toggle('scientific');
        this.classList.toggle('active');
        vibrate();
    });

    const updateDisplay = () => {
        currentEl.innerText = formatNumber(current) || '0';
        exprEl.innerText = previous + (operation ? ` ${operation}` : '');
    };

    const appendNumber = (num) => {
        if(resetNext) { current = ''; resetNext = false; }
        if(num === '.' && current.includes('.')) return;
        if(current === '0' && num !== '.') current = num;
        else current += num;
        updateDisplay();
    };

    const chooseOp = (op) => {
        if(current === '') return;
        if(previous !== '') compute();
        operation = op;
        previous = current;
        resetNext = true;
        updateDisplay();
    };

    const compute = () => {
        let computation;
        const prev = parseFloat(previous);
        const curr = parseFloat(current);
        if(isNaN(prev) || isNaN(curr)) return;

        switch(operation) {
            case '+': computation = prev + curr; break;
            case '-': computation = prev - curr; break;
            case '*': computation = prev * curr; break;
            case '/': computation = prev / curr; break;
        }

        addToTape(`${formatNumber(prev)} ${operation} ${formatNumber(curr)} = ${formatNumber(computation)}`);
        current = computation.toString();
        operation = null;
        previous = '';
        resetNext = true;
        updateDisplay();
    };

    const scientificOp = (fn) => {
        const val = parseFloat(current);
        if(isNaN(val)) return;
        let res = 0;
        
        switch(fn) {
            case 'sin': res = Math.sin(val * Math.PI / 180); break; // Deg
            case 'cos': res = Math.cos(val * Math.PI / 180); break;
            case 'tan': res = Math.tan(val * Math.PI / 180); break;
            case 'log': res = Math.log10(val); break;
            case 'ln':  res = Math.log(val); break;
            case 'sqrt': res = Math.sqrt(val); break;
            case 'pow': res = Math.pow(val, 2); break;
            case 'pi': res = Math.PI; break;
        }
        
        current = res.toString();
        resetNext = true;
        updateDisplay();
    };

    const addToTape = (str) => {
        const line = document.createElement('div');
        line.innerText = str;
        tapeEl.prepend(line); // Ajoute en haut
        if(tapeEl.children.length > 4) tapeEl.lastChild.remove();
    };

    // Events Click
    document.querySelector('.calculator-wrapper').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        
        const key = btn.dataset.key;
        const fn = btn.dataset.fn;
        
        if(key) {
            vibrate();
            if(!isNaN(key) || key === '.') appendNumber(key);
            else if(['+','-','*','/'].includes(key)) chooseOp(key);
            else if(key === '=') compute();
            else if(key === 'AC') { current='0'; previous=''; operation=null; updateDisplay(); }
            else if(key === 'DEL') { current = current.slice(0,-1) || '0'; updateDisplay(); }
            else if(key === '%') { current = (parseFloat(current)/100).toString(); updateDisplay(); }
        } else if(fn) {
            vibrate();
            scientificOp(fn);
        }
    });

    // Events Clavier Physique
    document.addEventListener('keydown', (e) => {
        if(!document.getElementById('calc-panel').classList.contains('active')) return;
        
        const key = e.key;
        if((key >= '0' && key <= '9') || key === '.') appendNumber(key);
        if(['+','-','*','/'].includes(key)) chooseOp(key);
        if(key === 'Enter' || key === '=') { e.preventDefault(); compute(); }
        if(key === 'Backspace') { current = current.slice(0,-1) || '0'; updateDisplay(); }
        if(key === 'Escape') { current='0'; previous=''; operation=null; updateDisplay(); }
    });
}

/* --- NOTES & PARTAGE --- */
function initNotes() {
    const pad = document.getElementById('note-pad');
    const status = document.getElementById('save-status');
    pad.value = localStorage.getItem('u-note') || '';

    pad.addEventListener('input', () => {
        localStorage.setItem('u-note', pad.value);
        status.innerText = "Sauvegarde...";
        setTimeout(() => status.innerText = "Synchronisé", 800);
    });

    document.getElementById('copy-note').addEventListener('click', () => {
        navigator.clipboard.writeText(pad.value);
        status.innerText = "Copié !";
        vibrate();
        setTimeout(() => status.innerText = "Synchronisé", 2000);
    });

    document.getElementById('share-note').addEventListener('click', async () => {
        if(navigator.share) {
            try {
                await navigator.share({
                    title: 'Mes Notes Unitix',
                    text: pad.value
                });
            } catch(e) { console.log('Share cancel'); }
        } else {
            alert("Le partage n'est pas supporté sur ce navigateur.");
        }
    });
    
    document.getElementById('download-note').addEventListener('click', () => {
        const blob = new Blob([pad.value], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.txt';
        a.click();
    });
}