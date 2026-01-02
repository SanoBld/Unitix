let rates = null;

export async function initCurrency() {
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const status = document.getElementById('api-status');

    const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "CNY"];
    const options = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    
    from.innerHTML = options;
    to.innerHTML = options;
    to.value = "USD";

    // Chargement API
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