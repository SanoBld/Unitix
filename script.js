/* --- UNITIX V2.2 CORE --- */

const state = {
    theme: localStorage.getItem('ux-theme') || 'auto',
    haptic: localStorage.getItem('ux-haptic') !== 'false',
    showNotes: localStorage.getItem('ux-notes') === 'true',
    wakeLock: localStorage.getItem('ux-wakelock') === 'true',
    calcMode: localStorage.getItem('ux-calc-mode') || 'std',
    history: JSON.parse(localStorage.getItem('ux-history') || '[]')
};

let wakeLockSentinel = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initConverter();
    initCurrency();
    initCalculator();
    initDateCalc();
    initSettings();
    initSystem();
});

/* --- UTILS --- */
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const vibrate = () => { if(state.haptic && isMobile() && navigator.vibrate) navigator.vibrate(10); };

function showToast(msg = "Copié !") {
    const t = document.getElementById('toast');
    t.querySelector('span').innerText = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2000);
}

function copyToClipboard(text) {
    if(!text || text === '0') return;
    navigator.clipboard.writeText(text).then(() => {
        showToast();
        vibrate();
    });
}

/* --- THEME & SYSTEM --- */
function initTheme() {
    const apply = () => {
        const root = document.documentElement;
        if(state.theme === 'auto') {
            root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', state.theme);
        }
    };
    apply();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
    
    document.querySelectorAll('.seg-item[data-theme]').forEach(btn => {
        if(btn.dataset.theme === state.theme) btn.classList.add('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-item[data-theme]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.theme;
            localStorage.setItem('ux-theme', state.theme);
            apply();
            vibrate();
        });
    });
}

async function initSystem() {
    // Wake Lock for PWA
    const applyWakeLock = async () => {
        if(state.wakeLock && 'wakeLock' in navigator) {
            try { wakeLockSentinel = await navigator.wakeLock.request('screen'); } 
            catch(err) { console.log('WakeLock error', err); }
        } else if(wakeLockSentinel) {
            wakeLockSentinel.release(); wakeLockSentinel = null;
        }
    };
    applyWakeLock();
    document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') applyWakeLock(); });
    
    // Copy Triggers
    document.querySelectorAll('.copy-trigger').forEach(el => {
        el.addEventListener('click', () => copyToClipboard(el.value || el.innerText));
    });
}

/* --- NAVIGATION --- */
function initNavigation() {
    const navs = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const layout = document.querySelector('.app-layout');
    
    navs.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            if(!targetId) return;
            navs.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            
            const target = document.getElementById(targetId);
            target.classList.add('active');
            
            // Gestion Zero Scroll pour la calculatrice mobile
            if(targetId === 'panel-calc') {
                target.classList.add('full-height-view');
                if(isMobile()) document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }

            // Reset Animation
            target.style.animation = 'none';
            target.offsetHeight; /* trigger reflow */
            target.style.animation = 'fadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            if(isMobile()) vibrate();
        });
    });
}

