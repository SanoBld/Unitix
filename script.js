/* --- UNITIX CORE --- */
const state = {
    theme: localStorage.getItem('ux-theme') || 'auto',
    color: localStorage.getItem('ux-color') || '#007AFF',
    haptic: localStorage.getItem('ux-haptic') !== 'false'
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initConverter();
    initCalculator();
    initSettings();
    
    // Écouteur pour le changement de thème système en temps réel
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'auto') {
            initTheme();
        }
    });
});

const vibrate = () => { 
    if(state.haptic && navigator.vibrate) {
        navigator.vibrate(10);
    }
};

/* --- THEME & SETTINGS --- */
function initTheme() {
    let effectiveTheme = state.theme;
    
    // Si auto, on regarde le système
    if (state.theme === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = systemDark ? 'dark' : 'light';
    }

    // Application du thème sur le body
    document.body.setAttribute('data-theme', effectiveTheme);
    
    // Application de la couleur
    document.documentElement.style.setProperty('--primary', state.color);
    
    // Mise à jour de la meta theme-color pour la barre de statut mobile
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        // En mode sombre on met du noir, sinon un gris très clair
        metaTheme.content = effectiveTheme === 'dark' ? '#000000' : '#F5F5F7';
    }
}

function initSettings() {
    // Thème
    const ts = document.getElementById('theme-select');
    if(ts) {
        ts.value = state.theme;
        ts.addEventListener('change', (e) => {
            state.theme = e.target.value;
            localStorage.setItem('ux-theme', state.theme);
            initTheme();
        });
    }

    // Haptique
    const hapticToggle = document.getElementById('toggle-haptic');
    if(hapticToggle) {
        hapticToggle.checked = state.haptic;
        hapticToggle.addEventListener('change', (e) => {
            state.haptic = e.target.checked;
            localStorage.setItem('ux-haptic', state.haptic);
            vibrate();
        });
    }

    // Couleurs
    const colorOptions = document.querySelectorAll('.color-opt');
    colorOptions.forEach(opt => {
        // Reset visuel
        opt.classList.remove('active');
        if(opt.dataset.color === state.color) opt.classList.add('active');

        opt.addEventListener('click', () => {
            vibrate();
            colorOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            
            state.color = opt.dataset.color;
            localStorage.setItem('ux-color', state.color);
            initTheme();
        });
    });

    // Reset total
    const btnReset = document.getElementById('btn-reset');
    if(btnReset) {
        btnReset.addEventListener('click', () => {
            if(confirm("Voulez-vous vraiment réinitialiser toutes les préférences ?")) { 
                localStorage.clear(); 
                location.reload(); 
            }
        });
    }
}

/* --- NAVIGATION --- */
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            
            // Gestion active boutons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Gestion affichage pages
            const targetId = btn.dataset.target;
            pages.forEach(p => {
                if(p.id === targetId) {
                    p.style.display = 'block';
                    // Timeout pour laisser le display:block s'appliquer avant l'opacité
                    setTimeout(() => p.classList.add('active'), 10);
                } else {
                    p.classList.remove('active');
                    p.style.display = 'none';
                }
            });
        });
    });
}

/* --- CALCULATRICE --- */
let calcExpr = "";
let shouldReset = false;

function initCalculator() {
    const grid = document.getElementById('calc-grid');
    if(!grid) return;

    // Configuration des touches
    const buttons = [
        {txt:'AC', cl:'fn', action:'clear'}, 
        {txt:'+/-', cl:'fn', action:'sign'}, 
        {txt:'%', cl:'fn', action:'percent'}, 
        {txt:'÷', cl:'op', val:'/'},
        {txt:'7', cl:'num', val:'7'}, 
        {txt:'8', cl:'num', val:'8'}, 
        {txt:'9', cl:'num', val:'9'}, 
        {txt:'×', cl:'op', val:'*'},
        {txt:'4', cl:'num', val:'4'}, 
        {txt:'5', cl:'num', val:'5'}, 
        {txt:'6', cl:'num', val:'6'}, 
        {txt:'-', cl:'op', val:'-'},
        {txt:'1', cl:'num', val:'1'}, 
        {txt:'2', cl:'num', val:'2'}, 
        {txt:'3', cl:'num', val:'3'}, 
        {txt:'+', cl:'op', val:'+'},
        {txt:'0', cl:'num', val:'0', span: true}, 
        {txt:'.', cl:'num', val:'.'}, 
        {txt:'=', cl:'op', action:'eval'}
    ];

    grid.innerHTML = buttons.map(b => `
        <button class="calc-btn ${b.cl}" 
                style="${b.span ? 'grid-column: span 2; aspect-ratio: auto; border-radius: 40px;' : ''}"
                data-val="${b.val || ''}"
                data-action="${b.action || ''}">
            ${b.txt}
        </button>
    `).join('');

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        handleCalc(btn.dataset.val, btn.dataset.action, btn.innerText);
    });
}

