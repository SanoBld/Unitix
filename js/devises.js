/**
 * Module Devises pour Unitix
 * Gère l'appel API, le cache local et la conversion en temps réel
 */

// On crée un petit état local au module pour stocker les taux
let exchangeRates = null;

export async function initCurrency() {
    const from = document.getElementById('currency-from');
    const to = document.getElementById('currency-to');
    const input = document.getElementById('currency-input');
    const output = document.getElementById('currency-output');
    const badge = document.getElementById('api-status');
    const badgeText = document.getElementById('api-text');

    if (!from || !input) return;

    // 1. Initialisation des listes de devises
    const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "MAD", "DZD", "TND"];
    const options = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    from.innerHTML = to.innerHTML = options;
    
    // Valeurs par défaut
    from.value = "EUR";
    to.value = "USD";

    // 2. Tentative de chargement du cache (pour le mode hors-ligne)
    const cachedData = localStorage.getItem('u-rates-cache');
    if (cachedData) {
        exchangeRates = JSON.parse(cachedData);
        updateStatus(badge, badgeText, "online", "Mode local");
    }

    // 3. Récupération des taux en direct (API)
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        if (!res.ok) throw new Error();
        
        const data = await res.json();
        exchangeRates = data.rates;
        
        // Sauvegarde en cache pour la prochaine fois
        localStorage.setItem('u-rates-cache', JSON.stringify(data.rates));
        updateStatus(badge, badgeText, "online", "Taux à jour");
        
    } catch (error) {
        if (!exchangeRates) {
            updateStatus(badge, badgeText, "offline", "Erreur réseau");
        } else {
            updateStatus(badge, badgeText, "offline", "Hors-ligne");
        }
    }

    // 4. Fonction de conversion
    const convert = () => {
        const val = parseFloat(input.value);
        if (!exchangeRates || isNaN(val)) {
            output.value = '';
            return;
        }

        // Formule : (Montant / Taux_Source) * Taux_Cible
        const result = (val / exchangeRates[from.value]) * exchangeRates[to.value];
        
        // Affichage propre (ex: 1 250,50)
        output.value = result.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // 5. Événements
    [input, from, to].forEach(el => el.addEventListener('input', convert));

    // Bouton Swap (Inverser)
    const btnSwap = document.getElementById('btn-swap-currency');
    if (btnSwap) {
        btnSwap.onclick = () => {
            const temp = from.value;
            from.value = to.value;
            to.value = temp;
            convert();
            
            // Petit effet visuel sur mobile
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        };
    }

    // Lancement initial
    convert();
}

/**
 * Met à jour le petit badge de statut API en haut à droite
 */
function updateStatus(badge, textEl, status, message) {
    if (!badge || !textEl) return;
    
    badge.className = 'api-badge ' + status;
    textEl.innerText = message;
}