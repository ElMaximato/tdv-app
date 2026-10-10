import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Navbar } from '../components/Navbar' // Importación del Navbar

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface SagaCard {
  id: number
  slug: string
  name: string
  short_description: string | null
  cover_image: string | null
  hero_image: string | null
  accent_color: string
  publisher: string | null
  first_game_year: number | null
  game_count: number
}

function resolveImg(p: string | null) {
  if (!p) return null
  return p.startsWith('http') ? p : `${API}/uploads/${p}`
}

export function SagasPage() {
  const [sagas,   setSagas]   = useState<SagaCard[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API}/api/sagas`)
      .then(r => r.json())
      .then(setSagas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-pixel animate-blink" style={{ fontSize: 9, color: '#fbbf24' }}>CARGANDO SAGAS...</p>
    </div>
  )

  return (
   
    <div style={{ background: '#0a0a14', minHeight: '100vh' }}>

      {/* ── Hero de la sección ── */}
      <div style={{
        position: 'relative', padding: '80px 24px 60px',
        background: 'linear-gradient(180deg, rgba(15,5,0,0.95) 0%, #0a0a14 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Patrón de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(230,0,18,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div className="retro-bar inline-flex rounded-lg mb-4">
            <span>▶ GUÍAS DE EMILIO</span>
          </div>
          <h1 className="font-display text-white" style={{ fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1, marginBottom: 16 }}>
            CÓMO JUGAR A<br />
            <span style={{ color: '#e60012' }}>LAS GRANDES SAGAS</span>
          </h1>
          <p className="font-body" style={{ fontSize: 16, color: '#9ca3af', maxWidth: 560, lineHeight: 1.7 }}>
            GUIAS DEFINITIVAS escritas por Emilio sobre el orden ideal para descubrir
            cada saga. 
          </p>
        </div>
      </div>

      {/* ── Grid de sagas ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 80px' }}>

        {sagas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p className="font-pixel" style={{ fontSize: 8, color: '#374151' }}>
              PRÓXIMAMENTE
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {sagas.map(saga => {
              const isHov = hovered === saga.id
              const accent = saga.accent_color || '#e60012'
              const cover  = resolveImg(saga.cover_image)

              return (
                <Link
                  key={saga.id}
                  to={`/sagas/${saga.slug}`}
                  onMouseEnter={() => setHovered(saga.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'block', textDecoration: 'none',
                    borderRadius: 16, overflow: 'hidden',
                    position: 'relative',
                    border: `1px solid ${isHov ? `${accent}50` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isHov ? `0 0 40px ${accent}20, 0 20px 40px rgba(0,0,0,0.5)` : '0 4px 20px rgba(0,0,0,0.4)',
                    transform: isHov ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Imagen de portada */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0f0f1a', overflow: 'hidden' }}>
                    {cover ? (
                      <img
                        src={cover}
                        alt={saga.name}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          transform: isHov ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                    ) : (
                      // Placeholder con gradiente del color acento
                      <div style={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, #0f0f1a 0%, ${accent}30 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span className="font-display text-white" style={{ fontSize: 40, opacity: 0.3 }}>
                          {saga.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Overlay gradiente */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(to bottom, transparent 30%, rgba(10,10,20,0.95) 100%)`,
                    }} />

                    {/* Badge de publisher */}
                    {saga.publisher && (
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                        color: '#fff', background: 'rgba(0,0,0,0.6)',
                        border: `1px solid ${accent}50`,
                        borderRadius: 4, padding: '3px 8px',
                        backdropFilter: 'blur(8px)',
                        letterSpacing: 1,
                      }}>
                        {saga.publisher.toUpperCase()}
                      </div>
                    )}

                    {/* Número de juegos */}
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                      color: accent, background: 'rgba(0,0,0,0.6)',
                      border: `1px solid ${accent}40`,
                      borderRadius: 4, padding: '3px 8px',
                      backdropFilter: 'blur(8px)',
                    }}>
                      {saga.game_count} {saga.game_count === 1 ? 'JUEGO' : 'JUEGOS'}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{
                    padding: '20px 20px 22px',
                    background: 'rgba(14,14,24,0.98)',
                  }}>
                    {/* Línea de acento */}
                    <div style={{
                      width: 32, height: 3, borderRadius: 2,
                      background: accent, marginBottom: 12,
                      transition: 'width 0.3s ease',
                      ...(isHov ? { width: 56 } : {}),
                    }} />

                    <h2 className="font-display text-white" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 8 }}>
                      {saga.name.toUpperCase()}
                    </h2>

                    {saga.short_description && (
                      <p className="font-body" style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 14 }}>
                        {saga.short_description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {saga.first_game_year && (
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151' }}>
                          DESDE {saga.first_game_year}
                        </span>
                      )}
                      <span style={{
                        fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                        color: accent,
                        marginLeft: 'auto',
                        transition: 'gap 0.2s',
                      }}>
                        LEER GUÍA →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