function handleCalc(val, action, txt) {
    vibrate();
    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');

    // RESET
    if (action === 'clear') {
        calcExpr = "";
        display.value = "0";
        history.innerText = "";
        shouldReset = false;
        return;
    }

    // EGAL (=)
    if (action === 'eval') {
        try {
            // Nettoyage sécurité
            const safeExpr = calcExpr.replace(/[^0-9+\-*/().]/g, ''); 
            if(!safeExpr) return;
            
            // Calcul
            // eslint-disable-next-line no-eval
            let result = eval(safeExpr); 
            
            // Arrondi pour éviter les 0.000000004
            if (!Number.isInteger(result)) {
                result = parseFloat(result.toFixed(8));
            }

            history.innerText = calcExpr + " =";
            display.value = result;
            calcExpr = result.toString();
            shouldReset = true; 
        } catch (e) {
            display.value = "Erreur";
            calcExpr = "";
        }
        return;
    }

    // SIGNE (+/-)
    if (action === 'sign') {
        if(display.value !== "0" && display.value !== "Erreur") {
            if(display.value.startsWith('-')) {
                display.value = display.value.substring(1);
                // On retire le signe moins du début de l'expression si présent
                // (Approche simplifiée, idéalement il faudrait parser l'expression)
                if(calcExpr.startsWith('-')) calcExpr = calcExpr.substring(1);
            } else {
                display.value = "-" + display.value;
                calcExpr = "-(" + calcExpr + ")";
            }
        }
        return;
    }

    // POURCENTAGE (%)
    if (action === 'percent') {
        const v = parseFloat(display.value) / 100;
        display.value = v;
        calcExpr = v.toString();
        shouldReset = true;
        return;
    }

    // CHIFFRES ET OPERATEURS
    const isOp = ['/','*','-','+'].includes(val);
    
    // Si on tape un chiffre après un résultat, on recommence à zéro
    if (shouldReset && !isOp) {
        display.value = val;
        calcExpr = val;
        history.innerText = "";
        shouldReset = false;
    } else {
        shouldReset = false;
        
        // Gestion visuelle de l'écran principal
        if (isOp) {
            // On n'affiche pas l'opérateur dans l'écran principal (style iOS)
            // Mais on pourrait le mettre dans l'historique si on voulait
        } else {
            // C'est un chiffre ou un point
            if (display.value === "0" || ['/','*','-','+'].includes(calcExpr.slice(-1))) {
                display.value = txt;
            } else {
                display.value += txt;
            }
        }
        calcExpr += val;
    }
}

/* --- CONVERTISSEUR --- */
const RATES = {
    "Longueur": { 
        base: "m",
        units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048 }
    },
    "Masse": { 
        base: "g",
        units: { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 }
    },
    "Température": { 
        base: "c", 
        units: { c: "C", f: "F", k: "K" } 
    } 
};

function initConverter() {
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    if(!fromSelect || !toSelect) return;

    // Remplissage des options
    let html = "";
    const LABELS = {
        m: "Mètres", km: "Kilomètres", cm: "Centimètres", mm: "Millimètres", in: "Pouces", ft: "Pieds",
        kg: "Kilogrammes", g: "Grammes", lb: "Livres", oz: "Onces",
        c: "Celsius", f: "Fahrenheit", k: "Kelvin"
    };

    for (let cat in RATES) {
        html += `<optgroup label="${cat}">`;
        for (let key in RATES[cat].units) {
            html += `<option value="${key}" data-cat="${cat}">${LABELS[key] || key}</option>`;
        }
        html += `</optgroup>`;
    }
    fromSelect.innerHTML = html;
    toSelect.innerHTML = html;
    
    // Défauts
    fromSelect.value = "m";
    toSelect.value = "km";

    const calculate = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ""; return; }

        const u1 = fromSelect.value;
        const u2 = toSelect.value;
        
        // Catégories
        const cat1 = fromSelect.selectedOptions[0].parentElement.label;
        const cat2 = toSelect.selectedOptions[0].parentElement.label;

        if (cat1 !== cat2) {
            output.value = "---";
            return;
        }

        let res = 0;

        if (cat1 === "Température") {
            // Vers Celsius
            let inC = val;
            if (u1 === 'f') inC = (val - 32) * 5/9;
            if (u1 === 'k') inC = val - 273.15;
            
            // Depuis Celsius
            if (u2 === 'c') res = inC;
            if (u2 === 'f') res = (inC * 9/5) + 32;
            if (u2 === 'k') res = inC + 273.15;
        } else {
            // Facteur -> Base -> Cible
            const factor1 = RATES[cat1].units[u1];
            const factor2 = RATES[cat1].units[u2];
            const valInBase = val * factor1;
            res = valInBase / factor2;
        }

        output.value = parseFloat(res.toFixed(6));
    };

    input.addEventListener('input', calculate);
    fromSelect.addEventListener('change', calculate);
    toSelect.addEventListener('change', calculate);
    
    swapBtn.addEventListener('click', () => {
        vibrate();
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        calculate();
    });
}