// ─── REPERTÓRIO (músicas com tracks do Mixer VS) ──────────
const repertorio = {
  "boa-parte": {
    titulo:  "Boa Parte",
    artista: "Gabriela Rocha",
    bpm:     "71",
    tom:     "E",
    emoji:   "🎵",
    cifra:   true,
    letra:   true,
    video:   true,
    tracks: {
      click:      'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777658837/Click_Track_ah7sp1.mp3',
      guia:       'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777658834/Guide_nlwch2.mp3',
      violao_1:   'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777658787/AG_d9o7t2.mp3',
      violao_2:   'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660380/AG_2_pcr3ys.mp3',
      violao_3:   'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660381/AG_3_tiic5t.mp3',
      baixo:      'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660385/Bass_dmiuar.mp3',
      bateria:    'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660389/Drums_Live_adiusx.mp3',
      guitarra_1: 'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660388/EG_1_hoxd2o.mp3',
      guitarra_2: 'https://res.cloudinary.com/dzp9kxv3e/video/upload/q_auto/f_auto/v1777660390/EG_2_xbqovz.mp3',
    }
  }
};

// ─── MÚSICAS SEM TRACKS (apenas info) ────────────────────
const extraMusicas = [
  { nome: "Ousado Amor",        artista: "Elevation Worship", bpm: "110", tom: "G",  emoji: "🎶", cifra: true,  letra: true,  video: true  },
  { nome: "Bondade de Deus",    artista: "Cláudio Duarte",    bpm: "72",  tom: "Bb", emoji: "🎵", cifra: true,  letra: false, video: true  },
  { nome: "Vitória no Deserto", artista: "Morada",            bpm: "128", tom: "A",  emoji: "🎶", cifra: true,  letra: true,  video: false },
  { nome: "Lugar Secreto",      artista: "Bruna Karla",       bpm: "68",  tom: "D",  emoji: "🎵", cifra: false, letra: true,  video: true  },
  { nome: "Oceanos",            artista: "Hillsong",          bpm: "66",  tom: "C",  emoji: "🎶", cifra: true,  letra: true,  video: true  },
];

// ─── MEMBROS ──────────────────────────────────────────────
const membros = [
  { ini: "LM", nome: "Lucas Marques", role: "Violão / Líder", bg: "#3a2010", cor: "#e8a06a", freq: 4 },
  { ini: "AL", nome: "Ana Lima",      role: "Vocal Lead",     bg: "#3b2e6e", cor: "#a89de8", freq: 4 },
  { ini: "RM", nome: "Rafael M.",     role: "Vocal 2",        bg: "#1e2e3a", cor: "#6ab0e8", freq: 3 },
  { ini: "MC", nome: "Marcos C.",     role: "Guitarra",       bg: "#1e3a2a", cor: "#6dbf97", freq: 3 },
  { ini: "JR", nome: "João R.",       role: "Teclado",        bg: "#2a1e3a", cor: "#b898e8", freq: 4 },
  { ini: "PS", nome: "Paula S.",      role: "Bateria",        bg: "#1e2838", cor: "#6aaee8", freq: 2 },
  { ini: "LF", nome: "Luana F.",      role: "Baixo",          bg: "#3a1e1e", cor: "#e86a6a", freq: 3 },
];

const TOTAL_ESCALAS = 4;
