import { useState, useEffect } from 'react'
import { Link } from 'react-router'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ─── SVG fallbacks por slug ───────────────────────────────────
// Solo se usan cuando la consola NO tiene hero_console_img en la BD.
// Para agregar imagen real: Admin → Plataformas → hero_console_img
const SVG_FALLBACKS: Record<string, string> = {
  snes: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="4" y="14" width="56" height="24" fill="#d1d5db" stroke="#4b5563" stroke-width="2"/>
    <rect x="8" y="18" width="48" height="4" fill="#9ca3af"/>
    <rect x="8" y="26" width="20" height="8" fill="#374151"/>
    <rect x="32" y="28" width="8" height="4" fill="#7c3aed"/>
    <rect x="42" y="28" width="8" height="4" fill="#a855f7"/>
    <rect x="52" y="28" width="4" height="4" fill="#6b21a8"/>
  </svg>`,
  n64: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <path d="M8 16 L14 10 L50 10 L56 16 L56 38 L8 38 Z" fill="#1f2937" stroke="#000" stroke-width="2"/>
    <rect x="14" y="16" width="36" height="6" fill="#374151"/>
    <circle cx="20" cy="30" r="3" fill="#9ca3af"/>
    <circle cx="32" cy="30" r="3" fill="#ef4444"/>
    <circle cx="44" cy="30" r="3" fill="#3b82f6"/>
  </svg>`,
  ngc: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="14" y="12" width="36" height="32" fill="#6b21a8" stroke="#000" stroke-width="2"/>
    <circle cx="32" cy="22" r="6" fill="#4c1d95" stroke="#000" stroke-width="1"/>
    <circle cx="32" cy="22" r="2" fill="#1f2937"/>
    <rect x="20" y="34" width="6" height="2" fill="#4c1d95"/>
    <rect x="38" y="34" width="6" height="2" fill="#4c1d95"/>
    <rect x="22" y="8" width="20" height="4" fill="#4c1d95"/>
  </svg>`,
  wii: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="26" y="4" width="12" height="40" fill="#f3f4f6" stroke="#9ca3af" stroke-width="1"/>
    <rect x="28" y="8" width="8" height="6" fill="#d1d5db"/>
    <circle cx="32" cy="22" r="3" fill="#9ca3af"/>
    <rect x="29" y="28" width="6" height="4" fill="#d1d5db"/>
    <rect x="30" y="34" width="4" height="3" fill="#9ca3af"/>
  </svg>`,
  ps1: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="4" y="14" width="56" height="24" fill="#e5e7eb" stroke="#000" stroke-width="2"/>
    <circle cx="18" cy="26" r="8" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/>
    <circle cx="18" cy="26" r="3" fill="#374151"/>
    <rect x="32" y="20" width="24" height="4" fill="#6b7280"/>
    <rect x="32" y="28" width="16" height="2" fill="#6b7280"/>
    <rect x="40" y="34" width="8" height="2" fill="#2563eb"/>
  </svg>`,
  ps2: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="6" y="10" width="52" height="28" fill="#1f2937" stroke="#000" stroke-width="2"/>
    <rect x="10" y="14" width="44" height="8" fill="#111827"/>
    <rect x="12" y="16" width="20" height="4" fill="#3b82f6"/>
    <circle cx="50" cy="26" r="2" fill="#60a5fa"/>
    <rect x="10" y="26" width="20" height="6" fill="#374151"/>
  </svg>`,
  gbc: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="18" y="4" width="28" height="40" fill="#6b7280" stroke="#000" stroke-width="2"/>
    <rect x="22" y="8" width="20" height="14" fill="#86efac"/>
    <circle cx="26" cy="32" r="2" fill="#1f2937"/>
    <circle cx="38" cy="32" r="2" fill="#1f2937"/>
    <rect x="28" y="38" width="8" height="2" fill="#1f2937"/>
  </svg>`,
  gb: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="18" y="4" width="28" height="40" fill="#9ca3af" stroke="#000" stroke-width="2"/>
    <rect x="22" y="8" width="20" height="14" fill="#4b5563"/>
    <circle cx="26" cy="32" r="2" fill="#1f2937"/>
    <circle cx="38" cy="32" r="2" fill="#1f2937"/>
    <rect x="28" y="38" width="8" height="2" fill="#1f2937"/>
  </svg>`,
  gba: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="4" y="14" width="56" height="24" fill="#6366f1" stroke="#000" stroke-width="2"/>
    <rect x="18" y="18" width="28" height="14" fill="#312e81"/>
    <rect x="22" y="22" width="20" height="6" fill="#a5b4fc"/>
    <circle cx="10" cy="26" r="3" fill="#312e81"/>
    <circle cx="54" cy="26" r="3" fill="#312e81"/>
  </svg>`,
  md: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="4" y="18" width="56" height="20" fill="#1f2937" stroke="#000" stroke-width="2"/>
    <rect x="8" y="22" width="48" height="4" fill="#374151"/>
    <rect x="26" y="12" width="12" height="8" fill="#374151" stroke="#000" stroke-width="1"/>
    <rect x="8" y="30" width="10" height="4" fill="#dc2626"/>
    <rect x="46" y="30" width="10" height="4" fill="#dc2626"/>
  </svg>`,
  sat: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="6" y="14" width="52" height="24" fill="#374151" stroke="#000" stroke-width="2"/>
    <rect x="10" y="18" width="44" height="6" fill="#1f2937"/>
    <circle cx="32" cy="30" r="4" fill="#1f2937"/>
    <circle cx="12" cy="30" r="2" fill="#dc2626"/>
    <circle cx="52" cy="30" r="2" fill="#3b82f6"/>
  </svg>`,
  dc: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="4" y="14" width="56" height="24" fill="#f3f4f6" stroke="#000" stroke-width="2"/>
    <circle cx="40" cy="26" r="8" fill="#d1d5db" stroke="#6b7280" stroke-width="1"/>
    <circle cx="40" cy="26" r="3" fill="#374151"/>
    <rect x="10" y="20" width="16" height="3" fill="#f97316"/>
    <rect x="10" y="26" width="16" height="3" fill="#f97316"/>
    <rect x="10" y="32" width="12" height="2" fill="#6b7280"/>
  </svg>`,
  xbox: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="6" y="10" width="52" height="28" fill="#111827" stroke="#000" stroke-width="2"/>
    <circle cx="32" cy="24" r="10" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
    <path d="M26 18 L38 30 M38 18 L26 30" stroke="#000" stroke-width="2"/>
  </svg>`,
  pc: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="image-rendering:pixelated">
    <rect x="8" y="8" width="48" height="28" fill="#1f2937" stroke="#000" stroke-width="2"/>
    <rect x="12" y="12" width="40" height="20" fill="#0d9488"/>
    <rect x="14" y="14" width="4" height="2" fill="#5eead4"/>
    <rect x="14" y="18" width="10" height="2" fill="#5eead4"/>
    <rect x="14" y="22" width="6" height="2" fill="#5eead4"/>
    <rect x="24" y="38" width="16" height="4" fill="#4b5563"/>
    <rect x="20" y="42" width="24" height="2" fill="#4b5563"/>
  </svg>`,
}

