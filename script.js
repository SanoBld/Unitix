/* --- UNITIX CORE --- */
const state = {
    theme: localStorage.getItem('ux-theme') || 'auto',
    color: localStorage.getItem('ux-color') || '#007AFF', // Nouvelle couleur par défaut
    haptic: localStorage.getItem('ux-haptic') !== 'false'
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initConverter();
    initCalculator();
    initSettings();
});

const vibrate = () => { if(state.haptic && navigator.vibrate) navigator.vibrate(10); };

/* --- NAVIGATION --- */
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate();
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Masquer toutes les pages
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none'; // Force hide pour éviter les glitchs visuels
            });
            
            // Afficher la cible
            const target = document.getElementById(btn.dataset.target);
            if(target) {
                target.style.display = 'block';
                // Petit délai pour permettre l'animation CSS
                setTimeout(() => target.classList.add('active'), 10);
            }
        });
    });
}

/* --- CALCULATRICE CORRIGÉE --- */
let calcExpr = "";
let shouldReset = false; // Pour savoir si on doit effacer après un résultat

function initCalculator() {
    const grid = document.getElementById('calc-grid');
    // Mapping pour affichage vs calcul
    const buttons = [
        {txt:'AC', cl:'fn', action:'clear'}, {txt:'+/-', cl:'fn', action:'sign'}, {txt:'%', cl:'fn', action:'percent'}, {txt:'÷', cl:'op', val:'/'},
        {txt:'7', cl:'num', val:'7'}, {txt:'8', cl:'num', val:'8'}, {txt:'9', cl:'num', val:'9'}, {txt:'×', cl:'op', val:'*'},
        {txt:'4', cl:'num', val:'4'}, {txt:'5', cl:'num', val:'5'}, {txt:'6', cl:'num', val:'6'}, {txt:'-', cl:'op', val:'-'},
        {txt:'1', cl:'num', val:'1'}, {txt:'2', cl:'num', val:'2'}, {txt:'3', cl:'num', val:'3'}, {txt:'+', cl:'op', val:'+'},
        {txt:'0', cl:'num', val:'0', span: true}, {txt:'.', cl:'num', val:'.'}, {txt:'=', cl:'op', action:'eval'}
    ];

    grid.innerHTML = buttons.map(b => `
        <button class="calc-btn ${b.cl}" 
                style="${b.span ? 'grid-column: span 2; aspect-ratio: auto; border-radius: 40px;' : ''}"
                data-val="${b.val || ''}"
                data-action="${b.action || ''}">
            ${b.txt}
        </button>
    `).join('');

    // Délégation d'événement unique pour performance
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

    if (action === 'clear') {
        calcExpr = "";
        display.value = "0";
        history.innerText = "";
        shouldReset = false;
        return;
    }

    if (action === 'eval') {
        try {
            // Sécurité basique et calcul
            const safeExpr = calcExpr.replace(/[^0-9+\-*/().]/g, ''); 
            if(!safeExpr) return;
            
            // eslint-disable-next-line no-eval
            let result = eval(safeExpr); 
            
            // Gestion des décimales infinies
            if (!Number.isInteger(result)) {
                result = parseFloat(result.toFixed(8));
            }

            history.innerText = calcExpr + " =";
            display.value = result;
            calcExpr = result.toString();
            shouldReset = true; // Prochaine touche effacera l'écran sauf si c'est une opération
        } catch (e) {
            display.value = "Erreur";
            calcExpr = "";
        }
        return;
    }

    if (action === 'sign') {
        if(display.value !== "0") {
            if(display.value.startsWith('-')) {
                display.value = display.value.substring(1);
                calcExpr = calcExpr.startsWith('-') ? calcExpr.substring(1) : calcExpr; // Simplification
            } else {
                display.value = "-" + display.value;
                calcExpr = "-" + "(" + calcExpr + ")";
            }
        }
        return;
    }

    if (action === 'percent') {
        const v = parseFloat(display.value) / 100;
        display.value = v;
        calcExpr = v.toString();
        shouldReset = true;
        return;
    }

    // Gestion des chiffres et opérateurs
    const isOp = ['/','*','-','+'].includes(val);
    
    if (shouldReset && !isOp) {
        // Si on tape un chiffre après un résultat -> nouveau calcul
        display.value = val;
        calcExpr = val;
        history.innerText = "";
        shouldReset = false;
    } else {
        shouldReset = false;
        if (display.value === "0" && !isOp && val !== '.') {
            display.value = txt;
        } else {
            // Si c'est un opérateur, on ne l'ajoute pas à l'affichage principal visuel "numérique" 
            // sauf si on veut une calculatrice style expression. 
            // Ici on garde le style iOS : l'opérateur n'apparait pas dans l'input principal mais dans la mémoire.
            // Pour simplifier selon ton code original : on affiche tout ou on gère l'input.
            // On va concaténer intelligemment.
            
            if(isOp) {
                 display.value = txt; // Montre juste l'opérateur temporairement ou garde le nombre
                 // Pour UX fluide : on garde le nombre précédent affiché visuellement jusqu'au prochain chiffre
            } else {
                // C'est un chiffre ou un point
                 if (['/','*','-','+'].includes(calcExpr.slice(-1))) {
                     display.value = txt;
                 } else {
                     display.value += txt;
                 }
            }
        }
        calcExpr += val;
    }
    // Mise à jour visuelle simple pour voir ce qu'on tape (écrasement si opérateur précédent)
    if(!isOp) {
         // Logique complexe d'affichage iOS simplifiée ici : 
         // On affiche le buffer actuel du nombre en cours de saisie
         const parts = calcExpr.split(/[\+\-\*\/]/);
         const currentNum = parts[parts.length-1];
         display.value = currentNum;
    }
}

