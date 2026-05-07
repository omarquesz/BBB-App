// ─── DISPONIBILIDADE ─────────────────────────────────────
// Gerencia o calendário de disponibilidade por membro e evento.
// Os dados ficam em localStorage com a chave 'bbb_disp'.

// ─── Dados dos eventos do mês (sincronizados com as escalas) ─
const eventosDoMes = [
  { id: 'e1', data: '2026-05-04', nome: 'Culto da Manhã',  horario: 'Dom · 04 Mai · 9h',   escalados: ['LM','AL','MC','JR','PS'] },
  { id: 'e2', data: '2026-05-04', nome: 'Culto da Noite',  horario: 'Dom · 04 Mai · 19h',  escalados: ['RM','LF'] },
  { id: 'e3', data: '2026-05-07', nome: 'EBD — Célula',    horario: 'Qua · 07 Mai · 20h',  escalados: ['AL','LM'] },
  { id: 'e4', data: '2026-05-11', nome: 'Culto da Manhã',  horario: 'Dom · 11 Mai · 9h',   escalados: ['RM','MC','JR','LF'] },
  { id: 'e5', data: '2026-05-11', nome: 'Culto da Noite',  horario: 'Dom · 11 Mai · 19h',  escalados: ['LM','AL','PS'] },
  { id: 'e6', data: '2026-05-18', nome: 'Culto da Manhã',  horario: 'Dom · 18 Mai · 9h',   escalados: ['LM','AL','MC','PS'] },
  { id: 'e7', data: '2026-05-21', nome: 'Ensaio Geral',    horario: 'Qui · 21 Mai · 19h',  escalados: ['LM','AL','RM','MC','JR','PS','LF'] },
  { id: 'e8', data: '2026-05-25', nome: 'Culto da Manhã',  horario: 'Dom · 25 Mai · 9h',   escalados: ['JR','RM','LF','MC'] },
];

// ─── Estado local ─────────────────────────────────────────
let dispMes    = 5;    // maio
let dispAno    = 2026;
let dispMembro = null; // { ini, nome, role, bg, cor } — membro ativo
let dispEventoSel = null; // evento selecionado no calendário
let dispRespostas = {}; // { 'LM-e1': 'sim'|'nao'|'talvez', … }

// ─── Persistência ─────────────────────────────────────────
function dispLoad() {
  try {
    const raw = localStorage.getItem('bbb_disp');
    if (raw) dispRespostas = JSON.parse(raw);
  } catch(e) {}
}
function dispSave() {
  try { localStorage.setItem('bbb_disp', JSON.stringify(dispRespostas)); } catch(e) {}
}
function dispKey(ini, eventoId) { return ini + '-' + eventoId; }

// ─── Render principal ─────────────────────────────────────
function renderDisponibilidade() {
  dispLoad();
  if (!dispMembro && membros.length > 0) dispMembro = membros[0];

  const root = document.getElementById('disp-root');
  if (!root) return;

  root.innerHTML = `
    <!-- Seletor de membro (quem está respondendo) -->
    <span class="slabel">Você é:</span>
    <div class="disp-member-row" id="disp-mem-row"></div>

    <!-- Legenda -->
    <div class="disp-legend">
      <div class="disp-legend-item">
        <div class="disp-legend-dot" style="background:rgba(108,99,255,.5)"></div>
        Tem evento
      </div>
      <div class="disp-legend-item">
        <div class="disp-legend-dot" style="background:var(--jade)"></div>
        Confirmado
      </div>
      <div class="disp-legend-item">
        <div class="disp-legend-dot" style="background:#ff6b6b"></div>
        Indisponível
      </div>
      <div class="disp-legend-item">
        <div class="disp-legend-dot" style="background:#f5a623"></div>
        Talvez
      </div>
    </div>

    <!-- Layout: calendário + painel de detalhe -->
    <div class="disp-layout">
      <div class="disp-cal-wrap" id="disp-cal"></div>
      <div id="disp-detail-panel"></div>
    </div>
  `;

  renderDispMembroRow();
  renderDispCal();
  renderDispDetalhe();
}

