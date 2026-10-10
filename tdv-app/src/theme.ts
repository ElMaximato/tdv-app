// Mismos colores que la web (tailwind.config.js) para que la app se sienta igual.
export const colors = {
  bg: '#0f0f1a',
  card: '#1e1e32',
  elevated: '#2a2a42',
  text: '#e8e8f0',
  muted: '#8888a8',
  dim: '#55556a',
  red: '#e60012',
  blue: '#3b82f6',
  gold: '#fbbf24',
  green: '#22c55e',
  cyan: '#06b6d4',
  border: 'rgba(255,255,255,0.10)',
  glass: 'rgba(255,255,255,0.05)',
};

export const fonts = {
  pixel: 'PressStart2P_400Regular',
  display: 'VT323_400Regular',
};

export const radius = { md: 12, lg: 16, xl: 20 };

// Color de la nota (0-100): igual que en la web, de verde (élite) a rojo.
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return colors.dim;
  if (score >= 95) return colors.gold;
  if (score >= 90) return colors.green;
  if (score >= 80) return colors.cyan;
  if (score >= 70) return colors.blue;
  return colors.muted;
}
