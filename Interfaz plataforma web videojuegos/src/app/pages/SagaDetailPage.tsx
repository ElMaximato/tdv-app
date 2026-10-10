import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'
import { Navbar } from '../components/Navbar' // Importación del Navbar

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface SagaEntry {
  id: number
  position: number
  is_essential: boolean
  is_optional: boolean
  emilio_verdict: string | null
  play_reason: string | null
  skip_reason: string | null
  custom_title: string | null
  custom_platform: string | null
  custom_year: number | null
  game_id: number | null
  game_title: string | null
  game_slug: string | null
  game_cover: string | null
  release_year: number | null
  developer: string | null
  platform_name: string | null
  emilio_score: number | null
  game_summary: string | null
}

interface Saga {
  id: number
  slug: string
  name: string
  short_description: string | null
  intro_text: string | null
  emilio_note: string | null
  cover_image: string | null
  hero_image: string | null
  accent_color: string
  publisher: string | null
  first_game_year: number | null
  entries: SagaEntry[]
}

function resolveImg(p: string | null) {
  if (!p) return null
  return p.startsWith('http') ? p : `${API}/uploads/${p}`
}

export function SagaDetailPage() {
  const { slug } = useParams()
  const [saga, setSaga] = useState<Saga | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/sagas/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(setSaga)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-pixel animate-blink" style={{ fontSize: 9, color: '#fbbf24' }}>CARGANDO...</p>
    </div>
  )
  if (!saga) return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
      <p className="font-pixel" style={{ fontSize: 9, color: '#e60012' }}>SAGA NO ENCONTRADA</p>
      <Link to="/sagas" className="btn-secondary">← Volver a Sagas</Link>
    </div>
  )

  const accent = saga.accent_color || '#e60012'
  const heroImg = resolveImg(saga.hero_image || saga.cover_image)
  const essentials = saga.entries.filter(e => e.is_essential)
  const total = saga.entries.length

  return (
    <>
      <Navbar />
      <div style={{ background: '#080810', minHeight: '100vh', color: '#e8e8f0' }}>

        {/* ══════════════════════════════════════════════════════
            HERO CINEMATOGRÁFICO (SIN TOCAR)
            ══════════════════════════════════════════════════════ */}
        <section style={{ position: 'relative', minHeight: '92vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
          {heroImg && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${heroImg})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              transform: `translateY(${scrollY * 0.25}px)`,
              filter: 'brightness(0.45) saturate(1.2)',
              willChange: 'transform',
            }} />
          )}

          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, rgba(8,8,16,0.3) 0%, rgba(8,8,16,0.5) 40%, rgba(8,8,16,0.92) 80%, rgba(8,8,16,1) 100%)`,
          }} />
          
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '0 32px 72px', width: '100%' }}>
            <Link to="/sagas" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
              ← TODAS LAS SAGAS
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {saga.publisher && (
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: accent, padding: '4px 12px', background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 4 }}>
                  {saga.publisher.toUpperCase()}
                </span>
              )}
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>
                {total} {total === 1 ? 'JUEGO' : 'JUEGOS'}
              </span>
            </div>

            <h1 style={{ fontFamily: '"VT323", monospace', fontSize: 'clamp(52px, 9vw, 110px)', color: '#fff', lineHeight: 0.9, textShadow: `0 0 60px ${accent}40`, marginBottom: 20, textTransform: 'uppercase' }}>
              {saga.name}
            </h1>

            {saga.short_description && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 560, lineHeight: 1.6, marginBottom: 32 }}>
                {saga.short_description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Numero de juegos', value: total },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, backdropFilter: 'blur(12px)' }}>
                  <div style={{ fontFamily: '"VT323", monospace', fontSize: 30, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#4b5563', marginTop: 10 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CUERPO — LISTA DE JUEGOS (CORREGIDO)
            ══════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1600, margin: '0 0 0 32px', padding: '64px 32px 100px' }}>

          {/* Intro editorial */}
          {saga.intro_text && (
            <section style={{ marginBottom: 72 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 40, alignItems: 'start' }}>
                <div>
                  <div className="retro-bar inline-flex rounded-lg mb-3">
                    <span>📖 LA SAGA</span>
                  </div>
                  <div style={{ width: '100%', height: 1, background: `linear-gradient(to right, ${accent}, transparent)`, marginTop: 16 }} />
                </div>
                <div style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.9, columnCount: 2, columnGap: 32 }}>
                  {saga.intro_text.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: 16, breakInside: 'avoid' }}>{para}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Lista de juegos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
            <h2 className="font-display text-white" style={{ fontSize: 40, margin: 0 }}>
              ORDEN DE <span style={{ color: accent }}>JUEGO</span>
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {saga.entries.map((entry, idx) => {
              const title = entry.game_title ?? entry.custom_title ?? 'Sin título'
              const platform = entry.platform_name ?? entry.custom_platform ?? ''
              const year = entry.release_year ?? entry.custom_year
              const cover = resolveImg(entry.game_cover)
              const score = entry.emilio_score != null ? Number(entry.emilio_score) : null
              const scoreStyle = score != null ? getScoreStyle(score) : null

              return (
  <div
    key={entry.id}
    style={{
      display: 'flex',
      alignItems: 'stretch',
      gap: 32,
      width: '100%',
    }}
  >
    {/* TARJETA PRINCIPAL */}
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: '70px 160px 1fr',
        background: 'rgba(14,14,24,0.8)',
        border: `1px solid ${
          entry.is_essential
            ? `${accent}35`
            : 'rgba(255,255,255,0.06)'
        }`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 220,
      }}
    >
      {/* Posición */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          style={{
            fontFamily: '"VT323", monospace',
            fontSize: 42,
            color: entry.is_essential ? accent : '#2a2a3a',
          }}
        >
          {entry.position}
        </span>
      </div>

     {/* Portada izquierda */}
<div
  style={{
    background: '#05050a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    overflow: 'hidden',
  }}
>
  {cover ? (
    <img
      src={cover}
      alt={title}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  ) : (
    <div
      className="font-pixel"
      style={{
        fontSize: 8,
        color: '#2a2a3a',
      }}
    >
      NO COVER
    </div>
  )}
</div>

      {/* Contenido */}
      <div
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {entry.is_essential && (
            <span
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 6,
                color: '#fff',
                background: accent,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              ⭐ ESENCIAL
            </span>
          )}

          <span
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              color: '#4b5563',
            }}
          >
            {platform.toUpperCase()}
            {year ? ` · ${year}` : ''}
          </span>
        </div>

        <h3
          className="font-display text-white"
          style={{
            fontSize: 32,
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title.toUpperCase()}
        </h3>

        {entry.emilio_verdict && (
          <p
            style={{
              fontSize: 18,
              color: '#9ca3af',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {entry.emilio_verdict}
          </p>
        )}

        {entry.play_reason && (
          <div
            style={{
              marginTop: 4,
              fontSize: 16,
              color: '#6b7280',
            }}
          >
            {entry.play_reason}
          </div>
        )}
      </div>

      {/* Score */}
      {score != null && scoreStyle && (
        <div
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            padding: '4px 8px',
            background: '#000',
            border: `1px solid ${scoreStyle.color}`,
            borderRadius: 4,
          }}
        >
          <span
            className="font-pixel"
            style={{
              color: scoreStyle.color,
              fontSize: 12,
            }}
          >
            {score}
          </span>
        </div>
      )}
    </div>

    {/* PANEL DERECHO — GAMEPLAY */}
<div
  style={{
    width: 420,
    flexShrink: 0,
    aspectRatio: '16 / 9',
    borderRadius: 16,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    alignSelf: 'center',
  }}
>
  {cover ? (
    <img
      src={cover}
      alt={`${title} gameplay`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 8,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        padding: 20,
      }}
    >
      GAMEPLAY
    </div>
  )}
</div>
  </div>
)
            })}
          </div>

          {/* Nota final */}
          <div style={{ marginTop: 80, textAlign: 'center' }}>
            <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#1f2937', letterSpacing: 2 }}>
              — FIN DE LA GUÍA · EMILIO, TIEMPO DE VIDEOJUEGOS —
            </p>
            <Link to="/sagas" style={{ display: 'inline-block', marginTop: 20 }} className="btn-secondary">
              ← Ver otras sagas
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}