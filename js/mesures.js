export function initUnits() {
    const units = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
        mass: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.4535, oz: 0.02835 },
        data: { o: 1, Ko: 1024, Mo: 1048576, Go: 1073741824 },
        temp: { type: 'special' }
    };

    const catSelect = document.getElementById('unit-category');
    const segments = document.querySelectorAll('.segment');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    const input = document.getElementById('unit-input');
    const output = document.getElementById('unit-output');
    const swapBtn = document.getElementById('btn-swap-unit');

    if (!input) return;

    // Gestion des onglets segments
    segments.forEach(seg => {
        seg.addEventListener('click', () => {
            // Visuel
            segments.forEach(s => s.classList.remove('active'));
            seg.classList.add('active');
            
            // Logique
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
            // Logique Temp
            let c = val;
            if (uFrom === 'F') c = (val - 32) * 5/9;
            if (uFrom === 'K') c = val - 273.15;
            
            if (uTo === 'C') res = c;
            else if (uTo === 'F') res = (c * 9/5) + 32;
            else if (uTo === 'K') res = c + 273.15;
        } else {
            // Logique Standard
            const ratioFrom = units[cat][uFrom];
            const ratioTo = units[cat][uTo];
            res = (val * ratioFrom) / ratioTo;
        }

        // Formatage intelligent
        output.value = (res % 1 !== 0) ? parseFloat(res.toFixed(4)) : res;
    }

    // Événements
    input.addEventListener('input', convert);
    from.addEventListener('change', convert);
    to.addEventListener('change', convert);
    
    swapBtn.addEventListener('click', () => {
        const tmp = from.value;
        from.value = to.value;
        to.value = tmp;
        convert();
        
        // Animation rotation
        const icon = swapBtn.querySelector('i');
        icon.style.transition = '0.3s';
        icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    populate();
}