// Color acento por defecto si la BD no trae accent_color
const DEFAULT_COLORS: Record<string, string> = {
  snes: '#a855f7', n64: '#16a34a', ngc: '#7c3aed', wii: '#e5e7eb',
  ps1: '#3b82f6', ps2: '#1e40af', gbc: '#14b8a6', gb: '#6b7280',
  gba: '#6366f1', md: '#1e40af', sat: '#4b5563', dc: '#2563eb',
  xbox: '#16a34a', pc: '#6b7280',
}

interface Platform {
  id: number
  name: string
  slug: string
  manufacturer: string | null
  release_year: number | null
  hero_console_img: string | null
  accent_color: string | null
  is_published: boolean
}

// ─── Componente imagen con fallback SVG ───────────────────────
function ConsoleImage({ platform, color }: { platform: Platform; color: string }) {
  const [imgError, setImgError] = useState(false)
  const hasImg = platform.hero_console_img && !imgError
  const svgFallback = SVG_FALLBACKS[platform.slug]

  if (hasImg) {
    return (
      <img
        src={`${API}/uploads/${platform.hero_console_img}`}
        alt={platform.name}
        onError={() => setImgError(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: `drop-shadow(0 4px 12px ${color}60)`,
          transition: 'transform 0.3s ease',
        }}
      />
    )
  }

  if (svgFallback) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgFallback }}
      />
    )
  }

  // Fallback genérico — consola nueva sin imagen ni SVG
  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-1">
      <span style={{ fontSize: 28 }}>🕹️</span>
      <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: 'rgba(255,255,255,0.3)' }}>
        {platform.name.slice(0, 8).toUpperCase()}
      </span>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function ConsolesPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch(`${API}/api/platforms`)
      .then(r => r.json())
      .then(setPlatforms)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="retro-bar inline-flex rounded-lg mb-4">
          <span>🕹 SELECTOR DE CONSOLA</span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-white leading-none mb-3">
          SELECCIONA TU <span style={{ color: 'var(--accent-red)' }}>CONSOLA</span>
        </h1>
        <p className="text-text-muted text-sm max-w-xl mx-auto">
          Explora los rankings por plataforma. Cada consola tiene su propia identidad,
          su propia cultura, y sus propios clásicos.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <p className="font-pixel animate-pulse" style={{ fontSize: 8, color: '#fbbf24' }}>
            CARGANDO CONSOLAS...
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {platforms.map(platform => {
            const color = platform.accent_color || DEFAULT_COLORS[platform.slug] || '#6b7280'

            return (
              <Link key={platform.slug} to={`/console/${platform.slug}`} className="group block">
                <div
                  className="glass-card p-4 transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${color}50`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  {/* Glow hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${color}22 0%, transparent 70%)` }}
                  />

                  {/* Corner accent */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 transition-all duration-300"
                    style={{ background: `linear-gradient(135deg, ${color} 50%, transparent 50%)`, opacity: 0.6 }}
                  />

                  <div className="relative">
                    {/* Imagen o SVG */}
                    <div
                      className="w-full aspect-[4/3] rounded-lg p-3 mb-3 flex items-center justify-center overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                        border: `1px solid ${color}33`,
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <ConsoleImage platform={platform} color={color} />
                      </div>
                    </div>

                    {/* Nombre */}
                    <h3
                      className="font-display text-2xl leading-none text-center"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {platform.name}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      {platform.manufacturer && (
                        <span className="font-pixel text-text-dim" style={{ fontSize: 6 }}>
                          {platform.manufacturer}
                        </span>
                      )}
                      {platform.manufacturer && platform.release_year && (
                        <span className="text-text-dim" style={{ fontSize: 10 }}>·</span>
                      )}
                      {platform.release_year && (
                        <span className="font-pixel" style={{ fontSize: 6, color }}>
                          {platform.release_year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Placeholder "próximamente" */}
          {!loading && platforms.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="font-pixel text-text-dim" style={{ fontSize: 8 }}>SIN CONSOLAS AÚN</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-text-dim text-xs">
          ¿No encuentras tu consola favorita?{' '}
          <Link to="/rankings" className="text-accent-blue hover:underline">
            Ver todos los rankings →
          </Link>
        </p>
      </div>
    </div>
  )
}