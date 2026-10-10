// ============================================================
//  src/app/config/avatars-config.ts
//  Configuración centralizada de avatares y temas de perfil
//  Importar desde Navbar.tsx y ProfilePage.tsx
// ============================================================

const BACKEND = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ─── AVATARES ─────────────────────────────────────────────────
// Las imágenes deben estar en: backend/uploads/avatars/<id>.png
// Por ahora usan placeholder visual. Cuando tengas los PNGs,
// solo colócalos en esa carpeta con el nombre correcto (ej: mario.png)
export interface AvatarConfig {
  id:    string
  label: string
  src:   string   // URL a la imagen PNG
  color: string   // color dominante del personaje
  bg:    string   // gradiente de fondo en la tarjeta
  desc:  string
}

export const AVATARS: AvatarConfig[] = [
  {
    id:    'mario',
    label: 'Mario',
    src:   `${BACKEND}/uploads/avatars/mario.png`,
    color: '#e60012',
    bg:    'linear-gradient(135deg,#2a0008,#4a0012)',
    desc:  'El fontanero más famoso del mundo',
  },
  {
    id:    'link',
    label: 'Link',
    src:   `${BACKEND}/uploads/avatars/link.png`,
    color: '#22c55e',
    bg:    'linear-gradient(135deg,#002010,#004020)',
    desc:  'Portador del Coraje, héroe de Hyrule',
  },
  {
    id:    'yoshi',
    label: 'Yoshi',
    src:   `${BACKEND}/uploads/avatars/yoshi.png`,
    color: '#4ade80',
    bg:    'linear-gradient(135deg,#001a08,#003015)',
    desc:  'El dinosaurio más adorable de Nintendo',
  },
  {
    id:    'donkey-kong',
    label: 'Donkey Kong',
    src:   `${BACKEND}/uploads/avatars/donkey-kong.png`,
    color: '#f59e0b',
    bg:    'linear-gradient(135deg,#1a0e00,#302000)',
    desc:  'Rey de la jungla y guardián de las bananas',
  },
  {
    id:    'samus',
    label: 'Samus',
    src:   `${BACKEND}/uploads/avatars/samus.png`,
    color: '#f97316',
    bg:    'linear-gradient(135deg,#1a0800,#301500)',
    desc:  'La cazarrecompensas más letal de la galaxia',
  },
  {
    id:    'pikachu',
    label: 'Pikachu',
    src:   `${BACKEND}/uploads/avatars/pikachu.png`,
    color: '#fbbf24',
    bg:    'linear-gradient(135deg,#1a1400,#2d2200)',
    desc:  'El Pokémon más icónico del mundo',
  },
  {
    id:    'fox',
    label: 'Fox McCloud',
    src:   `${BACKEND}/uploads/avatars/fox.png`,
    color: '#fb923c',
    bg:    'linear-gradient(135deg,#1a0a00,#2d1500)',
    desc:  'Líder del Equipo Star Fox',
  },
  {
    id:    'kirby',
    label: 'Kirby',
    src:   `${BACKEND}/uploads/avatars/kirby.png`,
    color: '#f472b6',
    bg:    'linear-gradient(135deg,#1a0010,#2d0025)',
    desc:  'La estrella rosada de Dream Land',
  },
  {
    id:    'luigi',
    label: 'Luigi',
    src:   `${BACKEND}/uploads/avatars/luigi.png`,
    color: '#86efac',
    bg:    'linear-gradient(135deg,#002010,#004020)',
    desc:  'El hermano menor, el verdadero héroe',
  },
  {
    id:    'toad',
    label: 'Toad',
    src:   `${BACKEND}/uploads/avatars/toad.png`,
    color: '#60a5fa',
    bg:    'linear-gradient(135deg,#000a1a,#001530)',
    desc:  'El más veloz de la Mushroom Kingdom',
  },
  {
    id:    'bowser',
    label: 'Bowser',
    src:   `${BACKEND}/uploads/avatars/bowser.png`,
    color: '#84cc16',
    bg:    'linear-gradient(135deg,#101a00,#1a2d00)',
    desc:  'El rey de los Koopas y némesis de Mario',
  },
  {
    id:    'peach',
    label: 'Peach',
    src:   `${BACKEND}/uploads/avatars/peach.png`,
    color: '#f9a8d4',
    bg:    'linear-gradient(135deg,#1a0a14,#2d1525)',
    desc:  'La princesa del Reino Champiñón',
  },
]

// Helper: obtener avatar por ID (nunca retorna undefined)
export function getAvatar(id: string | null | undefined): AvatarConfig {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0]
}

// ─── TEMAS DE PERFIL ──────────────────────────────────────────
// Cada tema define fondo + color acento + patrón visual
export interface ProfileTheme {
  id:       string
  label:    string
  category: string
  // Fondo del hero banner
  heroBg:   string
  // Patrón decorativo (CSS background)
  pattern:  string
  // Color acento principal
  accent:   string
  // Color secundario
  secondary: string
}

