import { initMesures } from './js/mesures.js';
import { initDevises } from './js/devises.js';
import { initCalcul } from './js/calcul.js';
import { initNotes } from './js/notes.js'; // <--- AJOUTÉ

function applyAccent(hex) {
    document.documentElement.style.setProperty('--primary', hex);
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    localStorage.setItem('u-accent', hex);

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === hex);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. DESIGN
    const savedAccent = localStorage.getItem('u-accent') || '#007AFF';
    applyAccent(savedAccent);

    // 2. NAVIGATION
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.onclick = () => {
            const targetId = btn.dataset.target;
            if (!targetId) return; // Sécurité pour le bouton réglages qui n'a pas de target

            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                document.querySelectorAll('.nav-btn, .panel').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                targetPanel.classList.add('active');
                if (window.navigator.vibrate) window.navigator.vibrate(5);
            }
        };
    });

    // 3. RÉGLAGES (Ouverture/Fermeture)
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');

    if (settingsToggle && settingsPanel) {
        settingsToggle.onclick = () => settingsPanel.classList.remove('hidden');
        closeSettings.onclick = () => settingsPanel.classList.add('hidden');
    }

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.onclick = () => {
            const newColor = dot.dataset.color;
            if (newColor) applyAccent(newColor);
        };
    });

    // 4. LANCEMENT DES MODULES
    try {
        initMesures();
        initDevises();
        initCalcul();
        initNotes(); // <--- AJOUTÉ
        console.log("Unitix : Chargement réussi.");
    } catch (error) {
        console.error("Erreur modules :", error);
    }

    // 5. EFFET POP
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const group = input.parentElement;
            if (group && group.classList.contains('input-group')) {
                group.classList.remove('input-active');
                void group.offsetWidth; 
                group.classList.add('input-active');
                setTimeout(() => group.classList.remove('input-active'), 200);
            }
        });
    });
    
    // 6. RESET DATA
    const btnReset = document.getElementById('btn-reset');
    if(btnReset) {
        btnReset.onclick = () => {
            if(confirm("Supprimer toutes les données et préférences ?")) {
                localStorage.clear();
                location.reload();
            }
        };
    }
});