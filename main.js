import { initCalculator } from './calcul.js';
import { initUnits } from './mesures.js';
import { initCurrency } from './devises.js';
import { initNotes } from './notes.js';

// Gestion du thème couleur
function applyAccent(hex) {
    document.documentElement.style.setProperty('--primary', hex);
    // Version dim pour les fonds
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-dim', `rgba(${r}, ${g}, ${b}, 0.15)`);
    
    localStorage.setItem('u-accent', hex);
    
    // Mise à jour visuelle des points
    document.querySelectorAll('.color-dot').forEach(dot => {
        if(dot.dataset.color === hex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser la couleur
    const savedAccent = localStorage.getItem('u-accent') || '#007AFF';
    applyAccent(savedAccent);

    // 2. Initialiser les modules
    initUnits();
    initCurrency();
    initCalculator();
    initNotes();

    // 3. Navigation Principale (Tab Bar)
    const navBtns = document.querySelectorAll('.nav-btn:not(#settings-toggle)');
    const panels = document.querySelectorAll('.panel');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Retirer active partout
            navBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Activer le bouton cliqué et son panneau
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 4. Modal Réglages
    const settingsBtn = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');

    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
    });

    // Fermer si on clique en dehors de la carte
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) settingsPanel.classList.add('hidden');
    });

    // 5. Sélecteur de couleur
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            applyAccent(dot.dataset.color);
        });
    });

    // 6. Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Tout effacer ?")) {
            localStorage.clear();
            window.location.reload();
        }
    });
});