export const PROFILE_THEMES: ProfileTheme[] = [
  // ── NINTENDO ──────────────────────────────────────────────
  {
    id: 'hyrule',
    label: 'Hyrule Field',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#0a1f0a 0%,#1a4d1a 40%,#0d2b0d 100%)',
    pattern:   'radial-gradient(#22c55e12 1px,transparent 1px)',
    accent:    '#22c55e',
    secondary: '#86efac',
  },
  {
    id: 'mushroom',
    label: 'Mushroom Kingdom',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#1a0005 0%,#4a0012 40%,#1a0005 100%)',
    pattern:   'radial-gradient(#e6001212 1px,transparent 1px)',
    accent:    '#e60012',
    secondary: '#fbbf24',
  },
  {
    id: 'galaxy',
    label: 'Galaxia',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#00001a 0%,#000d3a 40%,#050520 100%)',
    pattern:   'radial-gradient(#818cf812 1px,transparent 1px)',
    accent:    '#818cf8',
    secondary: '#c7d2fe',
  },
  {
    id: 'metroid',
    label: 'Planeta Zebes',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 50%,#000 100%)',
    pattern:   'radial-gradient(#f9731612 1px,transparent 1px)',
    accent:    '#f97316',
    secondary: '#fed7aa',
  },
  {
    id: 'pokemon',
    label: 'Kanto',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#0a0a1a 0%,#1a1a40 50%,#0a0a2a 100%)',
    pattern:   'radial-gradient(#fbbf2412 1px,transparent 1px)',
    accent:    '#fbbf24',
    secondary: '#fde68a',
  },
  {
    id: 'dreamland',
    label: 'Dream Land',
    category: 'Nintendo',
    heroBg:    'linear-gradient(135deg,#1a0010 0%,#3d0030 50%,#1a0020 100%)',
    pattern:   'radial-gradient(#f472b612 1px,transparent 1px)',
    accent:    '#f472b6',
    secondary: '#fbcfe8',
  },
  // ── CONSOLAS ──────────────────────────────────────────────
  {
    id: 'snes',
    label: 'SNES',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#181623 0%,#3d386a 40%,#100f18 100%)',
    pattern:   'radial-gradient(#a78bfa12 1px,transparent 1px)',
    accent:    '#a78bfa',
    secondary: '#ddd6fe',
  },
  {
    id: 'n64',
    label: 'Nintendo 64',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#001a00 0%,#003388 33%,#880011 66%,#443300 100%)',
    pattern:   'radial-gradient(#ffd70012 1px,transparent 1px)',
    accent:    '#ffd700',
    secondary: '#fff3b0',
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#0a0a18 0%,#1e1e3e 50%,#050510 100%)',
    pattern:   'radial-gradient(#60a5fa12 1px,transparent 1px)',
    accent:    '#60a5fa',
    secondary: '#bfdbfe',
  },
  {
    id: 'gamecube',
    label: 'GameCube',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#0a0018 0%,#3b0080 50%,#050008 100%)',
    pattern:   'radial-gradient(#c084fc12 1px,transparent 1px)',
    accent:    '#c084fc',
    secondary: '#e9d5ff',
  },
  {
    id: 'gba',
    label: 'Game Boy Advance',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#080a1a 0%,#1a1f50 50%,#050708 100%)',
    pattern:   'radial-gradient(#6366f112 1px,transparent 1px)',
    accent:    '#6366f1',
    secondary: '#c7d2fe',
  },
  {
    id: 'dreamcast',
    label: 'Dreamcast',
    category: 'Consolas',
    heroBg:    'linear-gradient(135deg,#1a0800 0%,#7a2000 50%,#0a0400 100%)',
    pattern:   'radial-gradient(#fb923c12 1px,transparent 1px)',
    accent:    '#fb923c',
    secondary: '#fed7aa',
  },
  // ── ESPECIALES ────────────────────────────────────────────
  {
    id: 'midnight',
    label: 'Midnight',
    category: 'Especiales',
    heroBg:    'linear-gradient(135deg,#050508 0%,#0f0f1a 100%)',
    pattern:   'radial-gradient(#ffffff06 1px,transparent 1px)',
    accent:    '#ffffff',
    secondary: '#9ca3af',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    category: 'Especiales',
    heroBg:    'linear-gradient(135deg,#0a0000 0%,#2a0000 50%,#0a0000 100%)',
    pattern:   'radial-gradient(#e6001218 1px,transparent 1px)',
    accent:    '#e60012',
    secondary: '#fca5a5',
  },
  {
    id: 'cyber',
    label: 'Cyber',
    category: 'Especiales',
    heroBg:    'linear-gradient(135deg,#000a0a 0%,#003333 50%,#000a0a 100%)',
    pattern:   'radial-gradient(#00ffff12 1px,transparent 1px)',
    accent:    '#06b6d4',
    secondary: '#67e8f9',
  },
]

export function getTheme(id: string | null | undefined): ProfileTheme {
  return PROFILE_THEMES.find(t => t.id === id) ?? PROFILE_THEMES[0]
}

// Categorías únicas para el selector de temas
export const THEME_CATEGORIES = [...new Set(PROFILE_THEMES.map(t => t.category))]
