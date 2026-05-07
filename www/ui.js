// ─── UI — Renderização das telas ─────────────────────────

const trackIcons = {
  click:      'bx-time-five',
  guia:       'bx-microphone',
  violao_1:   'bx-music',
  violao_2:   'bx-music',
  violao_3:   'bx-music',
  baixo:      'bx-equalizer',
  bateria:    'bx-radio-circle',
  guitarra_1: 'bx-guitar',
  guitarra_2: 'bx-guitar',
};

// ─── NAVEGAÇÃO ────────────────────────────────────────────
function nav(btn, pageId) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('page-' + pageId).classList.add('active');
  if (pageId === 'mixer'          && !musicaAtiva) renderMixerHome();
  if (pageId === 'membros')        renderMembros();
  if (pageId === 'disponibilidade') renderDisponibilidade();
}

// Navegação mobile (bottom nav)
function navMobile(btn, pageId) {
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('page-' + pageId).classList.add('active');
  if (pageId === 'mixer'          && !musicaAtiva) renderMixerHome();
  if (pageId === 'membros')        renderMembros();
  if (pageId === 'disponibilidade') renderDisponibilidade();
}

// ─── DASHBOARD ────────────────────────────────────────────
function initDashboard() {
  document.getElementById('rep-count').textContent =
    Object.keys(repertorio).length + extraMusicas.length;

  const el = document.getElementById('dash-songs');
  ["Boa Parte — G. Rocha", "Lugar Secreto — B. Karla", "Bondade de Deus — C. Duarte", "Oceanos — Hillsong"]
    .forEach(s => {
      const d = document.createElement('div');
      d.className   = 'song-line';
      d.textContent = s;
      el.appendChild(d);
    });
}

// ─── REPERTÓRIO ───────────────────────────────────────────
const allMusicas = [
  ...Object.entries(repertorio).map(([k, v]) => ({
    id: k, nome: v.titulo, artista: v.artista, bpm: v.bpm,
    tom: v.tom, emoji: v.emoji, cifra: v.cifra, letra: v.letra,
    video: v.video, hasTracks: true
  })),
  ...extraMusicas.map(m => ({ ...m, hasTracks: false }))
];

function renderRep(list) {
  document.getElementById('rep-list').innerHTML = list.map((m, i) => `
    <div class="tr-rep">
      <div class="tr-num">${i + 1}</div>
      <div class="tr-thumb">${m.emoji}</div>
      <div class="tr-info">
        <div class="tr-name">${m.nome}</div>
        <div class="tr-meta">${m.artista} · ${m.tom || '—'} · ${m.bpm || '—'} bpm
          ${m.hasTracks ? '<span class="tag-vs" style="margin-left:8px">VS</span>' : ''}
        </div>
      </div>
      <div class="tr-acts">
        ${m.cifra  ? '<div class="act-btn" title="Cifra">C</div>'   : ''}
        ${m.letra  ? '<div class="act-btn" title="Letra">L</div>'   : ''}
        ${m.video  ? '<div class="act-btn" title="Vídeo">▶</div>'   : ''}
        ${m.hasTracks
          ? `<div class="act-btn" title="Mixer VS" onclick="abrirMixerDireto('${m.id}')">🎛</div>`
          : ''}
      </div>
    </div>
  `).join('');
}

function filterRep(q) {
  renderRep(allMusicas.filter(m =>
    m.nome.toLowerCase().includes(q.toLowerCase()) ||
    m.artista.toLowerCase().includes(q.toLowerCase())
  ));
}

// ─── MIXER — Home ─────────────────────────────────────────
function renderMixerHome() {
  document.getElementById('mixer-view').innerHTML = `
    <div class="ph">
      <div class="ph-over">Virtual Studio</div>
      <div class="ph-title">Mixer <em>VS</em></div>
      <div class="ph-sub">Selecione uma música para carregar os canais.</div>
    </div>
    <div class="mx-list">
      ${Object.keys(repertorio).map(key => `
        <div class="mx-item" onclick="abrirMixerDireto('${key}')">
          <div>
            <div class="mx-item-t">${repertorio[key].titulo}</div>
            <div class="mx-item-m">Tom: ${repertorio[key].tom} · BPM: ${repertorio[key].bpm} · ${Object.keys(repertorio[key].tracks).length} canais</div>
          </div>
          <i class='bx bx-chevron-right' style="color:var(--glow2);font-size:20px"></i>
        </div>
      `).join('')}
      <div class="mx-item" style="opacity:.35;cursor:default">
        <div>
          <div class="mx-item-t">Vitória no Deserto</div>
          <div class="mx-item-m">Tom: A · Em breve</div>
        </div>
        <span style="font-family:var(--mono);font-size:9px;color:var(--glow2);border:1px solid rgba(108,99,255,.3);padding:3px 8px;border-radius:5px">BREVE</span>
      </div>
    </div>
  `;
}

// ─── MIXER — Abrir direto pelo repertório ─────────────────
function abrirMixerDireto(id) {
  stopAll();
  musicaAtiva = repertorio[id];
  // Desktop sidebar
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-item')[3].classList.add('active');
  // Mobile bottom nav
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  const bnMixer = document.querySelector('.bn-item:nth-child(4)');
  if (bnMixer) bnMixer.classList.add('active');
  // Pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-mixer').classList.add('active');
  renderMixerConsole();
  loadMusicaTracks();
}

