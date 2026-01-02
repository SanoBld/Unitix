// --- CONFIGURATION ET ETAT GLOBAL ---
let rates = null;
const units = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
    mass: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.4535, oz: 0.02835 },
    data: { o: 1, Ko: 1024, Mo: 1048576, Go: 1073741824 },
    temp: { type: 'special' }
};

// --- MODULE : MESURES ---
function initUnits() {
    const catSelect = document.getElementById('unit-category');
    const segments = document.querySelectorAll('.segment');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    if (!input) return;

    segments.forEach(seg => {
        seg.addEventListener('click', () => {
            segments.forEach(s => s.classList.remove('active'));
            seg.classList.add('active');
            catSelect.value = seg.dataset.cat;
            populate();
        });
    });

    function populate() {
        const cat = catSelect.value;
        let keys = [];
        if (cat === 'temp') keys = ['C', 'F', 'K'];
        else keys = Object.keys(units[cat]);
        const html = keys.map(k => `<option value="${k}">${k}</option>`).join('');
        from.innerHTML = html;
        to.innerHTML = html;
        to.value = keys[1] || keys[0];
        convert();
    }

    function convert() {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ''; return; }
        const cat = catSelect.value;
        const uFrom = from.value;
        const uTo = to.value;
        let res = 0;
        if (cat === 'temp') {
            let c = val;
            if (uFrom === 'F') c = (val - 32) * 5/9;
            if (uFrom === 'K') c = val - 273.15;
            if (uTo === 'C') res = c;
            else if (uTo === 'F') res = (c * 9/5) + 32;
            else if (uTo === 'K') res = c + 273.15;
        } else {
            const ratioFrom = units[cat][uFrom];
            const ratioTo = units[cat][uTo];
            res = (val * ratioFrom) / ratioTo;
        }
        output.value = (res % 1 !== 0) ? parseFloat(res.toFixed(4)) : res;
    }

    input.addEventListener('input', convert);
    from.addEventListener('change', convert);
    to.addEventListener('change', convert);
    swapBtn.addEventListener('click', () => {
        const tmp = from.value;
        from.value = to.value;
        to.value = tmp;
        convert();
        const icon = swapBtn.querySelector('i');
        icon.style.transition = '0.3s';
        icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    });
    populate();
}

// --- MODULE : DEVISES ---
async function initCurrency() {
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const status = document.getElementById('api-status');

    if (!input) return;

    const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "CNY"];
    const options = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    from.innerHTML = options;
    to.innerHTML = options;
    to.value = "USD";

    try {
        const r = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await r.json();
        rates = data.rates;
        status.innerText = "En ligne";
        status.classList.remove('offline');
        status.classList.add('online');
    } catch (e) {
        status.innerText = "Hors ligne";
    }

    function convert() {
        if (!rates || !input.value) { output.value = ''; return; }
        const val = parseFloat(input.value);
        const rateFrom = rates[from.value];
        const rateTo = rates[to.value];
        const res = (val / rateFrom) * rateTo;
        output.value = res.toFixed(2);
    }

    input.addEventListener('input', convert);
    from.addEventListener('change', convert);
    to.addEventListener('change', convert);
    document.getElementById('btn-swap-currency').addEventListener('click', () => {
        const tmp = from.value;
        from.value = to.value;
        to.value = tmp;
        convert();
    });
}

// --- MODULE : CALCULATRICE ---
function initCalculator() {
    const curr = document.getElementById('calc-curr');
    const prev = document.getElementById('calc-prev');
    const container = document.getElementById('calc-btns');
    if (!container) return;

    const btns = [
        { l: 'C', t: 'top' }, { l: '(', t: 'sci' }, { l: ')', t: 'sci' }, { l: '÷', v: '/', t: 'op' },
        { l: 'sin', t: 'sci' }, { l: 'cos', t: 'sci' }, { l: 'tan', t: 'sci' }, { l: '×', v: '*', t: 'op' },
        { l: '7' }, { l: '8' }, { l: '9' }, { l: '-', t: 'op' },
        { l: '4' }, { l: '5' }, { l: '6' }, { l: '+', t: 'op' },
        { l: '1' }, { l: '2' }, { l: '3' }, { l: 'DEL', t: 'top' },
        { l: 'π', t: 'sci' }, { l: '0' }, { l: '.' }, { l: '=', t: 'op' }
    ];

    container.innerHTML = btns.map(b => {
        const typeClass = b.t ? b.t : '';
        const value = b.v ? b.v : b.l;
        return `<button class="calc-btn ${typeClass}" data-val="${value}">${b.l}</button>`;
    }).join('');

    let expression = '';
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const val = btn.dataset.val;
        if (navigator.vibrate) navigator.vibrate(5);

        if (val === 'C') {
            expression = '';
            prev.innerText = '';
        } else if (val === 'DEL') {
            expression = expression.slice(0, -1);
        } else if (val === '=') {
            try {
                let evalString = expression
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/π/g, 'Math.PI')
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/');
                const res = eval(evalString);
                prev.innerText = expression;
                expression = String(parseFloat(res.toFixed(8)));
            } catch {
                expression = 'Erreur';
            }
        } else {
            if (['sin', 'cos', 'tan'].includes(val)) expression += val + '(';
            else expression += val;
        }
        curr.innerText = expression || '0';
    });
}

// --- MODULE : NOTES ---
function initNotes() {
    const pad = document.getElementById('note-pad');
    if(!pad) return;
    pad.value = localStorage.getItem('u-notes') || '';
    pad.addEventListener('input', () => {
        localStorage.setItem('u-notes', pad.value);
    });
}

// --- GESTION DU THEME ET NAVIGATION ---
function applyAccent(hex) {
    document.documentElement.style.setProperty('--primary', hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-dim', `rgba(${r}, ${g}, ${b}, 0.15)`);
    localStorage.setItem('u-accent', hex);
    document.querySelectorAll('.color-dot').forEach(dot => {
        if(dot.dataset.color === hex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const savedAccent = localStorage.getItem('u-accent') || '#007AFF';
    applyAccent(savedAccent);

    initUnits();
    initCurrency();
    initCalculator();
    initNotes();

    const navBtns = document.querySelectorAll('.nav-btn:not(#settings-toggle)');
    const panels = document.querySelectorAll('.panel');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            document.getElementById(targetId).classList.add('active');
        });
    });

    const settingsBtn = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');

    settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) settingsPanel.classList.add('hidden');
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => applyAccent(dot.dataset.color));
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Tout effacer ?")) {
            localStorage.clear();
            window.location.reload();
        }
    });
});