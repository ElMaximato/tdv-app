import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface ReviewedGame {
  id: number; title: string; slug: string
  cover_image: string | null; release_year: number | null
  platform: string; emilio_score: number
  summary: string | null; is_gem: number; is_essential: number
  developer: string | null
}

const resolveImg = (p: string | null) => !p ? null : p.startsWith('http') ? p : `${API}/uploads/${p}`

export function RecentAnalysis() {
  const [games,   setGames]   = useState<ReviewedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    // Juegos con reseña de Emilio — ordenados por score, los mejores primero
    fetch(`${API}/api/games?sort=emilio_score&limit=6`)
      .then(r => r.json())
      .then(d => setGames(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section style={{ padding: '64px 24px', background: '#06060e' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              color: '#e60012', letterSpacing: 2,
              padding: '4px 12px', background: 'rgba(230,0,18,0.08)',
              border: '1px solid rgba(230,0,18,0.2)', borderRadius: 4, marginBottom: 12,
            }}>▶ CRITERIO EDITORIAL</div>
            <h2 style={{ fontFamily: '"VT323", monospace', fontSize: 44, color: '#fff', margin: 0, lineHeight: 1 }}>
              ANÁLISIS DE <span style={{ color: '#e60012' }}>EMILIO</span>
            </h2>
          </div>
          <Link to="/rankings" style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 7,
            color: '#374151', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#374151' }}
          >VER TODOS →</Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(18,18,30,0.9)', borderRadius: 14, height: 160, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {games.map(game => {
              const score  = Number(game.emilio_score)
              const ss     = getScoreStyle(score)
              const cover  = resolveImg(game.cover_image)
              const isHov  = hovered === game.id

              return (
                <Link key={game.id} to={`/game/${game.slug}`} style={{ textDecoration: 'none' }}
                  onMouseEnter={() => setHovered(game.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div style={{
                    display: 'flex', gap: 0, overflow: 'hidden',
                    borderRadius: 14, height: 140,
                    background: 'rgba(14,14,24,0.95)',
                    border: `1px solid ${isHov ? `${ss.color}40` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isHov ? `0 0 30px ${ss.color}15` : 'none',
                    transform: isHov ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.25s ease',
                  }}>
                    {/* Portada */}
                    <div style={{ width: 96, flexShrink: 0, overflow: 'hidden', position: 'relative', background: '#1a1a2e' }}>
                      {cover ? (
                        <img src={cover} alt={game.title} style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          transform: isHov ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.35s ease',
                        }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: '"VT323", monospace', fontSize: 28, color: '#374151' }}>?</span>
                        </div>
                      )}
                      {/* Línea de color */}
                      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, background: ss.color, opacity: 0.6 }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#4b5563' }}>
                            {game.platform}{game.release_year ? ` · ${game.release_year}` : ''}
                          </span>
                          {game.is_gem === 1 && (
                            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#fbbf24' }}>💎 GEM</span>
                          )}
                          {game.is_essential === 1 && (
                            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#e60012' }}>⭐ ESS</span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 style={{
                          fontFamily: '"VT323", monospace', fontSize: 22,
                          color: isHov ? '#fff' : '#e8e0d0',
                          lineHeight: 1.1, margin: '0 0 6px',
                          transition: 'color 0.2s',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{game.title.toUpperCase()}</h3>

                        {/* Summary */}
                        {game.summary && (
                          <p style={{
                            fontSize: 11, color: '#4b5563', lineHeight: 1.5, margin: 0,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{game.summary}</p>
                        )}
                      </div>

                      {/* Score */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151' }}>NOTA EMILIO</span>
                        <span style={{ fontFamily: '"VT323", monospace', fontSize: 28, color: ss.color, textShadow: isHov ? ss.glow : 'none', lineHeight: 1 }}>
                          {score}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}