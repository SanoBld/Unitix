/**
 * UNITIX - Logique Applicative
 * Développé par Sano Bld
 */

// ==========================================================================
// CONFIGURATION DES DONNÉES (Unités & Ratios)
// ==========================================================================
const unitData = {
    length: { 
        u: { "Mètre": 1, "Kilomètre": 1000, "Centimètre": 0.01, "Millimètre": 0.001, "Mile": 1609.34, "Pied": 0.3048, "Pouce": 0.0254, "Yard": 0.9144 }, 
        s: { "Mètre":"m", "Kilomètre":"km", "Centimètre":"cm", "Millimètre":"mm", "Mile":"mi", "Pied":"ft", "Pouce":"in", "Yard":"yd" } 
    },
    mass: { 
        u: { "Kilogramme": 1, "Gramme": 0.001, "Milligramme": 0.000001, "Tonne": 1000, "Livre": 0.4535, "Once": 0.02835 }, 
        s: { "Kilogramme":"kg", "Gramme":"g", "Milligramme":"mg", "Tonne":"t", "Livre":"lb", "Once":"oz" } 
    },
    volume: { 
        u: { "Litre": 1, "Millilitre": 0.001, "Mètre Cube": 1000, "Gallon (US)": 3.785, "Pinte (US)": 0.473 }, 
        s: { "Litre":"L", "Millilitre":"ml", "Mètre Cube":"m³", "Gallon (US)":"gal", "Pinte (US)":"pt" } 
    },
    speed: { 
        u: { "Km/h": 1, "m/s": 3.6, "Nœud": 1.852, "Mach": 1225.04, "Mph": 1.609 }, 
        s: { "Km/h":"km/h", "m/s":"m/s", "Nœud":"kn", "Mach":"Ma", "Mph":"mph" } 
    },
    pressure: { 
        u: { "Pascal": 1, "Bar": 100000, "PSI": 6894.76, "Atmosphère": 101325 }, 
        s: { "Pascal":"Pa", "Bar":"bar", "PSI":"psi", "Atmosphère":"atm" } 
    },
    energy: { 
        u: { "Joule": 1, "Calorie": 4.184, "kWh": 3600000, "Electronvolt": 1.602e-19 }, 
        s: { "Joule":"J", "Calorie":"cal", "kWh":"kWh", "Electronvolt":"eV" } 
    },
    power: { 
        u: { "Watt": 1, "Kilowatt": 1000, "Cheval Vapeur": 735.5, "BTU/h": 0.293 }, 
        s: { "Watt":"W", "Kilowatt":"kW", "Cheval Vapeur":"ch", "BTU/h":"BTU/h" } 
    },
    data: { 
        u: { "Octet": 1, "Ko": 1024, "Mo": 1048576, "Go": 1073741824, "To": 1099511627776 }, 
        s: { "Octet":"o", "Ko":"Ko", "Mo":"Mo", "Go":"Go", "To":"To" } 
    },
    time: { 
        u: { "Seconde": 1, "Minute": 60, "Heure": 3600, "Jour": 86400, "Semaine": 604800, "Année": 31536000 }, 
        s: { "Seconde":"s", "Minute":"min", "Heure":"h", "Jour":"j", "Semaine":"sem", "Année":"an" } 
    },
    temp: { 
        u: { "Celsius":"C", "Fahrenheit":"F", "Kelvin":"K" }, 
        s: { "Celsius":"°C", "Fahrenheit":"°F", "Kelvin":"K" } 
    }
};

let currencyRates = null;

// ==========================================================================
// INITIALISATION GÉNÉRALE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAccent();
    initNavigation();
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();
    initReset();
});

// ==========================================================================
// SYSTÈME DE THÈME & APPARENCE (Surlignage)
// ==========================================================================
function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('u-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('u-theme', next);
    });
}

function initAccent() {
    const dots = document.querySelectorAll('.color-dot');
    const savedAccent = localStorage.getItem('u-accent') || '#007AFF';
    
    applyAccent(savedAccent);

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            applyAccent(dot.dataset.color);
        });
    });
}

function applyAccent(hex) {
    document.documentElement.style.setProperty('--primary', hex);
    // Calcul d'une version translucide pour les hovers
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-dim', `rgba(${r}, ${g}, ${b}, 0.15)`);
    
    localStorage.setItem('u-accent', hex);
    
    document.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('active', d.dataset.color === hex);
    });
}

// ==========================================================================
// NAVIGATION
// ==========================================================================
function initNavigation() {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            
            // Masquer tous les panneaux
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            // Désactiver tous les boutons
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            
            // Activer la cible
            document.getElementById(target).classList.add('active');
            document.querySelectorAll(`[data-target="${target}"]`).forEach(b => b.classList.add('active'));
        });
    });
}