/* --- CALCULATOR ENGINE (WINDOWS STYLE) --- */
function initCalculator() {
    const grid = document.getElementById('calc-grid');
    const displayCurr = document.getElementById('calc-current');
    const displayPrev = document.getElementById('calc-history-prev');
    const tapeList = document.getElementById('calc-tape-list');
    const tapePanel = document.querySelector('.calc-tape-panel');
    const layout = document.querySelector('.app-layout');
    
    let buffer = '0'; // Le nombre en cours de frappe
    let stored = null; // Le nombre stocké avant l'opération
    let operator = null; // L'opérateur en attente
    let lastKeyWasOp = false;
    let resultDisplayed = false;

    // Mode Switch
    const setMode = (mode) => {
        state.calcMode = mode;
        localStorage.setItem('ux-calc-mode', mode);
        layout.setAttribute('data-calc-mode', mode); // Utilisation d'attribut pour le CSS
        document.querySelectorAll('[data-calc-mode]').forEach(b => {
            b.classList.toggle('active', b.dataset.calcMode === mode);
        });
    };
    setMode(state.calcMode);
    document.querySelectorAll('[data-calc-mode]').forEach(b => b.addEventListener('click', () => {
        setMode(b.dataset.calcMode); vibrate();
    }));

    // Update UI
    const updateUI = () => {
        let view = buffer;
        if(buffer !== 'Erreur') {
            const parts = buffer.split('.');
            parts[0] = parseFloat(parts[0]).toLocaleString('fr-FR');
            view = parts.join(','); 
        }
        displayCurr.innerText = view;
        displayPrev.innerText = (stored !== null ? `${parseFloat(stored).toLocaleString('fr-FR')} ${operatorToString(operator)}` : '');
    };

    const operatorToString = (op) => {
        switch(op) {
            case '*': return '×'; case '/': return '÷'; case 'powY': return '^'; default: return op || '';
        }
    };

    const addToTape = (text, res) => {
        const div = document.createElement('div');
        div.className = 'tape-item';
        div.innerText = `${text} = ${parseFloat(res).toLocaleString('fr-FR')}`;
        tapeList.prepend(div);
        tapePanel.classList.add('show');
    };

    const calculate = (a, b, op) => {
        const n1 = parseFloat(a);
        const n2 = parseFloat(b);
        switch(op) {
            case '+': return n1 + n2;
            case '-': return n1 - n2;
            case '*': return n1 * n2;
            case '/': return n2 === 0 ? 'Erreur' : n1 / n2;
            case 'powY': return Math.pow(n1, n2);
            default: return n2;
        }
    };

    const handleInput = (val, type, opData) => {
        vibrate();

        if (type === 'num') {
            if (resultDisplayed) { buffer = '0'; resultDisplayed = false; stored = null; operator = null; }
            if (lastKeyWasOp) { buffer = '0'; lastKeyWasOp = false; }
            
            if (val === '.') {
                if (!buffer.includes('.')) buffer += '.';
            } else if (val === 'neg') {
                buffer = (parseFloat(buffer) * -1).toString();
            } else {
                buffer = buffer === '0' ? val : buffer + val;
            }
        } 
        else if (type === 'op') {
            const op = opData;
            if (operator && !lastKeyWasOp && stored !== null) {
                const res = calculate(stored, buffer, operator);
                buffer = res.toString();
                addToTape(`${parseFloat(stored).toLocaleString()} ${operatorToString(operator)} ${parseFloat(buffer).toLocaleString()}`, buffer);
            }
            stored = buffer;
            operator = op;
            lastKeyWasOp = true;
            resultDisplayed = false;
        }
        else if (type === 'action') { // Equals
            if (operator && stored !== null) {
                const res = calculate(stored, buffer, operator);
                addToTape(`${parseFloat(stored).toLocaleString()} ${operatorToString(operator)} ${parseFloat(buffer).toLocaleString()}`, res);
                stored = null; operator = null;
                buffer = res.toString();
                resultDisplayed = true;
            }
        }
        else if (type === 'func') {
            const key = opData;
            if (key === 'AC') {
                buffer = '0'; stored = null; operator = null; resultDisplayed = false;
            } else if (key === 'DEL') {
                if(!resultDisplayed) {
                    buffer = buffer.length > 1 ? buffer.slice(0, -1) : '0';
                }
            } else if (key === 'percent') {
                // Windows Logic Stricte
                // Si operator est + ou -, % applique le pourcentage sur le nombre stocké
                // Ex: 100 + 10 % = 110 (10 devient 10)
                // Si operator est * ou /, % divise juste par 100
                if (operator === '+' || operator === '-') {
                    const base = parseFloat(stored);
                    const perc = parseFloat(buffer);
                    const val = base * (perc / 100);
                    buffer = val.toString();
                    // On ne calcule pas tout de suite, on laisse l'utilisateur voir le chiffre calculé
                } else {
                    buffer = (parseFloat(buffer) / 100).toString();
                }
            }
        }
        else if (type === 'sci') {
            const func = opData;
            const n = parseFloat(buffer);
            let res = n;
            switch(func) {
                case 'sin': res = Math.sin(n); break;
                case 'cos': res = Math.cos(n); break;
                case 'tan': res = Math.tan(n); break;
                case 'ln': res = Math.log(n); break;
                case 'log': res = Math.log10(n); break;
                case 'sqrt': res = Math.sqrt(n); break;
                case 'pow2': res = Math.pow(n, 2); break;
                case 'fact': 
                    const f = (num) => num < 0 ? NaN : (num <= 1 ? 1 : num * f(num-1));
                    res = f(Math.floor(n)); 
                    break;
            }
            buffer = res.toString();
            resultDisplayed = true;
        }
        updateUI();
    };

    // Click Events
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        
        if (btn.classList.contains('num')) handleInput(btn.dataset.key, 'num');
        if (btn.classList.contains('op')) handleInput(null, 'op', btn.dataset.key);
        if (btn.classList.contains('action')) handleInput(null, 'action');
        if (btn.classList.contains('func')) {
            if(btn.dataset.op === 'percent') handleInput(null, 'func', 'percent');
            else handleInput(null, 'func', btn.dataset.key);
        }
        if (btn.classList.contains('sci-key')) {
            if(btn.dataset.op === 'powY') handleInput(null, 'op', 'powY');
            else handleInput(null, 'sci', btn.dataset.op);
        }
    });

    // Keyboard Mapping (Physical)
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        // Seulement si la calculatrice est visible
        if(!document.getElementById('panel-calc').classList.contains('active')) return;
        
        e.preventDefault(); // Prevents defaults on calculator keys

        if (/[0-9]/.test(key)) handleInput(key, 'num');
        if (key === '.' || key === ',') handleInput('.', 'num');
        if (key === 'Enter' || key === '=') handleInput(null, 'action');
        if (key === 'Backspace') handleInput(null, 'func', 'DEL');
        if (key === 'Escape') handleInput(null, 'func', 'AC');
        if (['+','-','*','/'].includes(key)) handleInput(null, 'op', key);
        if (key === '%') handleInput(null, 'func', 'percent');
    });
}

