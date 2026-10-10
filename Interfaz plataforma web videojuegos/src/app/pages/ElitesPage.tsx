import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface EliteGame {
  id: number
  title: string
  slug: string
  cover_image: string | null
  release_year: number | null
  platform: string
  platform_slug: string
  emilio_score: number
  community_avg: number | null
  vote_count: number
  is_gem: number
  is_essential: number
  developer: string | null
  composite_score: number
}

function resolveImg(p: string | null) {
  if (!p) return null
  return p.startsWith('http') ? p : `${API}/uploads/${p}`
}

export function ElitesPage() {
  const [games,   setGames]   = useState<EliteGame[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/games?sort=emilio_score&limit=100`)
      .then(r => r.json())
      .then(d => {
        const elites = (d.data ?? []).filter((g: EliteGame) => Number(g.emilio_score) >= 95)
        setGames(elites)
      })
      .finally(() => setLoading(false))
  }, [])

  // Separar el #1 (score más alto) del resto
  const sorted = [...games].sort((a, b) => Number(b.emilio_score) - Number(a.emilio_score))
  const crown  = sorted[0]
  const rest   = sorted.slice(1)

  return (
    <div style={{ background: '#06060e', minHeight: '100vh', color: '#e8e0d0' }}>

      {/* ── HERO DE SECCIÓN ── */}
      <div style={{
        position: 'relative',
        padding: '72px 24px 56px',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Fondo con patrón */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(230,0,18,0.12) 0%, transparent 70%),
            radial-gradient(rgba(255,204,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 28px 28px',
        }} />

        {/* Línea de acento superior */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #e60012, #ffcc00, #e60012, transparent)',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: '"Press Start 2P", monospace', fontSize: 7,
            color: '#ffcc00', letterSpacing: 3,
            padding: '5px 14px',
            background: 'rgba(255,204,0,0.08)',
            border: '1px solid rgba(255,204,0,0.25)',
            borderRadius: 4, marginBottom: 24,
          }}>
            ★ SALÓN DE LA FAMA · EMILIO
          </div>

          <h1 style={{
            fontFamily: '"VT323", monospace',
            fontSize: 'clamp(60px, 10vw, 120px)',
            color: '#fff', lineHeight: 0.9,
            textShadow: '0 0 60px rgba(230,0,18,0.4)',
            marginBottom: 16,
          }}>
            <span style={{ color: '#e60012' }}>95</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span>
          </h1>

          <p style={{
            fontSize: 16, color: '#6b7280',
            maxWidth: 480, margin: '0 auto 12px',
            lineHeight: 1.7,
          }}>
            Los únicos juegos que Emilio considera obras maestras absolutas.
            Una puntuación de 95 o más no se regala.
          </p>

          <div style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 7,
            color: '#374151',
          }}>
            {loading ? '...' : `${games.length} ${games.length === 1 ? 'OBRA MAESTRA' : 'OBRAS MAESTRAS'}`}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffcc00', animation: 'pulse 1s infinite' }}>
              CARGANDO...
            </p>
          </div>
        )}

        {!loading && games.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#374151' }}>
              AÚN NO HAY JUEGOS CON 95+
            </p>
            <p style={{ fontSize: 13, color: '#4b5563', marginTop: 12 }}>
              Emilio no ha puntuado ningún juego con 95 o más todavía.
            </p>
          </div>
        )}

        {/* ── JUEGO #1 — DESTACADO GRANDE ── */}
        {crown && (() => {
          const score = Number(crown.emilio_score)
          const ss    = getScoreStyle(score)
          const img   = resolveImg(crown.cover_image)
          const isPerfect = score === 100

          return (
            <div style={{ marginBottom: 56 }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                color: '#ffcc00', letterSpacing: 3,
                marginBottom: 20,
              }}>
                ▲ LA CIMA ABSOLUTA
              </div>

              <Link to={`/game/${crown.slug}`} style={{ textDecoration: 'none', display: 'block' }}
                onMouseEnter={() => setHovered(crown.slug)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '280px 1fr',
                  gap: 0,
                  borderRadius: 16, overflow: 'hidden',
                  border: `1px solid ${isPerfect ? 'rgba(255,204,0,0.4)' : `${ss.color}35`}`,
                  boxShadow: hovered === crown.slug
                    ? `0 0 60px ${ss.color}25, 0 20px 60px rgba(0,0,0,0.6)`
                    : `0 8px 40px rgba(0,0,0,0.5)`,
                  transform: hovered === crown.slug ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.3s ease',
                  background: '#0f0f1a',
                }}>
                  {/* Portada */}
                  <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', flexShrink: 0 }}>
                    {img ? (
                      <img src={img} alt={crown.title} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transform: hovered === crown.slug ? 'scale(1.04)' : 'scale(1)',
                        transition: 'transform 0.4s ease',
                      }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: '"VT323", monospace', fontSize: 40, color: '#374151' }}>?</span>
                      </div>
                    )}
                    {/* Score encima */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.9)',
                      borderTop: `3px solid ${ss.color}`,
                      borderLeft: `3px solid ${ss.color}`,
                    }}>
                      <div style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: isPerfect ? 18 : 22,
                        color: ss.color,
                        textShadow: ss.glow,
                        lineHeight: 1,
                      }}>{score}</div>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>EMILIO</div>
                    </div>
                    {/* Línea superior de color */}
                    {isPerfect && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #ffcc00, #ffd700, #ffcc00)',
                      }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                        color: '#fff', background: 'rgba(255,255,255,0.08)',
                        padding: '3px 8px', borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>{crown.platform}</span>
                      {crown.release_year && (
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#4b5563' }}>
                          {crown.release_year}
                        </span>
                      )}
                      {isPerfect && (
                        <span style={{
                          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                          color: '#ffcc00', background: 'rgba(255,204,0,0.1)',
                          padding: '3px 8px', borderRadius: 3,
                          border: '1px solid rgba(255,204,0,0.3)',
                        }}>★ PERFECTO</span>
                      )}
                    </div>

                    <h2 style={{
                      fontFamily: '"VT323", monospace',
                      fontSize: 'clamp(36px, 4vw, 60px)',
                      color: '#fff', lineHeight: 1,
                      textShadow: hovered === crown.slug ? `0 0 30px ${ss.color}50` : 'none',
                      transition: 'text-shadow 0.3s',
                    }}>
                      {crown.title.toUpperCase()}
                    </h2>

                    {crown.developer && (
                      <p style={{ fontSize: 13, color: '#6b7280' }}>por {crown.developer}</p>
                    )}

                    <div style={{
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                      color: ss.color, marginTop: 8,
                    }}>
                      LEER RESEÑA COMPLETA →
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        })()}

        {/* ── RESTO DE JUEGOS 95+ ── */}
        {rest.length > 0 && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              marginBottom: 28,
            }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                color: '#374151', letterSpacing: 2,
              }}>
                TAMBIÉN EN EL 95+
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}>
              {rest.map((game, idx) => {
                const score = Number(game.emilio_score)
                const ss    = getScoreStyle(score)
                const img   = resolveImg(game.cover_image)
                const isHov = hovered === game.slug

                return (
                  <Link
                    key={game.slug}
                    to={`/game/${game.slug}`}
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={() => setHovered(game.slug)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div style={{
                      borderRadius: 12, overflow: 'hidden',
                      border: `1px solid ${isHov ? `${ss.color}40` : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isHov ? `0 0 30px ${ss.color}15, 0 12px 30px rgba(0,0,0,0.4)` : '0 4px 16px rgba(0,0,0,0.3)',
                      transform: isHov ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.25s ease',
                      background: '#0f0f1a',
                      animation: `fadeUp 0.4s ease-out ${idx * 0.04}s both`,
                    }}>

                      {/* Portada */}
                      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#1a1a2e' }}>
                        {img ? (
                          <img src={img} alt={game.title} style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transform: isHov ? 'scale(1.06)' : 'scale(1)',
                            transition: 'transform 0.35s ease',
                          }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: '"VT323", monospace', fontSize: 32, color: '#374151' }}>?</span>
                          </div>
                        )}

                        {/* Score */}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          padding: '5px 8px',
                          background: 'rgba(0,0,0,0.88)',
                          borderTop: `2px solid ${ss.color}`,
                          borderLeft: `2px solid ${ss.color}`,
                        }}>
                          <span style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: 11, color: ss.color,
                            textShadow: ss.glow,
                          }}>{score}</span>
                        </div>

                        {/* Rank badge */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                          color: 'rgba(255,255,255,0.4)',
                          background: 'rgba(0,0,0,0.6)',
                          padding: '2px 6px', borderRadius: 3,
                        }}>#{idx + 2}</div>
                      </div>

                      {/* Info */}
                      <div style={{ padding: '12px 14px' }}>
                        <h3 style={{
                          fontFamily: '"VT323", monospace',
                          fontSize: 20, color: isHov ? '#fff' : '#e8e0d0',
                          lineHeight: 1.1, marginBottom: 4,
                          transition: 'color 0.2s',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {game.title.toUpperCase()}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151' }}>
                            {game.platform}
                          </span>
                          {game.release_year && (
                            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151' }}>
                              {game.release_year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}