// ─── Linha de seleção de membro ───────────────────────────
function renderDispMembroRow() {
  const row = document.getElementById('disp-mem-row');
  if (!row) return;
  row.innerHTML = membros.map(m => `
    <button class="disp-mem-btn ${dispMembro?.ini === m.ini ? 'selected' : ''}"
            onclick="dispSelecionarMembro('${m.ini}')">
      <div class="chip-av" style="background:${m.bg};color:${m.cor}">${m.ini}</div>
      <span>${m.nome.split(' ')[0]}</span>
    </button>
  `).join('');
}

function dispSelecionarMembro(ini) {
  dispMembro = membros.find(m => m.ini === ini) || membros[0];
  dispEventoSel = null;
  renderDispMembroRow();
  renderDispCal();
  renderDispDetalhe();
}

// ─── Calendário ───────────────────────────────────────────
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES_NOME  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderDispCal() {
  const cal = document.getElementById('disp-cal');
  if (!cal) return;

  const hoje     = new Date();
  const primeiro = new Date(dispAno, dispMes - 1, 1);
  const diaInicio = primeiro.getDay(); // 0=dom
  const totalDias = new Date(dispAno, dispMes, 0).getDate();

  // Montar mapa de data→eventos
  const eventosPorData = {};
  eventosDoMes.forEach(ev => {
    if (!eventosPorData[ev.data]) eventosPorData[ev.data] = [];
    eventosPorData[ev.data].push(ev);
  });

  // Gerar células
  let celulas = '';
  for (let i = 0; i < diaInicio; i++) {
    celulas += `<div class="disp-day empty"></div>`;
  }
  for (let d = 1; d <= totalDias; d++) {
    const dataStr = `${dispAno}-${String(dispMes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHoje  = hoje.getFullYear()===dispAno && hoje.getMonth()===dispMes-1 && hoje.getDate()===d;
    const isPast  = new Date(dataStr) < new Date(hoje.toDateString());
    const evs     = eventosPorData[dataStr] || [];
    const hasEv   = evs.length > 0;

    // Dots de resposta do membro para os eventos deste dia
    let dots = '';
    if (hasEv && dispMembro) {
      evs.forEach(ev => {
        const resp = dispRespostas[dispKey(dispMembro.ini, ev.id)];
        if (resp) dots += `<div class="disp-dot ${resp}"></div>`;
      });
    }

    // Classe de resposta própria (para quando há só 1 evento no dia)
    let selfClass = '';
    if (hasEv && dispMembro && evs.length === 1) {
      const resp = dispRespostas[dispKey(dispMembro.ini, evs[0].id)];
      if (resp) selfClass = resp + '-self';
    }

    const selected = dispEventoSel && evs.some(e => e.id === dispEventoSel.id) ? 'today' : '';

    celulas += `
      <div class="disp-day ${hasEv ? 'has-event' : ''} ${isHoje ? 'today' : ''} ${isPast ? 'past' : ''} ${selfClass}"
           onclick="${hasEv && !isPast ? `dispSelecionarData('${dataStr}')` : ''}">
        ${d}
        ${dots ? `<div class="disp-day-dots">${dots}</div>` : ''}
      </div>
    `;
  }

  cal.innerHTML = `
    <div class="disp-cal-header">
      <button class="disp-cal-nav" onclick="dispNavMes(-1)"><i class='bx bx-chevron-left'></i></button>
      <div class="disp-cal-title">${MESES_NOME[dispMes-1]} ${dispAno}</div>
      <button class="disp-cal-nav" onclick="dispNavMes(1)"><i class='bx bx-chevron-right'></i></button>
    </div>
    <div class="disp-cal-weekdays">
      ${DIAS_SEMANA.map(d => `<div>${d}</div>`).join('')}
    </div>
    <div class="disp-cal-grid">${celulas}</div>
  `;
}

function dispNavMes(delta) {
  dispMes += delta;
  if (dispMes > 12) { dispMes = 1;  dispAno++; }
  if (dispMes < 1)  { dispMes = 12; dispAno--; }
  dispEventoSel = null;
  renderDispCal();
  renderDispDetalhe();
}

// ─── Selecionar data/evento no calendário ─────────────────
function dispSelecionarData(dataStr) {
  const evsDoDia = eventosDoMes.filter(e => e.data === dataStr);
  if (evsDoDia.length === 0) return;

  // Se há múltiplos eventos no mesmo dia, cicla entre eles
  if (evsDoDia.length === 1) {
    dispEventoSel = evsDoDia[0];
  } else {
    const idx = evsDoDia.findIndex(e => e.id === dispEventoSel?.id);
    dispEventoSel = evsDoDia[(idx + 1) % evsDoDia.length];
  }
  renderDispCal();
  renderDispDetalhe();
}

// ─── Painel de detalhe / resposta ─────────────────────────
function renderDispDetalhe() {
  const panel = document.getElementById('disp-detail-panel');
  if (!panel) return;

  if (!dispEventoSel) {
    panel.innerHTML = `
      <div class="disp-detail">
        <div class="disp-hint">
          <i class='bx bxs-calendar-event'></i>
          <p>Selecione uma data com evento no calendário</p>
        </div>
      </div>
    `;
    return;
  }

  const ev = dispEventoSel;
  const minhaResp = dispMembro ? (dispRespostas[dispKey(dispMembro.ini, ev.id)] || null) : null;

  // Botões de resposta
  const btnSim    = `sim${minhaResp === 'sim'    ? ' sim'    : ''}`;
  const btnNao    = `nao${minhaResp === 'nao'    ? ' nao'    : ''}`;
  const btnTalvez = `talvez${minhaResp === 'talvez' ? ' talvez' : ''}`;

  // Respostas dos membros escalados
  const respostasHTML = ev.escalados.map(ini => {
    const mem  = membros.find(m => m.ini === ini);
    if (!mem) return '';
    const resp = dispRespostas[dispKey(ini, ev.id)];
    const badgeLabel = { sim: 'Confirmado', nao: 'Indisponível', talvez: 'Talvez' }[resp] || 'Pendente';
    const badgeClass = resp || 'pend';
    return `
      <div class="disp-resp-row">
        <div class="chip-av" style="background:${mem.bg};color:${mem.cor};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="disp-resp-name">${mem.nome.split(' ')[0]}</div>
          <div class="disp-resp-role">${mem.role}</div>
        </div>
        <div class="disp-resp-badge ${badgeClass}">${badgeLabel}</div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    <div class="disp-detail">
      <div class="disp-detail-over">${ev.horario}</div>
      <div class="disp-detail-title">${ev.nome}</div>
      <div class="disp-detail-meta">${ev.escalados.length} escalado(s)</div>

      ${dispMembro ? `
        <div class="disp-resp-title">Sua resposta — ${dispMembro.nome.split(' ')[0]}</div>
        <div class="disp-btns">
          <button class="disp-ans-btn ${btnSim}" onclick="dispResponder('sim')">
            <i class='bx bx-check-circle'></i>
            Vou
          </button>
          <button class="disp-ans-btn ${btnTalvez}" onclick="dispResponder('talvez')">
            <i class='bx bx-help-circle'></i>
            Talvez
          </button>
          <button class="disp-ans-btn ${btnNao}" onclick="dispResponder('nao')">
            <i class='bx bx-x-circle'></i>
            Não vou
          </button>
        </div>
      ` : ''}

      <div class="disp-resp-title" style="margin-top:4px">Respostas da equipe</div>
      <div class="disp-resp-list">${respostasHTML}</div>
    </div>
  `;
}

// ─── Registrar resposta ───────────────────────────────────
function dispResponder(status) {
  if (!dispMembro || !dispEventoSel) return;
  const key = dispKey(dispMembro.ini, dispEventoSel.id);

  // Toggle: clicar na mesma opção remove a resposta
  if (dispRespostas[key] === status) {
    delete dispRespostas[key];
  } else {
    dispRespostas[key] = status;
  }
  dispSave();
  renderDispCal();
  renderDispDetalhe();

  const labels = { sim: '✓ Presença confirmada!', nao: 'Indisponibilidade registrada.', talvez: 'Resposta "talvez" salva.' };
  showToast(labels[status] || 'Resposta salva.');
}