/* --- DATE CALCULATOR --- */
function initDateCalc() {
    const startIn = document.getElementById('date-start');
    const endIn = document.getElementById('date-end');
    const btn = document.getElementById('btn-calc-date');
    const resultBox = document.getElementById('date-result');
    const txtMain = document.getElementById('date-diff-text');
    const txtSub = document.getElementById('date-diff-details');

    // Default dates
    startIn.valueAsDate = new Date();
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    endIn.valueAsDate = tmr;

    btn.addEventListener('click', () => {
        vibrate();
        const d1 = new Date(startIn.value);
        const d2 = new Date(endIn.value);
        
        if(!d1 || !d2) return;

        // Reset hours
        d1.setHours(12,0,0,0);
        d2.setHours(12,0,0,0);

        const diffTime = d2 - d1;
        const totalDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24)); 
        
        // Precise Y/M/D Calculation
        let years = d2.getFullYear() - d1.getFullYear();
        let months = d2.getMonth() - d1.getMonth();
        let days = d2.getDate() - d1.getDate();

        if (days < 0) {
            months--;
            // Jours dans le mois précédent
            days += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const isPast = diffTime < 0;
        const mainText = `${totalDays} jours`;
        
        let details = [];
        if(Math.abs(years) > 0) details.push(`${Math.abs(years)} an${Math.abs(years)>1?'s':''}`);
        if(Math.abs(months) > 0) details.push(`${Math.abs(months)} mois`);
        if(Math.abs(days) > 0) details.push(`${Math.abs(days)} jour${Math.abs(days)>1?'s':''}`);
        
        if(details.length === 0) details.push("Même jour");

        txtMain.innerText = mainText;
        txtSub.innerText = `${isPast ? 'Il y a ' : 'Dans '}${details.join(', ')}`;
        resultBox.classList.remove('hidden');
    });
}

/* --- CONVERTER & CURRENCY --- */
const UNITS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
    mass: { kg: 1, g: 0.001, t: 1000, lb: 0.453592, oz: 0.0283495 },
    volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541 },
    temperature: { type: 'special' },
    data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
    speed: { "km/h": 1, mph: 1.60934, "m/s": 3.6, kn: 1.852 },
    cooking: { ml: 1, tsp: 4.92, tbsp: 14.78, cup: 236.58 },
    pressure: { Pa: 1, bar: 100000, psi: 6894.76 },
    energy: { J: 1, cal: 4.184, kWh: 3.6e6 },
    angle: { deg: 1, rad: 57.2958 }
};

