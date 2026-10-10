import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'
import { useAuth } from '../hooks/useAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function resolveImg(p: string | null) {
  if (!p) return null
  return p.startsWith('http') ? p : `${API}/uploads/${p}`
}

// ─── Votador ──────────────────────────────────────────────────
function StarVoter({ gameId }: { gameId: number }) {
  const { isLoggedIn, authFetch } = useAuth()
  const [vote,    setVote]    = useState<number | null>(null)
  const [hover,   setHover]   = useState<number | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [message, setMessage] = useState('')

  async function castVote(score: number) {
    if (!isLoggedIn) { setMessage('Inicia sesión para votar'); return }
    setSaving(true)
    try {
      const res = await authFetch(`${API}/api/games/${gameId}/vote`, {
        method: 'POST', body: JSON.stringify({ score }),
      })
      const d = await res.json()
      if (res.ok) { setVote(score); setMessage('¡Voto guardado!') }
      else setMessage(d.error || 'Error al votar')
    } catch { setMessage('Error de conexión') }
    finally { setSaving(false); setTimeout(() => setMessage(''), 3000) }
  }

  const display = hover ?? vote
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} disabled={saving}
            onClick={() => castVote(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: 28, height: 28, borderRadius: 6, border: 'none',
              background: display != null && n <= display ? '#e60012' : 'rgba(255,255,255,0.06)',
              color: display != null && n <= display ? '#fff' : '#4b5563',
              fontFamily: '"Press Start 2P", monospace', fontSize: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s',
              transform: hover === n ? 'scale(1.15)' : 'scale(1)',
            }}>{n}</button>
        ))}
        {vote != null && (
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#4b5563', marginLeft: 4 }}>
            TU VOTO: {vote}/10
          </span>
        )}
      </div>
      {message && (
        <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, marginTop: 8,
          color: message.includes('!') ? '#22c55e' : '#e60012' }}>{message}</p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  LAYOUT EDITORIAL — juegos 95+
