// --- ÉTAT GLOBAL ---
const state = {
    theme: localStorage.getItem('u-theme') || 'auto',
    accent: localStorage.getItem('u-accent') || '#007AFF',
    notesEnabled: localStorage.getItem('u-notes-enabled') === 'true',
    currencyRates: null
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
});

// --- SYSTÈME DE THÈME & ACCENT ---
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

// --- RÉGLAGES ---
function initSettings() {
    const panel = document.getElementById('settings-panel');
    const toggleNotes = document.getElementById('toggle-notes');
    const navNotes = document.getElementById('nav-notes');

    // Toggle Panel
    document.getElementById('settings-toggle').onclick = () => panel.classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => panel.classList.add('hidden');

    // Thème (Segmented Control)
    document.querySelectorAll('.seg-btn').forEach(btn => {
        if(btn.dataset.theme === state.theme) btn.classList.add('active');
        btn.onclick = () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.theme = btn.dataset.theme;
            localStorage.setItem('u-theme', state.theme);
            applyTheme(state.theme);
        };
    });

    // Option Notes
    toggleNotes.checked = state.notesEnabled;
    if (state.notesEnabled) navNotes.classList.remove('hidden');

    toggleNotes.onchange = (e) => {
        state.notesEnabled = e.target.checked;
        localStorage.setItem('u-notes-enabled', state.notesEnabled);
        navNotes.classList.toggle('hidden', !state.notesEnabled);
        
        if (!state.notesEnabled && navNotes.classList.contains('active')) {
            document.querySelector('[data-target="convert-panel"]').click();
        }
    };

    // Couleurs
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.onclick = () => {
            state.accent = dot.dataset.color;
            localStorage.setItem('u-accent', state.accent);
            applyAccent(state.accent);
        };
    });

    // Reset
    document.getElementById('btn-reset').onclick = () => {
        if(confirm("Réinitialiser toutes les données ?")) {
            localStorage.clear();
            location.reload();
        }
    };
}

// --- MODULE : MESURES ---
function initUnits() {
    const units = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048 },
        mass: { kg: 1, g: 0.001, lb: 0.4535, oz: 0.0283 },
        data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
        temp: { type: 'special' }
    };

    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');

    const populate = () => {
        const type = cat.value;
        let html = '';
        if (type === 'temp') {
            html = '<option value="C">Celsius</option><option value="F">Fahrenheit</option>';
        } else {
            html = Object.keys(units[type]).map(u => `<option value="${u}">${u}</option>`).join('');
        }
        from.innerHTML = to.innerHTML = html;
        to.selectedIndex = 1;
        convert();
    };

    const convert = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ''; return; }
        
        if (cat.value === 'temp') {
            if (from.value === to.value) output.value = val;
            else if (from.value === 'C') output.value = (val * 9/5) + 32;
            else output.value = (val - 32) * 5/9;
        } else {
            const factor = units[cat.value];
            const result = (val * factor[from.value]) / factor[to.value];
            output.value = result.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
        }
    };

    cat.onchange = populate;
    [input, from, to].forEach(el => el.oninput = convert);
    document.getElementById('btn-swap-unit').onclick = () => {
        const t = from.value; from.value = to.value; to.value = t;
        convert();
    };
    populate();
}

// --- MODULE : DEVISES ---
async function initCurrency() {
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const codes = ["EUR", "USD", "GBP", "JPY", "CAD", "CHF"];

    from.innerHTML = to.innerHTML = codes.map(c => `<option value="${c}">${c}</option>`).join('');
    to.value = "USD";

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await res.json();
        state.currencyRates = data.rates;
        document.getElementById('api-log').innerText = "Taux à jour";
        document.getElementById('api-dot').style.background = "#34C759";
    } catch {
        document.getElementById('api-log').innerText = "Erreur API";
    }

    const convert = () => {
        if (!state.currencyRates) return;
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ''; return; }
        const result = (val / state.currencyRates[from.value]) * state.currencyRates[to.value];
        output.value = result.toFixed(2);
    };

    [input, from, to].forEach(el => el.oninput = convert);
    document.getElementById('btn-swap-currency').onclick = () => {
        const t = from.value; from.value = to.value; to.value = t;
        convert();
    };
}

// --- MODULE : CALCULATRICE ---
function initCalculator() {
    const curr = document.getElementById('calc-curr');
    const prev = document.getElementById('calc-prev');
    const btns = ['C', 'DEL', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
    let expression = '';

    document.getElementById('calc-btns').innerHTML = btns.map(b => 
        `<button class="${isNaN(b) && b !== '.' ? 'op' : ''}" data-val="${b}">${b}</button>`
    ).join('');

    document.getElementById('calc-btns').onclick = (e) => {
        const val = e.target.dataset.val;
        if (!val) return;

        if (val === 'C') expression = '';
        else if (val === 'DEL') expression = expression.slice(0, -1);
        else if (val === '=') {
            try {
                prev.innerText = expression + ' =';
                expression = eval(expression).toString();
            } catch { expression = "Erreur"; }
        } else {
            expression += val;
        }
        curr.innerText = expression || '0';
    };
}

// --- MODULE : NOTES ---
function initNotes() {
    const pad = document.getElementById('note-pad');
    const status = document.getElementById('save-status');
    pad.value = localStorage.getItem('u-notes') || '';

    pad.oninput = () => {
        localStorage.setItem('u-notes', pad.value);
        status.innerText = "Enregistrement...";
        setTimeout(() => status.innerText = "Sauvegardé", 1000);
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