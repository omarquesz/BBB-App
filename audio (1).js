// ─── AUDIO ENGINE — mobile-safe ──────────────────────────
//
// Estratégia corrigida para iOS/Android:
//
//  - AudioContext é criado APENAS dentro do togglePlay() (gesto do usuário)
//  - loadMusicaTracks() só faz FETCH — zero interação com AudioContext
//  - decodeAudioData roda DEPOIS do gesto, dentro de togglePlay()
//  - rawBuffers.slice(0) evita "detached ArrayBuffer" ao decodificar

let ctx            = null;
let rawBuffers     = {};   // ArrayBuffer crus (após fetch)
let decodedBuffers = {};   // AudioBuffer já decodificados
let gainNodes      = {};
let sourceNodes    = {};
let mutedKeys      = {};
let pauseOffset    = 0;
let startedAt      = 0;
let duration       = 0;
let isPlaying      = false;
let isSeeking      = false;
let progressInterval = null;

// Estado por track: 'pending' | 'loading' | 'ready' | 'decoding' | 'error'
let trackStates = {};

// ─── Contexto ────────────────────────────────────────────
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

async function ensureCtxRunning() {
  const ac = getCtx();
  if (ac.state === 'suspended') {
    try { await ac.resume(); } catch(e) { console.warn('resume error', e); }
  }
  if (ac.state !== 'running') {
    await new Promise(resolve => {
      const t = setInterval(() => {
        if (ac.state === 'running') { clearInterval(t); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(t); resolve(); }, 3000);
    });
  }
  return ac;
}

// ─── Yield ───────────────────────────────────────────────
function yieldToUI() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ─── FASE 1: Apenas fetch — sem AudioContext ─────────────
async function loadMusicaTracks() {
  if (!musicaAtiva) return;

  // Parar playback anterior sem chamar stopAll completo
  Object.values(sourceNodes).forEach(s => { try { s.stop(); } catch(e) {} });
  sourceNodes    = {};
  gainNodes      = {};
  decodedBuffers = {};
  rawBuffers     = {};
  mutedKeys      = {};
  trackStates    = {};
  pauseOffset    = 0;
  duration       = 0;
  isPlaying      = false;
  updatePlayBtn(false);

  const keys = Object.keys(musicaAtiva.tracks);
  keys.forEach(k => { trackStates[k] = 'pending'; });
  renderTrackStates();

  // Download paralelo — sem AudioContext
  await Promise.all(keys.map(k => fetchTrack(k)));
  updateLoadingBanner();
}

async function fetchTrack(k) {
  trackStates[k] = 'loading';
  renderTrackStates();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const resp = await fetch(musicaAtiva.tracks[k], { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    rawBuffers[k] = await resp.arrayBuffer();
    trackStates[k] = 'ready';
  } catch(e) {
    trackStates[k] = 'error';
    console.error('Fetch error', k, e);
  }
  renderTrackStates();
}

// ─── FASE 2: Decode — dentro do gesto do usuário ─────────
async function decodeAllPending(ac) {
  const keys = Object.keys(rawBuffers);
  for (const k of keys) {
    if (decodedBuffers[k]) continue;
    if (!rawBuffers[k])    continue;
    trackStates[k] = 'decoding';
    renderTrackStates();
    await yieldToUI();
    try {
      // slice(0) cria cópia para evitar detached ArrayBuffer
      const buf = await ac.decodeAudioData(rawBuffers[k].slice(0));
      decodedBuffers[k] = buf;
      if (buf.duration > duration) {
        duration = buf.duration;
        const seek = document.getElementById('main-seek');
        if (seek) seek.max = duration;
        const tot = document.getElementById('total-time');
        if (tot) tot.innerText = fmt(duration);
      }
      trackStates[k] = 'ready';
    } catch(e) {
      trackStates[k] = 'error';
      console.error('Decode error', k, e);
    }
    renderTrackStates();
    await yieldToUI();
  }
}

// ─── Status visual por track ──────────────────────────────
function renderTrackStates() {
  Object.keys(trackStates).forEach(k => {
    const row = document.getElementById('trow-' + k);
    if (!row) return;
    const dot = row.querySelector('.t-dot');
    if (dot) {
      const s = trackStates[k];
      dot.className = 't-dot t-dot--' + (s === 'decoding' ? 'loading' : s);
      dot.title = { pending:'Aguardando…', loading:'Baixando…', decoding:'Decodificando…', ready:'Pronto', error:'Erro' }[s] || '';
    }
    const vol  = row.querySelector('.t-vol');
    const mute = row.querySelector('.mute-btn');
    // controles só ficam ativos quando decodificado
    const active = trackStates[k] === 'ready' && !!decodedBuffers[k];
    if (vol)  vol.disabled  = !active;
    if (mute) mute.disabled = !active;
  });
  updateLoadingBanner();
}

// ─── Banner de status ─────────────────────────────────────
function updateLoadingBanner() {
  const el = document.getElementById('loading-status');
  if (!el) return;

  const total   = Object.keys(trackStates).length;
  if (total === 0) { el.style.display = 'none'; return; }

  const fetched  = Object.values(trackStates).filter(s => s === 'ready').length;
  const busy     = Object.values(trackStates).filter(s => ['loading','pending','decoding'].includes(s)).length;
  const errors   = Object.values(trackStates).filter(s => s === 'error').length;
  const allDecoded = Object.keys(trackStates).length > 0 &&
    Object.keys(trackStates).every(k => trackStates[k] === 'ready' && !!decodedBuffers[k]);

  if (allDecoded) {
    el.innerHTML = `<span class="ls-check">✓</span> PRONTO — ${total} TRACKS`;
    el.className = 'loading-status loading-status--ready';
    el.style.display = 'flex';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 2000);
  } else if (errors > 0 && busy === 0) {
    el.textContent = `⚠ ${errors} TRACK(S) COM ERRO`;
    el.className = 'loading-status loading-status--error';
    el.style.display = 'flex';
  } else {
    el.innerHTML = `<span class="ls-spin"></span> BAIXANDO ${fetched}/${total}…`;
    el.className = 'loading-status loading-status--busy';
    el.style.display = 'flex';
  }
}

// ─── Iniciar sources ──────────────────────────────────────
function startSources(offset) {
  if (!musicaAtiva) return;
  const ac = getCtx();
  Object.values(sourceNodes).forEach(s => { try { s.stop(); } catch(e) {} });
  sourceNodes = {};

  const when = ac.currentTime + 0.05;
  Object.keys(decodedBuffers).forEach(key => {
    const buf = decodedBuffers[key];
    const src = ac.createBufferSource();
    src.buffer = buf;

    const gain = gainNodes[key] || (() => {
      const g = ac.createGain();
      g.connect(ac.destination);
      gainNodes[key] = g;
      return g;
    })();

    gain.gain.value = mutedKeys[key]
      ? 0
      : parseFloat(document.getElementById('vol-' + key)?.value || 0.8);

    src.connect(gain);
    src.start(when, offset);
    sourceNodes[key] = src;
  });
  startedAt = when - offset;
}

// ─── Pausar ───────────────────────────────────────────────
function pauseSources() {
  pauseOffset = getCurrentTime();
  Object.values(sourceNodes).forEach(s => { try { s.stop(); } catch(e) {} });
  sourceNodes = {};
}

// ─── Tempo atual ──────────────────────────────────────────
function getCurrentTime() {
  if (!isPlaying || !ctx) return pauseOffset;
  return ctx.currentTime - startedAt;
}

// ─── Play / Pause ─────────────────────────────────────────
// CRÍTICO iOS/Android: AudioContext.resume() DEVE ser chamado
// de forma SÍNCRONA antes de qualquer await — após o primeiro
// await o browser considera o gesto expirado e bloqueia o áudio.
function togglePlay() {
  if (!musicaAtiva) return;

  if (isPlaying) {
    pauseSources();
    isPlaying = false;
    updatePlayBtn(false);
    return;
  }

  const fetchReady = Object.values(trackStates).filter(s => s === 'ready').length;
  if (fetchReady === 0) {
    showToast('Aguarde — baixando as tracks…');
    return;
  }

  // ── SÍNCRONO: criar e desbloquear AudioContext agora ──
  // Isso DEVE acontecer antes de qualquer await
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume(); // não await — só dispara o unlock

  const ub = document.getElementById('audio-unlock-banner');
  if (ub) ub.style.display = 'none';
  updatePlayBtn(true);

  // ── ASSÍNCRONO: aguarda unlock, decodifica e toca ──
  _playAsync(ac);
}

async function _playAsync(ac) {
  // Aguarda o contexto sair de suspended (já foi desbloqueado acima)
  let ms = 0;
  while (ac.state !== 'running' && ms < 3000) {
    await new Promise(r => setTimeout(r, 50));
    ms += 50;
  }
  if (ac.state !== 'running') {
    showToast('Não foi possível ativar o áudio. Tente novamente.');
    updatePlayBtn(false);
    isPlaying = false;
    return;
  }

  // Decodificar tracks que ainda não foram decodificadas
  if (Object.keys(decodedBuffers).length < Object.keys(rawBuffers).length) {
    const el = document.getElementById('loading-status');
    if (el) {
      el.innerHTML = '<span class="ls-spin"></span> DECODIFICANDO ÁUDIO…';
      el.className = 'loading-status loading-status--busy';
      el.style.display = 'flex';
    }
    await decodeAllPending(ac);
  }

  if (Object.keys(decodedBuffers).length === 0) {
    showToast('Nenhuma track disponível ainda.');
    updatePlayBtn(false);
    isPlaying = false;
    return;
  }

  startSources(pauseOffset);
  isPlaying = true;
  updatePlayBtn(true);
  updateLoadingBanner();
}

// ─── Stop ─────────────────────────────────────────────────
function stopAll() {
  try { pauseSources(); } catch(e) {}
  pauseOffset = 0;
  isPlaying   = false;
  updatePlayBtn(false);
  const seek = document.getElementById('main-seek');
  if (seek) seek.value = 0;
  const curr = document.getElementById('curr-time');
  if (curr) curr.innerText = '0:00';
}

// ─── Seek ─────────────────────────────────────────────────
function seekTo(val) {
  pauseOffset = parseFloat(val);
  if (isPlaying) startSources(pauseOffset);
}

// ─── Volume ───────────────────────────────────────────────
function setVol(key, val) {
  if (gainNodes[key]) gainNodes[key].gain.value = mutedKeys[key] ? 0 : parseFloat(val);
}

// ─── Mute ─────────────────────────────────────────────────
function toggleMute(key) {
  mutedKeys[key] = !mutedKeys[key];
  const v = parseFloat(document.getElementById('vol-' + key)?.value || 0.8);
  if (gainNodes[key]) gainNodes[key].gain.value = mutedKeys[key] ? 0 : v;
  const btn = document.getElementById('mute-' + key);
  if (btn) {
    btn.classList.toggle('muted', mutedKeys[key]);
    btn.textContent = mutedKeys[key] ? 'UNMUTE' : 'MUTE';
  }
}

// ─── Botão play ───────────────────────────────────────────
function updatePlayBtn(playing) {
  const icon = document.getElementById('play-icon');
  const btn  = document.getElementById('btn-play');
  if (icon) icon.className = playing ? 'bx bx-pause' : 'bx bx-play';
  if (btn) {
    const t = btn.querySelector('span');
    if (t) t.textContent = playing ? ' PAUSAR' : ' PLAY';
  }
}

// ─── Loop de progresso ────────────────────────────────────
function startProgressLoop() {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (isSeeking) return;
    const t    = getCurrentTime();
    const seek = document.getElementById('main-seek');
    const curr = document.getElementById('curr-time');
    const tot  = document.getElementById('total-time');
    if (seek && duration > 0) { seek.max = duration; seek.value = Math.min(t, duration); }
    if (curr) curr.innerText = fmt(Math.min(t, duration));
    if (tot)  tot.innerText  = fmt(duration);
    if (isPlaying && t >= duration && duration > 0) stopAll();
  }, 100);
}

// ─── Toast ────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('vs-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vs-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Formatar tempo mm:ss ─────────────────────────────────
function fmt(s) {
  if (!s || isNaN(s)) return '–:––';
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}