function initConverter() {
    const cat = document.getElementById('unit-category');
    const uFrom = document.getElementById('unit-from');
    const uTo = document.getElementById('unit-to');
    const uIn = document.getElementById('unit-input');
    const uOut = document.getElementById('unit-output');
    
    // Notes Logic
    const noteArea = document.getElementById('home-notes-area');
    const notePad = document.getElementById('quick-note');
    const toggleNotes = () => {
        noteArea.classList.toggle('hidden', !state.showNotes);
        notePad.value = localStorage.getItem('ux-note-content') || '';
    };
    notePad.addEventListener('input', () => localStorage.setItem('ux-note-content', notePad.value));
    window.updateNoteVisibility = toggleNotes;
    toggleNotes();

    const populate = () => {
        const type = cat.value;
        const keys = type === 'temperature' ? ['Celsius', 'Fahrenheit', 'Kelvin'] : Object.keys(UNITS[type]);
        const html = keys.map(k => `<option value="${k}">${k}</option>`).join('');
        uFrom.innerHTML = html; uTo.innerHTML = html; uTo.selectedIndex = 1;
        convert();
    };

    const convert = () => {
        const val = parseFloat(uIn.value);
        if(isNaN(val)) { uOut.value = ''; return; }
        const type = cat.value;
        const f = uFrom.value; const t = uTo.value;
        let res;

        if(type === 'temperature') {
            let k; 
            if(f==='Celsius') k=val+273.15; else if(f==='Fahrenheit') k=(val-32)*5/9+273.15; else k=val;
            if(t==='Celsius') res=k-273.15; else if(t==='Fahrenheit') res=(k-273.15)*9/5+32; else res=k;
        } else {
            res = (val * UNITS[type][f]) / UNITS[type][t];
        }
        uOut.value = parseFloat(res.toPrecision(10));
    };

    cat.addEventListener('change', populate);
    [uIn, uFrom, uTo].forEach(e => e.addEventListener('input', convert));
    document.getElementById('btn-swap-unit').addEventListener('click', () => {
        const tmp = uFrom.value; uFrom.value = uTo.value; uTo.value = tmp; convert(); vibrate();
    });
    populate();
}

function initCurrency() {
    const codes = ["EUR","USD","GBP","JPY","CHF","CAD","AUD","CNY"];
    const from = document.getElementById('curr-from');
    const to = document.getElementById('curr-to');
    const input = document.getElementById('curr-input');
    const output = document.getElementById('curr-output');
    const status = document.getElementById('currency-status');
    const statusMsg = document.getElementById('currency-msg');
    const btnRefresh = document.getElementById('btn-refresh-curr');

    from.innerHTML = to.innerHTML = codes.map(c => `<option value="${c}">${c}</option>`).join('');
    to.value = 'USD';

    let rates = null;

    const fetchRates = () => {
        statusMsg.innerText = 'Connexion...';
        status.className = 'status-badge';
        
        fetch('https://open.er-api.com/v6/latest/EUR')
        .then(r => r.json())
        .then(d => { 
            rates = d.rates; 
            status.className = 'status-badge online';
            statusMsg.innerText = 'En ligne';
            convert();
        })
        .catch(() => { 
            status.className = 'status-badge offline';
            statusMsg.innerText = 'Hors ligne';
        });
    };

    const convert = () => {
        if(!rates) return;
        const val = parseFloat(input.value);
        if(!isNaN(val)) output.value = ((val / rates[from.value]) * rates[to.value]).toFixed(2);
    };

    [input, from, to].forEach(e => e.addEventListener('input', convert));
    document.getElementById('btn-swap-curr').addEventListener('click', () => {
        const tmp = from.value; from.value = to.value; to.value = tmp; convert(); vibrate();
    });
    btnRefresh.addEventListener('click', () => {
        vibrate(); fetchRates();
    });

    fetchRates();
}

function initSettings() {
    const bindToggle = (id, prop, cb) => {
        const el = document.getElementById(id);
        el.checked = state[prop];
        el.addEventListener('change', () => {
            state[prop] = el.checked;
            localStorage.setItem(id.replace('toggle-','ux-'), state[prop]);
            if(cb) cb();
            vibrate();
        });
    };
    
    bindToggle('toggle-home-notes', 'showNotes', window.updateNoteVisibility);
    bindToggle('toggle-haptic', 'haptic');
    bindToggle('toggle-wakelock', 'wakeLock', initSystem);

    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Réinitialiser l'application ?")) { localStorage.clear(); location.reload(); }
    });
}