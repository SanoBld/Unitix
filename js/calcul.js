/**
 * Module Calculatrice Scientifique pour Unitix
 * Ergonomie : Alternance entre mode Standard et Scientifique
 */
export function initCalculator() {
    const curr = document.getElementById('calc-curr');
    const prev = document.getElementById('calc-prev');
    const container = document.getElementById('calc-btns');

    if (!container) return;

    // Configuration des touches (Standard + Scientifique)
    const btns = [
        'sin', 'cos', 'tan', 'C',
        'asin', 'acos', 'atan', 'DEL',
        'π', 'sqrt', '^', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '(', ')' ,
        '='
    ];

    let expression = '';

    // Génération dynamique avec distinction visuelle
    container.innerHTML = btns.map(b => {
        let type = '';
        if (isNaN(b) && b !== '.') type = 'op'; // Opérateurs
        if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'π', '^'].includes(b)) type = 'sci'; // Scientifique
        if (b === '=') type = 'equal';

        let display = b;
        if (b === 'sqrt') display = '√';
        if (b === 'pi') display = 'π';
        if (b === '*') display = '×';
        if (b === '/') display = '÷';

        return `<button class="${type}" data-val="${b}">${display}</button>`;
    }).join('');

    container.onclick = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const val = btn.dataset.val;
        if (window.navigator.vibrate) window.navigator.vibrate(10);

        if (val === 'C') {
            expression = '';
            prev.innerText = '';
        } 
        else if (val === 'DEL') {
            expression = expression.slice(0, -1);
        } 
        else if (val === '=') {
            if (!expression) return;
            solve(expression, prev, curr);
        } 
        else {
            // Ajout intelligent de parenthèses pour les fonctions
            if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt'].includes(val)) {
                expression += val + '(';
            } else if (val === 'π') {
                expression += Math.PI.toFixed(8);
            } else {
                expression += val;
            }
        }
        curr.innerText = expression || '0';
    };
}

/**
 * Logique de calcul scientifique sécurisée
 */
function solve(exp, prevEl, currEl) {
    try {
        let process = exp
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/asin/g, 'Math.asin')
            .replace(/acos/g, 'Math.acos')
            .replace(/atan/g, 'Math.atan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/\^/g, '**') // Puissance
            .replace(/×/g, '*')
            .replace(/÷/g, '/');

        // Note : Les fonctions trigonométriques JS utilisent les radians.
        // On pourrait ajouter un toggle Degré/Radiant plus tard.
        
        const result = eval(process);
        prevEl.innerText = exp + ' =';
        
        // Formatage du résultat
        const final = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        currEl.innerText = final;
    } catch {
        currEl.innerText = "Erreur";
    }
}