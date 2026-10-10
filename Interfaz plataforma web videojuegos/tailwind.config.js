/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:         { DEFAULT: '#0f0f1a', card: '#1e1e32', elevated: '#2a2a42' },
        text:       { DEFAULT: '#e8e8f0', muted: '#8888a8', dim: '#55556a' },
        accent:     { red: '#e60012', blue: '#3b82f6', gold: '#fbbf24', green: '#22c55e', cyan: '#06b6d4' },
        glass:      { DEFAULT: 'rgba(255,255,255,0.05)', hover: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.1)' },
        console:    { snes: '#6b21a8', n64: '#16a34a', ps1: '#2563eb', ps2: '#1e40af', ngc: '#7c3aed', gba: '#4f46e5', gbc: '#0d9488' },
      },
      fontFamily: {
        pixel:   ['"Press Start 2P"', 'monospace'],
        display: ['"VT323"', 'monospace'],
        body:    ['"Outfit"', 'sans-serif'],
      },
      fontSize: { '2xs': '10px' },
      borderRadius: { '2xl': '16px', '3xl': '20px' },
      backdropBlur: { glass: '20px' },
    },
  },
  plugins: [],
}