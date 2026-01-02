export function initCalculator() {
    const curr = document.getElementById('calc-curr');
    const prev = document.getElementById('calc-prev');
    const container = document.getElementById('calc-btns');

    if (!container) return;

    // Layout style Apple (4 colonnes)
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

        // Vibration haptique
        if (navigator.vibrate) navigator.vibrate(5);

        if (val === 'C') {
            expression = '';
            prev.innerText = '';
        } else if (val === 'DEL') {
            expression = expression.slice(0, -1);
        } else if (val === '=') {
            try {
                // Remplacement sécurisé
                let evalString = expression
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/π/g, 'Math.PI')
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/');
                
                const res = eval(evalString);
                prev.innerText = expression;
                // Arrondir pour éviter les bugs JS (0.1 + 0.2)
                expression = String(parseFloat(res.toFixed(8)));
            } catch {
                expression = 'Erreur';
            }
        } else {
            // Ajouter (avec parenthèse pour fonctions)
            if (['sin', 'cos', 'tan'].includes(val)) {
                expression += val + '(';
            } else {
                expression += val;
            }
        }
        
        curr.innerText = expression || '0';
    });
}