// ─── MIXER — Console ──────────────────────────────────────
// Renderiza o console imediatamente com os tracks em estado
// "skeleton" (disabled). Cada track vai se habilitando conforme
// o audio.js termina de decodificar cada um individualmente.
function renderMixerConsole() {
  const m   = musicaAtiva;
  const tks = Object.keys(m.tracks);

  document.getElementById('mixer-view').innerHTML = `
    <div class="fade-in">

      <div class="mx-header">
        <button class="back" onclick="voltarMixer()"><i class='bx bx-arrow-back'></i></button>
        <div>
          <div class="mx-title">${m.titulo}</div>
          <div class="mx-meta">Tom: ${m.tom} · ${m.bpm} BPM · ${tks.length} canais</div>
        </div>
      </div>

      <!-- Banner de carregamento — gerenciado por audio.js -->
      <div id="loading-status" class="loading-status loading-status--busy" style="display:none"></div>

      <!-- Banner de desbloqueio de áudio no mobile -->
      <div id="audio-unlock-banner" class="audio-unlock-banner" style="display:none">
        <i class='bx bx-touch'></i>
        <span>Toque em <strong>PLAY</strong> para ativar o áudio</span>
      </div>

      <div class="seek-panel">
        <div class="time-row">
          <span id="curr-time">0:00</span>
          <span id="total-time">–:––</span>
        </div>
        <input type="range" class="seekbar" id="main-seek" value="0" step="0.1" min="0"
          onmousedown="isSeeking=true" onmouseup="isSeeking=false;seekTo(this.value)"
          ontouchstart="isSeeking=true" ontouchend="isSeeking=false;seekTo(this.value)">
        <div class="ctrl-row">
          <button class="btn-play" id="btn-play" onclick="togglePlay()">
            <i class='bx bx-play' id="play-icon"></i><span> PLAY</span>
          </button>
          <button class="btn-stop" onclick="stopAll()"><i class='bx bx-stop'></i> STOP</button>
        </div>
      </div>

      <!-- Tracks — cada linha tem id="trow-KEY" para atualização individual -->
      <div class="tracks-wrap">
        ${tks.map(tk => `
          <div class="t-row" id="trow-${tk}">
            <div class="t-icon"><i class='bx ${trackIcons[tk] || 'bx-music'}'></i></div>
            <div class="t-name">${tk.replace(/_/g, ' ')}</div>
            <!-- dot de status: pending | loading | ready | error -->
            <span class="t-dot t-dot--pending" title="Aguardando…"></span>
            <input type="range" id="vol-${tk}" class="t-vol" min="0" max="1" step="0.05" value="0.8"
              oninput="setVol('${tk}', this.value)" disabled>
            <button class="mute-btn" id="mute-${tk}" onclick="toggleMute('${tk}')" disabled>MUTE</button>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  startProgressLoop();

  // Mostrar dica de desbloqueio de áudio no mobile
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const unlockBanner = document.getElementById('audio-unlock-banner');
  if (unlockBanner && isMobile) unlockBanner.style.display = 'flex';
}

// ─── MIXER — Voltar ───────────────────────────────────────
function voltarMixer() {
  stopAll();
  Object.values(sourceNodes).forEach(s => { try { s.stop(); } catch (e) {} });
  sourceNodes    = {};
  gainNodes      = {};
  decodedBuffers = {};
  trackStates    = {};
  musicaAtiva    = null;
  if (progressInterval) clearInterval(progressInterval);
  renderMixerHome();
}

// ─── MEMBROS ──────────────────────────────────────────────
function renderMembros() {
  document.getElementById('membros-grid').innerHTML = membros.map(m => `
    <div class="mem-tile">
      <div class="mem-av" style="background:${m.bg};color:${m.cor}">${m.ini}</div>
      <div class="mem-name">${m.nome}</div>
      <div class="mem-role">${m.role}</div>
    </div>
  `).join('');

  document.getElementById('freq-list').innerHTML = membros.map(m => `
    <div class="freq-row">
      <div class="freq-left">
        <div class="freq-mini" style="background:${m.bg};color:${m.cor}">${m.ini}</div>
        <span>${m.nome}</span>
      </div>
      <span class="freq-val">${m.freq} / ${TOTAL_ESCALAS}</span>
    </div>
  `).join('');
}

// ─── UPLOAD DE FOTO (Cloudinary) ─────────────────────────
function abrirUpload() {
  if (typeof cloudinary === 'undefined') {
    showToast('Widget de upload indisponível.');
    return;
  }
  cloudinary.openUploadWidget(
    { cloudName: 'dzp9kxv3e', uploadPreset: 'ml_default', sources: ['local', 'camera'], cropping: true, croppingAspectRatio: 1 },
    (err, res) => {
      if (!err && res.event === 'success') {
        const url = res.info.secure_url;
        document.getElementById('user-pfp').src = url;
        localStorage.setItem('bbb_foto', url);
      }
    }
  );
}
