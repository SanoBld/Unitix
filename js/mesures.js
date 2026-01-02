/**
 * Module Mesures pour Unitix
 * Gère les conversions de distances, masses, données et températures
 */

export function initUnits() {
    // 1. Définition des rapports de conversion (Base = mètre, gramme, octet)
    const units = {
        length: { 
            km: 1000, hm: 100, dam: 10, m: 1, dm: 0.1, cm: 0.01, mm: 0.001, 
            mi: 1609.34, ft: 0.3048, in: 0.0254 
        },
        mass: { 
            t: 1000, kg: 1, hg: 0.1, dag: 0.01, g: 0.001, mg: 0.000001, 
            lb: 0.4535, oz: 0.02835 
        },
        data: { 
            B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 
        },
        temp: { type: 'special' } // La température nécessite des formules (pas de simples rapports)
    };

    const cat = document.getElementById('unit-category');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const btnSwap = document.getElementById('btn-swap-unit');

    if (!cat || !input) return;

    // 2. Logique de conversion
    const convert = () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) {
            output.value = '';
            return;
        }

        if (cat.value === 'temp') {
            // Formules spécifiques pour Température
            let celsius;
            if (from.value === 'C') celsius = val;
            else if (from.value === 'F') celsius = (val - 32) * 5 / 9;
            else if (from.value === 'K') celsius = val - 273.15;

            let res;
            if (to.value === 'C') res = celsius;
            else if (to.value === 'F') res = (celsius * 9 / 5) + 32;
            else if (to.value === 'K') res = celsius + 273.15;
            
            output.value = res.toFixed(2);
        } else {
            // Calcul standard via les rapports
            const res = (val * units[cat.value][from.value]) / units[cat.value][to.value];
            
            // Formatage lisible
            if (res < 0.0001) output.value = res.toExponential(4);
            else output.value = res.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
        }
    };

    // 3. Remplissage des listes déroulantes (Select)
    const populate = () => {
        const keys = cat.value === 'temp' ? ['C', 'F', 'K'] : Object.keys(units[cat.value]);
        const options = keys.map(k => `<option value="${k}">${k}</option>`).join('');
        
        from.innerHTML = to.innerHTML = options;
        
        // Sélection par défaut intelligente
        to.value = keys[1] || keys[0];
        convert();
    };

    // 4. Événements
    cat.onchange = populate;
    [input, from, to].forEach(el => el.oninput = convert);
    
    if (btnSwap) {
        btnSwap.onclick = () => {
            const temp = from.value;
            from.value = to.value;
            to.value = temp;
            if (window.navigator.vibrate) window.navigator.vibrate(10);
            convert();
        };
    }

    // Initialisation
    populate();
}