/* --- CONVERTISSEUR FONCTIONNEL --- */
const RATES = {
    // Tout converti vers l'unité de base (m, g, c)
    "Longueur": { 
        base: "m",
        units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048 }
    },
    "Masse": { 
        base: "g",
        units: { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 }
    },
    // Température traitée à part
    "Température": { base: "c", units: { c: "C", f: "F", k: "K" } } 
};

function initConverter() {
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    // Remplir les selects
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
    
    // Valeurs par défaut cohérentes
    fromSelect.value = "m";
    toSelect.value = "km";

    // Fonction de calcul
    const calculate = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) { output.value = ""; return; }

        const u1 = fromSelect.value;
        const u2 = toSelect.value;
        
        // Vérifier si les unités sont compatibles (même catégorie)
        const cat1 = fromSelect.selectedOptions[0].parentElement.label;
        const cat2 = toSelect.selectedOptions[0].parentElement.label;

        if (cat1 !== cat2) {
            output.value = "Incompatible";
            return;
        }

        let res = 0;

        if (cat1 === "Température") {
            // Conv vers Celsius
            let inC = val;
            if (u1 === 'f') inC = (val - 32) * 5/9;
            if (u1 === 'k') inC = val - 273.15;
            
            // Celsius vers cible
            if (u2 === 'c') res = inC;
            if (u2 === 'f') res = (inC * 9/5) + 32;
            if (u2 === 'k') res = inC + 273.15;
        } else {
            // Longueur et Masse (Facteur -> Base -> Cible)
            const factor1 = RATES[cat1].units[u1];
            const factor2 = RATES[cat1].units[u2];
            const valInBase = val * factor1;
            res = valInBase / factor2;
        }

        // Affichage propre (max 6 décimales, pas de .000 inutiles)
        output.value = parseFloat(res.toFixed(6));
    };

    // Écouteurs
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

/* --- THEME & SETTINGS --- */
function initTheme() {
    document.body.setAttribute('data-theme', state.theme);
    // Appliquer la couleur personnalisée
    document.documentElement.style.setProperty('--primary', state.color);
    
    // Mettre à jour la couleur dans la barre de statut mobile (meta theme-color)
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.content = state.theme === 'dark' ? '#000000' : '#F5F5F7';
    }
}

function initSettings() {
    // Thème (Clair/Sombre)
    const ts = document.getElementById('theme-select');
    ts.value = state.theme;
    ts.addEventListener('change', (e) => {
        state.theme = e.target.value;
        localStorage.setItem('ux-theme', state.theme);
        initTheme();
    });

    // Gestion des Couleurs (Nouveau)
    const colorOptions = document.querySelectorAll('.color-opt');
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            vibrate();
            // Retirer la classe active des autres
            colorOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            
            // Sauvegarder
            state.color = opt.dataset.color;
            localStorage.setItem('ux-color', state.color);
            initTheme();
        });
        
        // Marquer la couleur active au chargement
        if(opt.dataset.color === state.color) opt.classList.add('active');
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Tout réinitialiser (données et réglages) ?")) { 
            localStorage.clear(); 
            location.reload(); 
        }
    });
}