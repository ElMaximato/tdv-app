// ============================================================
//  scoreColors.ts — Paleta de scores 0-100
//  Importar desde cualquier componente que muestre scores
// ============================================================

export interface ScoreStyle {
  color:      string   // color del texto/número
  glow:       string   // text-shadow / box-shadow glow
  bg:         string   // fondo semitransparente para paneles
  border:     string   // color de borde
  label:      string   // etiqueta descriptiva
}

/**
 * Devuelve los estilos visuales para un score en escala 0–100.
 * 100       → Dorado legendario
 * 95–99     → Azul diamante
 * 90–94     → Verde esmeralda
 * 80–89     → Bronce elegante
 * 70–79     → Naranja
 * < 70      → Gris/muted
 */
export function getScoreStyle(score: number): ScoreStyle {
  if (score === 100) return {
    color:  '#FFD700',
    glow:   '0 0 16px #FFD70080, 0 0 32px #FFD70040',
    bg:     'rgba(255,215,0,0.10)',
    border: 'rgba(255,215,0,0.40)',
    label:  'Legendario',
  }
  if (score >= 95) return {
    color:  '#4FC3F7',                         // azul diamante
    glow:   '0 0 14px #4FC3F780, 0 0 28px #4FC3F740',
    bg:     'rgba(79,195,247,0.10)',
    border: 'rgba(79,195,247,0.35)',
    label:  'Diamante',
  }
  if (score >= 90) return {
    color:  '#00E676',                         // verde esmeralda
    glow:   '0 0 12px #00E67670, 0 0 24px #00E67640',
    bg:     'rgba(0,230,118,0.09)',
    border: 'rgba(0,230,118,0.35)',
    label:  'Excelente',
  }
  if (score >= 80) return {
    color:  '#CD7F32',                         // bronce elegante
    glow:   '0 0 10px #CD7F3260, 0 0 20px #CD7F3230',
    bg:     'rgba(205,127,50,0.10)',
    border: 'rgba(205,127,50,0.35)',
    label:  'Muy bueno',
  }
  if (score >= 70) return {
    color:  '#FF7043',                         // naranja
    glow:   '0 0 10px #FF704360, 0 0 20px #FF704330',
    bg:     'rgba(255,112,67,0.09)',
    border: 'rgba(255,112,67,0.30)',
    label:  'Bueno',
  }
  return {
    color:  '#9E9E9E',
    glow:   'none',
    bg:     'rgba(158,158,158,0.08)',
    border: 'rgba(158,158,158,0.20)',
    label:  'Regular',
  }
}

/** Colores para los tabs de puntuaje en la UI */
export const SCORE_TAB_STYLES = {
  '95 +':  { activeColor: '#4FC3F7', activeBg: 'rgba(79,195,247,0.15)',  glow: '0 0 12px #4FC3F760' },
  '90':    { activeColor: '#00E676', activeBg: 'rgba(0,230,118,0.12)',   glow: '0 0 12px #00E67660' },
  '80':    { activeColor: '#CD7F32', activeBg: 'rgba(205,127,50,0.12)',  glow: '0 0 10px #CD7F3260' },
  '79 -':  { activeColor: '#FF7043', activeBg: 'rgba(255,112,67,0.10)',  glow: '0 0 10px #FF704360' },
  'TODOS': { activeColor: '#90CAF9', activeBg: 'rgba(144,202,249,0.10)', glow: '0 0 10px #90CAF960' },
} as const
