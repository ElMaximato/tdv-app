import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface TopGame {
  id: number; title: string; slug: string
  cover_image: string | null; hero_image: string | null
  release_year: number | null; platform: string
  emilio_score: number; developer: string | null
  accent_color: string | null; summary: string | null
}

const resolveImg = (p: string | null) => !p ? null : p.startsWith('http') ? p : `${API}/uploads/${p}`

export function Hero() {
  const [topGame,   setTopGame]   = useState<TopGame | null>(null)
  const [stats,     setStats]     = useState({ games: 0, consoles: 0, elites: 0 })
  const [scrollY,   setScrollY]   = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/games?sort=emilio_score&limit=1`)
      .then(r => r.json()).then(d => { if (d.data?.[0]) setTopGame(d.data[0]) }).catch(() => {})

    Promise.all([
      fetch(`${API}/api/games?limit=1`).then(r => r.json()),
      fetch(`${API}/api/platforms`).then(r => r.json()),
      fetch(`${API}/api/games?sort=emilio_score&limit=100`).then(r => r.json()),
    ]).then(([g, p, all]) => {
      setStats({
        games:    g.meta?.total ?? 0,
        consoles: Array.isArray(p) ? p.length : 0,
        elites:   (all.data ?? []).filter((x: any) => Number(x.emilio_score) >= 95).length,
      })
    }).catch(() => {})

    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const heroImg = topGame ? resolveImg(topGame.hero_image || topGame.cover_image) : null
  const score   = topGame ? Number(topGame.emilio_score) : null
  const ss      = score != null ? getScoreStyle(score) : null
  const accent  = topGame?.accent_color || ss?.color || '#e60012'

  return (
    <section style={{ position: 'relative', minHeight: '92vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>

      {/* Fondo dinámico */}
      {heroImg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${heroImg})`,
          backgroundSize: 'cover', backgroundPosition: 'center 20%',
          transform: `translateY(${scrollY * 0.2}px)`,
          filter: `brightness(${imgLoaded ? 0.28 : 0}) saturate(1.4)`,
          transition: 'filter 1.2s ease', willChange: 'transform',
        }}>
          <img src={heroImg} alt="" style={{ display: 'none' }} onLoad={() => setImgLoaded(true)} />
        </div>
      )}
      {!heroImg && (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 80% at 60% 40%, rgba(230,0,18,0.1) 0%, transparent 60%), #06060e' }} />
      )}

      {/* Overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,14,0.15) 0%, rgba(6,6,14,0.5) 40%, rgba(6,6,14,0.98) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(6,6,14,0.92) 0%, rgba(6,6,14,0.4) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${accent}07 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      {/* Línea de acento superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 32px 72px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'flex-end' }}>

          {/* Columna izquierda */}
          <div style={{ maxWidth: 680 }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              color: accent, letterSpacing: 3, padding: '5px 14px',
              background: `${accent}12`, border: `1px solid ${accent}30`,
              borderRadius: 4, marginBottom: 28, animation: 'tdvFadeDown 0.6s ease-out both',
            }}>▶ TIEMPO DE VIDEOJUEGOS</div>

            {/* Título */}
            <h1 style={{
              fontFamily: '"VT323", monospace',
              fontSize: 'clamp(52px, 8vw, 96px)',
              color: '#fff', lineHeight: 0.95,
              textShadow: `0 0 80px ${accent}30`,
              marginBottom: 16, animation: 'tdvFadeUp 0.7s ease-out 0.1s both',
            }}>
              EL RANKING<br /><span style={{ color: accent }}>DEFINITIVO</span>
            </h1>

            {/* Descripción */}
            <p style={{
              fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
              maxWidth: 520, marginBottom: 32,
              animation: 'tdvFadeUp 0.7s ease-out 0.2s both',
            }}>
              Sin reseñas compradas. Solo el criterio de{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>Emilio</span>{' '}
              y los votos de la comunidad verificada.
            </p>

            {/* Juego #1 destacado */}
            {topGame && ss && (
              <Link to={`/game/${topGame.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32, animation: 'tdvFadeUp 0.7s ease-out 0.25s both' }}>
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${accent}25`,
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: '0 10px 10px 0',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                >
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: accent, marginBottom: 8, letterSpacing: 2 }}>
                    ★ #1 EN EL RANKING
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: '"VT323", monospace', fontSize: 24, color: '#fff' }}>
                      {topGame.title.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151' }}>
                      {topGame.platform}{topGame.release_year ? ` · ${topGame.release_year}` : ''}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: '"VT323", monospace', fontSize: 28, color: ss.color, textShadow: ss.glow }}>
                      {score}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'tdvFadeUp 0.7s ease-out 0.3s both' }}>
              <Link to="/rankings" style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                color: '#fff', background: '#e60012', border: 'none', borderRadius: 8,
                padding: '12px 22px', textDecoration: 'none', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(230,0,18,0.35)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(230,0,18,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(230,0,18,0.35)' }}
              >▶ VER RANKING</Link>

              <Link to="/95" style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                color: '#fbbf24', background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8,
                padding: '12px 22px', textDecoration: 'none', transition: 'background 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.15)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.08)' }}
              >★ 95+</Link>

              <Link to="/sagas" style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                padding: '12px 22px', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
              >📚 SAGAS</Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, minWidth: 140, animation: 'tdvFadeLeft 0.7s ease-out 0.3s both' }}>
            {[
              { value: stats.games    || '—', label: 'JUEGOS',    color: '#e60012' },
              { value: stats.consoles || '—', label: 'CONSOLAS',  color: '#4FC3F7' },
              { value: stats.elites   || '—', label: 'ÉLITES 95+',color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, textAlign: 'center', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontFamily: '"VT323", monospace', fontSize: 40, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#374151', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll line */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', opacity: Math.max(0, 1 - scrollY / 300) }}>
        <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${accent}, transparent)`, animation: 'heroPulse 1.5s infinite' }} />
      </div>

      <style>{`
        @keyframes tdvFadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tdvFadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tdvFadeLeft { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes heroPulse   { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
    </section>
  )
}