// ─── APP — Inicialização ─────────────────────────────────
// Ponto de entrada: roda após todos os outros scripts

let musicaAtiva = null;

// Restaurar foto salva
const savedPhoto = localStorage.getItem('bbb_foto');
if (savedPhoto) document.getElementById('user-pfp').src = savedPhoto;

// Inicializar páginas
initDashboard();
renderRep(allMusicas);
renderMixerHome();
renderDisponibilidade();
