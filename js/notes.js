/**
 * Module Notes pour Unitix
 * Gère le bloc-notes avec sauvegarde automatique locale
 */

export function initNotes() {
    const notePad = document.getElementById('note-pad');
    
    if (!notePad) return;

    // 1. Charger la note sauvegardée
    const savedNote = localStorage.getItem('u-note-content');
    if (savedNote) {
        notePad.value = savedNote;
    }

    // 2. Sauvegarde automatique à chaque modification
    notePad.addEventListener('input', () => {
        const content = notePad.value;
        localStorage.setItem('u-note-content', content);
        
        // Optionnel : On peut ajouter un indicateur visuel discret "Enregistré"
    });

    // 3. Ergonomie Mobile : Ajustement automatique de la hauteur
    // Pour éviter de scroller à l'intérieur d'un petit rectangle
    const autoResize = () => {
        notePad.style.height = 'auto';
        notePad.style.height = notePad.scrollHeight + 'px';
    };

    notePad.addEventListener('focus', autoResize);
    notePad.addEventListener('input', autoResize);

    // Initialisation du redimensionnement si du texte existe déjà
    autoResize();
}

/**
 * Fonction bonus : Effacer la note
 * Peut être appelée depuis un bouton "Vider" dans l'interface
 */
export function clearNotes() {
    if (confirm("Voulez-vous effacer tout le contenu de la note ?")) {
        const notePad = document.getElementById('note-pad');
        if (notePad) notePad.value = '';
        localStorage.removeItem('u-note-content');
    }
}