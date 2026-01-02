const state = {
    notesEnabled: localStorage.getItem('u-notes-on') === 'true',
    rates: null
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSettings();
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();
    
    // Animation de saisie globale
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const group = input.parentElement;
            group.classList.remove('input-active');
            void group.offsetWidth; 
            group.classList.add('input-active');
        });
    });
});

function initNavigation() {
    document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn, .panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        };
    });
}

function initUnits() {
    const units = {
        length: { km: 1000, hm: 100, dam: 10, m: 1, dm: 0.1, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048 },
        mass: { t: 1000, kg: 1, g: 0.001, mg: 0.000001, lb: 0.4535 },
        data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
        temp: { type: 'special' }
    };

    const cat = document.getElementById('unit-category'), from = document.getElementById('unit-from'),
          to = document.getElementById('unit-to'), input = document.getElementById('unit-input'),
          output = document.getElementById('unit-output');

    const convert = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) return output.value = '';
        if (cat.value === 'temp') {
            let c = from.value === 'C' ? val : (from.value === 'F' ? (val-32)*5/9 : val-273.15);
            output.value = to.value === 'C' ? c.toFixed(2) : (to.value === 'F' ? (c*9/5+32).toFixed(2) : (c+273.15).toFixed(2));
        } else {
            output.value = ((val * units[cat.value][from.value]) / units[cat.value][to.value]).toLocaleString('fr-FR', {maximumFractionDigits: 6});
        }
    };

    const populate = () => {
        const isTemp = cat.value === 'temp';
        const keys = isTemp ? ['C', 'F', 'K'] : Object.keys(units[cat.value]);
        from.innerHTML = to.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
        to.selectedIndex = 1;
        convert();
    };

    cat.onchange = populate;
    [input, from, to].forEach(el => el.oninput = convert);
    document.getElementById('btn-swap-unit').onclick = () => { [from.value, to.value] = [to.value, from.value]; convert(); };
    populate();
}

async function initCurrency() {
    const from = document.getElementById('currency-from'), to = document.getElementById('currency-to'),
          input = document.getElementById('currency-input'), output = document.getElementById('currency-output'),
          badge = document.getElementById('api-status');

    from.innerHTML = to.innerHTML = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD"].map(c => `<option value="${c}">${c}</option>`).join('');
    to.value = "USD";

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await res.json();
        state.rates = data.rates;
        badge.classList.add('online');
        document.getElementById('api-text').innerText = "À jour";
    } catch { document.getElementById('api-text').innerText = "Erreur API"; }

    const convert = () => {
        if (!state.rates || isNaN(parseFloat(input.value))) return output.value = '';
        output.value = ((parseFloat(input.value) / state.rates[from.value]) * state.rates[to.value]).toFixed(2);
    };

    [input, from, to].forEach(el => el.oninput = convert);
}

function initCalculator() {
    const curr = document.getElementById('calc-curr'), prev = document.getElementById('calc-prev'),
          btns = ['C', 'DEL', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];
    let exp = '';
    
    document.getElementById('calc-btns').innerHTML = btns.map(b => `<button class="${isNaN(b) && b!=='.'?'op':''}" data-val="${b}">${b}</button>`).join('');
    document.getElementById('calc-btns').onclick = (e) => {
        const v = e.target.dataset.val; if(!v) return;
        if(v === 'C') exp = '';
        else if(v === 'DEL') exp = exp.slice(0, -1);
        else if(v === '=') { try { prev.innerText = exp; exp = eval(exp).toString(); } catch { exp = "Erreur"; } }
        else exp += v;
        curr.innerText = exp || '0';
    };
}

function initSettings() {
    const toggle = document.getElementById('toggle-notes'), navNotes = document.getElementById('nav-notes');
    toggle.checked = state.notesEnabled;
    if(state.notesEnabled) navNotes.classList.remove('hidden');

    toggle.onchange = () => {
        state.notesEnabled = toggle.checked;
        localStorage.setItem('u-notes-on', state.notesEnabled);
        navNotes.classList.toggle('hidden', !state.notesEnabled);
    };

    document.getElementById('settings-toggle').onclick = () => document.getElementById('settings-panel').classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => document.getElementById('settings-panel').classList.add('hidden');
    document.getElementById('btn-reset').onclick = () => { localStorage.clear(); location.reload(); };
}

function initNotes() {
    const pad = document.getElementById('note-pad');
    pad.value = localStorage.getItem('u-note') || '';
    pad.oninput = () => localStorage.setItem('u-note', pad.value);
}