// ==========================================================================
// CONVERTISSEUR DE MESURES
// ==========================================================================
function initUnits() {
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const selectFrom = document.getElementById('unit-from');
    const selectTo = document.getElementById('unit-to');
    const symFrom = document.getElementById('sym-from');
    const symTo = document.getElementById('sym-to');
    const segments = document.querySelectorAll('.segment');
    
    let currentCat = "length";

    const populateSelects = () => {
        const options = Object.keys(unitData[currentCat].u).map(name => 
            `<option value="${name}">${name}</option>`
        ).join('');
        selectFrom.innerHTML = selectTo.innerHTML = options;
        if(selectTo.options[1]) selectTo.selectedIndex = 1;
        doConversion();
    };

    const doConversion = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ""; return; }

        symFrom.innerText = unitData[currentCat].s[selectFrom.value];
        symTo.innerText = unitData[currentCat].s[selectTo.value];

        if (currentCat === 'temp') {
            // Logique spécifique température
            let celsius;
            if (selectFrom.value === "Celsius") celsius = val;
            else if (selectFrom.value === "Fahrenheit") celsius = (val - 32) * 5/9;
            else celsius = val - 273.15;

            let result;
            if (selectTo.value === "Celsius") result = celsius;
            else if (selectTo.value === "Fahrenheit") result = (celsius * 9/5) + 32;
            else result = celsius + 273.15;
            output.value = parseFloat(result.toFixed(4));
        } else {
            // Logique standard par ratio
            const baseValue = val * unitData[currentCat].u[selectFrom.value];
            const result = baseValue / unitData[currentCat].u[selectTo.value];
            output.value = result < 0.000001 ? result.toExponential(4) : parseFloat(result.toFixed(8));
        }
    };

    segments.forEach(seg => {
        seg.addEventListener('click', () => {
            segments.forEach(s => s.classList.remove('active'));
            seg.classList.add('active');
            currentCat = seg.dataset.cat;
            populateSelects();
        });
    });

    [input, selectFrom, selectTo].forEach(el => el.addEventListener('input', doConversion));

    document.getElementById('btn-swap-unit').addEventListener('click', () => {
        const temp = selectFrom.value;
        selectFrom.value = selectTo.value;
        selectTo.value = temp;
        doConversion();
    });

    populateSelects();
}

// ==========================================================================
// CONVERTISSEUR DE DEVISES
// ==========================================================================
async function initCurrency() {
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const status = document.getElementById('api-status');

    try {
        const response = await fetch('https://open.er-api.com/v6/latest/EUR');
        const data = await response.json();
        currencyRates = data.rates;
        
        const codes = Object.keys(currencyRates);
        from.innerHTML = to.innerHTML = codes.map(c => `<option value="${c}">${c}</option>`).join('');
        
        from.value = "EUR";
        to.value = "USD";
        status.innerText = "Taux à jour";
        status.style.color = "#34C759";
    } catch (error) {
        status.innerText = "Mode hors-ligne";
        status.style.color = "#FF3B30";
    }

    const convert = () => {
        if (!currencyRates || !input.value) return;
        const val = parseFloat(input.value);
        const result = (val / currencyRates[from.value]) * currencyRates[to.value];
        output.value = result.toFixed(2);
        document.getElementById('sym-curr-from').innerText = from.value;
        document.getElementById('sym-curr-to').innerText = to.value;
    };

    [input, from, to].forEach(el => el.addEventListener('input', convert));
    
    document.getElementById('btn-swap-currency').addEventListener('click', () => {
        const t = from.value; from.value = to.value; to.value = t; convert();
    });
}

// ==========================================================================
// CALCULATRICE
// ==========================================================================
function initCalculator() {
    const grid = document.getElementById('calc-btns');
    const currDisplay = document.getElementById('calc-curr');
    const prevDisplay = document.getElementById('calc-prev');
    
    const keys = [
        'C', '(', ')', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', 'DEL', '='
    ];

    grid.innerHTML = keys.map(k => {
        const isOp = ['/','*','-','+','='].includes(k);
        return `<button class="calc-btn ${isOp ? 'op' : ''}" data-val="${k}">${k}</button>`;
    }).join('');

    let expression = "";

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const val = btn.dataset.val;

        if (val === 'C') {
            expression = "";
            prevDisplay.innerText = "";
        } else if (val === 'DEL') {
            expression = expression.slice(0, -1);
        } else if (val === '=') {
            try {
                prevDisplay.innerText = expression + " =";
                // Utilisation de Function au lieu de eval pour une sécurité légèrement meilleure
                expression = new Function('return ' + expression)().toString();
            } catch {
                expression = "Erreur";
            }
        } else {
            if (expression === "Erreur") expression = "";
            expression += val;
        }
        currDisplay.innerText = expression || "0";
    });
}

// ==========================================================================
// BLOC-NOTES & PERSISTANCE
// ==========================================================================
function initNotes() {
    const pad = document.getElementById('note-pad');
    pad.value = localStorage.getItem('u-notes') || "";
    pad.addEventListener('input', () => {
        localStorage.setItem('u-notes', pad.value);
    });
}

function initReset() {
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm("Voulez-vous réinitialiser toutes les données (notes, couleurs, thèmes) ?")) {
            localStorage.clear();
            window.location.reload();
        }
    });
}