// ════════════════════════════════════════════════════════════
function EditorialLayout({ game }: { game: any }) {
  const score     = Number(game.score_overall)
  const ss        = getScoreStyle(score)
  const heroImg   = resolveImg(game.hero_image || game.cover_image)
  const coverImg  = resolveImg(game.cover_image)
  const isPerfect = score === 100
  const [scrollY, setScrollY] = useState(0)

  // Datos de la featured page — usamos accent_color si existe
  const accentColor   = game.accent_color || ss.color
  const tagline       = game.tagline       || game.summary || null
  const pressQuotes   = Array.isArray(game.press_quotes)   ? game.press_quotes   : []
  const highlights    = Array.isArray(game.feature_highlights) ? game.feature_highlights : []
  const screenshots   = Array.isArray(game.screenshots)    ? game.screenshots    : []
  const longDesc      = game.long_description || null

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div style={{ background: '#06060e', minHeight: '100vh', color: '#e8e0d0' }}>

      {/* ── HERO CINEMATOGRÁFICO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>

        {/* Imagen fondo con parallax */}
        {heroImg && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
            transform: `translateY(${scrollY * 0.28}px)`,
            filter: 'brightness(0.32) saturate(1.3)',
            willChange: 'transform',
          }} />
        )}

        {/* Overlays multicapa */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,14,0.2) 0%, rgba(6,6,14,0.55) 45%, rgba(6,6,14,0.98) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(6,6,14,0.85) 0%, transparent 60%)' }} />

        {/* Línea score superior — usa accent_color del admin */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: isPerfect
            ? 'linear-gradient(90deg, transparent, #ffcc00, #ffd700, #ffcc00, transparent)'
            : `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: 24, left: 32, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/95" style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 6,
            color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ss.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
          >← 95+</Link>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>·</span>
          <Link to="/rankings" style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 6,
            color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)' }}
          >RANKING</Link>
        </div>

        {/* Contenido del hero */}
        <div style={{
          position: 'relative', zIndex: 10,
          maxWidth: 1100, margin: '0 auto',
          padding: '0 32px 72px', width: '100%',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 40, alignItems: 'flex-end',
        }}>
          {/* Texto izquierda */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                color: '#fff', background: 'rgba(255,255,255,0.08)',
                padding: '4px 10px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.12)',
              }}>{game.platform_name || game.platform}</span>
              {game.release_year && (
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#4b5563' }}>{game.release_year}</span>
              )}
              {isPerfect && (
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ffcc00', background: 'rgba(255,204,0,0.1)', padding: '4px 10px', borderRadius: 3, border: '1px solid rgba(255,204,0,0.3)' }}>★ PERFECTO</span>
              )}
              {game.is_essential === 1 && (
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#e60012', background: 'rgba(230,0,18,0.1)', padding: '4px 10px', borderRadius: 3, border: '1px solid rgba(230,0,18,0.3)' }}>⭐ ESENCIAL</span>
              )}
              {game.is_gem === 1 && (
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: 3, border: '1px solid rgba(251,191,36,0.3)' }}>💎 JOYA OCULTA</span>
              )}
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: '"VT323", monospace',
              fontSize: 'clamp(52px, 8vw, 100px)',
              color: '#fff', lineHeight: 0.95,
              textShadow: `0 0 80px ${ss.color}50`,
              marginBottom: 16, textTransform: 'uppercase',
            }}>{game.title}</h1>

            {game.developer && (
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                por <span style={{ color: '#9ca3af' }}>{game.developer}</span>
                {game.publisher && game.publisher !== game.developer ? ` · ${game.publisher}` : ''}
              </p>
            )}

            {/* Tagline — primero usa tagline del admin, luego summary */}
            {tagline && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 560, fontStyle: 'italic' }}>
                "{tagline}"
              </p>
            )}
          </div>

          {/* Score visual derecha */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{
              width: 140, height: 140, borderRadius: 16,
              background: 'rgba(0,0,0,0.7)', border: `3px solid ${accentColor}`,
              boxShadow: `0 0 40px ${accentColor}35, inset 0 0 30px rgba(0,0,0,0.5)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, backdropFilter: 'blur(12px)',
            }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: accentColor, letterSpacing: 2 }}>EMILIO</div>
              <div style={{
                fontFamily: '"VT323", monospace', fontSize: isPerfect ? 64 : 72,
                color: accentColor, textShadow: `0 0 20px ${accentColor}80`, lineHeight: 1,
              }}>{score}</div>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: 'rgba(255,255,255,0.2)' }}>/ 100</div>
            </div>
            {game.community_avg != null && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151', marginBottom: 4 }}>COMUNIDAD</div>
                <div style={{ fontFamily: '"VT323", monospace', fontSize: 28, color: '#4FC3F7' }}>
                  {game.community_avg}<span style={{ fontSize: 16, color: '#374151' }}>/10</span>
                </div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151' }}>{game.vote_count} votos</div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          opacity: Math.max(0, 1 - scrollY / 200),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: 'rgba(255,255,255,0.2)' }}>SCROLL</span>
          <div style={{ width: 1, height: 32, background: `linear-gradient(to bottom, ${ss.color}, transparent)`, animation: 'tdvPulse 1.5s infinite' }} />
        </div>
      </section>

      {/* ── CUERPO EDITORIAL ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 32px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 56, alignItems: 'start' }}>

          {/* Portada fija lateral */}
          <div style={{ position: 'sticky', top: 90 }}>
            {coverImg && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${ss.color}30`, boxShadow: `0 0 40px ${ss.color}15, 0 20px 40px rgba(0,0,0,0.5)` }}>
                <img src={coverImg} alt={game.title} style={{ width: '100%', display: 'block' }} />
              </div>
            )}

            {game.genres?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {game.genres.map((g: any) => (
                  <span key={g.slug} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#4b5563', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 3 }}>{g.name}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'PLATAFORMA', value: game.platform_name },
                { label: 'AÑO',        value: game.release_year },
                { label: 'DEVELOPER',  value: game.developer },
                { label: 'JUGADO EN',  value: game.played_year },
                { label: 'HORAS',      value: game.hours_played ? `~${game.hours_played}h` : null },
              ].filter(d => d.value).map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151', flexShrink: 0 }}>{d.label}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reseña */}
          <div>
            {/* Header reseña */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
              <div style={{ width: 36, height: 3, background: accentColor, borderRadius: 2 }} />
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: accentColor, letterSpacing: 2 }}>RESEÑA DE EMILIO</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Descripción larga del admin (si existe) o review_body */}
            {longDesc ? (
              <div style={{ fontSize: 17, lineHeight: 1.9, color: '#9ca3af', marginBottom: 20 }}>
                {longDesc.split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ marginBottom: 20 }}>{para}</p>
                ))}
              </div>
            ) : game.review_body ? (
              <div style={{ fontSize: 17, lineHeight: 1.9, color: '#9ca3af' }}>
                {game.review_body.split('\n\n').map((para: string, i: number) => (
                  <p key={i} style={{ marginBottom: 20 }}>{para}</p>
                ))}
              </div>
            ) : (
              <p style={{ color: '#374151', fontSize: 14, fontStyle: 'italic' }}>Reseña completa próximamente.</p>
            )}

            {/* Nota personal */}
            {game.personal_note && (
              <div style={{
                margin: '40px 0', padding: '24px 28px',
                borderLeft: `4px solid ${accentColor}`,
                background: `${accentColor}08`, borderRadius: '0 12px 12px 0',
              }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: accentColor, marginBottom: 12, letterSpacing: 1 }}>
                  💭 NOTA PERSONAL DE EMILIO
                </div>
                <p style={{ fontSize: 16, color: '#d1d5db', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
                  "{game.personal_note}"
                </p>
              </div>
            )}

            {/* Desglose de scores */}
            {(game.score_gameplay || game.score_story || game.score_graphics || game.score_soundtrack || game.score_longevity) && (
              <div style={{ marginTop: 40 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#374151', letterSpacing: 2, marginBottom: 20 }}>DESGLOSE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'GAMEPLAY',   value: game.score_gameplay },
                    { label: 'HISTORIA',   value: game.score_story },
                    { label: 'GRÁFICOS',   value: game.score_graphics },
                    { label: 'SOUNDTRACK', value: game.score_soundtrack },
                    { label: 'DURACIÓN',   value: game.score_longevity },
                  ].filter(s => s.value != null).map(s => {
                    const v = Number(s.value)
                    const ss2 = getScoreStyle(v)
                    return (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151', minWidth: 80 }}>{s.label}</span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${v}%`, height: '100%', background: ss2.color, boxShadow: `0 0 6px ${ss2.color}80` }} />
                        </div>
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: ss2.color, minWidth: 28, textAlign: 'right' }}>{v}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Aspectos destacados del admin ── */}
            {highlights.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 3, background: accentColor, borderRadius: 2 }} />
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#374151', letterSpacing: 2 }}>ASPECTOS CLAVE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {highlights.map((h: any, i: number) => (
                    <div key={i} style={{
                      padding: '18px 20px',
                      background: `${accentColor}08`,
                      border: `1px solid ${accentColor}20`,
                      borderTop: `3px solid ${accentColor}`,
                      borderRadius: '0 0 10px 10px',
                    }}>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: accentColor, marginBottom: 8 }}>
                        {h.title}
                      </div>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Citas de prensa ── */}
            {pressQuotes.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 3, background: accentColor, borderRadius: 2 }} />
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#374151', letterSpacing: 2 }}>PRENSA</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pressQuotes.map((q: any, i: number) => (
                    <div key={i} style={{
                      padding: '20px 24px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderLeft: `3px solid ${accentColor}40`,
                      borderRadius: '0 10px 10px 0',
                    }}>
                      <p style={{ fontSize: 16, color: '#d1d5db', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 10px' }}>
                        "{q.text}"
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: accentColor }}>
                          {q.source}
                        </span>
                        {q.rating != null && (
                          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151' }}>
                            · {q.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Galería de screenshots ── */}
            {screenshots.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 3, background: accentColor, borderRadius: 2 }} />
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#374151', letterSpacing: 2 }}>GALERÍA</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {screenshots.map((s: any, i: number) => {
                    const src = resolveImg(typeof s === 'string' ? s : s.path)
                    if (!src) return null
                    return (
                      <div key={i} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#1a1a2e' }}>
                        <img src={src} alt={s.caption || `Screenshot ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Voto */}
            <div style={{ marginTop: 48, padding: '28px', background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#374151', letterSpacing: 2, marginBottom: 16 }}>TU VOTO</div>
              <StarVoter gameId={game.id} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tdvPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  LAYOUT ESTÁNDAR — resto de juegos
// ════════════════════════════════════════════════════════════
function StandardLayout({ game }: { game: any }) {
  const score    = game.score_overall != null ? Number(game.score_overall) : null
  const ss       = score != null ? getScoreStyle(score) : null
  const coverImg = resolveImg(game.cover_image)

  return (
    <div style={{ background: '#06060e', minHeight: '100vh', color: '#e8e0d0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        <Link to="/rankings" style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
          color: '#374151', textDecoration: 'none', display: 'inline-block', marginBottom: 28, transition: 'color 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#374151' }}
        >← VOLVER AL RANKING</Link>

        <div style={{ background: 'rgba(14,14,24,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {ss && <div style={{ height: 3, background: `linear-gradient(90deg, ${ss.color}, transparent)` }} />}

          <div style={{ padding: '32px 36px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, alignItems: 'start' }}>

              {/* Portada */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                {coverImg ? (
                  <img src={coverImg} alt={game.title} style={{ width: '100%', display: 'block' }} />
                ) : (
                  <div style={{ aspectRatio: '3/4', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"VT323", monospace', fontSize: 32, color: '#374151' }}>?</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#fff', background: 'rgba(255,255,255,0.07)', padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {game.platform_name}
                  </span>
                  {game.release_year && (
                    <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#4b5563' }}>{game.release_year}</span>
                  )}
                  {game.is_essential === 1 && (
                    <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#e60012', background: 'rgba(230,0,18,0.1)', padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(230,0,18,0.25)' }}>⭐ ESENCIAL</span>
                  )}
                  {game.is_gem === 1 && (
                    <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(251,191,36,0.25)' }}>💎 JOYA OCULTA</span>
                  )}
                </div>

                <h1 style={{ fontFamily: '"VT323", monospace', fontSize: 'clamp(36px,5vw,60px)', color: '#fff', lineHeight: 1, marginBottom: 12, textTransform: 'uppercase' }}>
                  {game.title}
                </h1>

                {game.developer && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    por {game.developer}{game.publisher && game.publisher !== game.developer ? ` · ${game.publisher}` : ''}
                  </p>
                )}

                {game.description && (
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>{game.description}</p>
                )}

                {game.genres?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                    {game.genres.map((g: any) => (
                      <span key={g.slug} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#4b5563', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 3 }}>{g.name}</span>
                    ))}
                  </div>
                )}

                {/* Scores */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                  {score != null && ss && (
                    <div style={{ padding: '16px 24px', borderRadius: 10, background: `${ss.color}10`, border: `1px solid ${ss.color}30`, textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: ss.color, marginBottom: 4 }}>EMILIO</div>
                      <div style={{ fontFamily: '"VT323", monospace', fontSize: 44, color: ss.color, textShadow: ss.glow, lineHeight: 1 }}>{score}</div>
                    </div>
                  )}
                  {game.community_avg != null && (
                    <div style={{ padding: '16px 24px', borderRadius: 10, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#4FC3F7', marginBottom: 4 }}>COMUNIDAD</div>
                      <div style={{ fontFamily: '"VT323", monospace', fontSize: 44, color: '#4FC3F7', lineHeight: 1 }}>{game.community_avg}</div>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#374151', marginTop: 2 }}>{game.vote_count} votos</div>
                    </div>
                  )}
                </div>

                {/* Voto */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151', marginBottom: 12 }}>TU VOTO</div>
                  <StarVoter gameId={game.id} />
                </div>
              </div>
            </div>

            {/* Reseña si existe */}
            {game.review_body && (
              <div style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  {ss && <div style={{ width: 28, height: 3, background: ss.color, borderRadius: 2 }} />}
                  <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: ss?.color || '#6b7280', letterSpacing: 2 }}>RESEÑA DE EMILIO</span>
                </div>
                {game.summary && (
                  <p style={{ fontSize: 16, color: '#6b7280', fontStyle: 'italic', marginBottom: 20 }}>"{game.summary}"</p>
                )}
                <div style={{ fontSize: 15, lineHeight: 1.8, color: '#9ca3af' }}>
                  {game.review_body.split('\n\n').map((p: string, i: number) => (
                    <p key={i} style={{ marginBottom: 16 }}>{p}</p>
                  ))}
                </div>
                {game.personal_note && (
                  <div style={{ marginTop: 24, padding: '20px 24px', borderLeft: `3px solid ${ss?.color || '#6b7280'}`, background: `${ss?.color || '#6b7280'}08`, borderRadius: '0 10px 10px 0' }}>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: ss?.color || '#6b7280', marginBottom: 10 }}>💭 NOTA PERSONAL</div>
                    <p style={{ fontSize: 15, color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>"{game.personal_note}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  ROUTER PRINCIPAL
// ════════════════════════════════════════════════════════════
export function GameDetailPage() {
  const { slug }  = useParams()
  const [game,    setGame]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/games/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(setGame)
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06060e' }}>
      <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fbbf24', animation: 'tdvPulse 1s infinite' }}>CARGANDO...</p>
      <style>{`@keyframes tdvPulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
    </div>
  )

  if (!game) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#06060e' }}>
      <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#e60012' }}>JUEGO NO ENCONTRADO</p>
      <Link to="/rankings" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#4b5563', textDecoration: 'none' }}>← VOLVER AL RANKING</Link>
    </div>
  )

  const score = game.score_overall != null ? Number(game.score_overall) : 0
  if (score >= 95 || game.has_featured_page) return <EditorialLayout game={game} />
  return <StandardLayout game={game} />
}