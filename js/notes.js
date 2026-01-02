export function initNotes() {
    const pad = document.getElementById('note-pad');
    if(!pad) return;

    pad.value = localStorage.getItem('u-notes') || '';

    pad.addEventListener('input', () => {
        localStorage.setItem('u-notes', pad.value);
    });
}