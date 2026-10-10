import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface ConsoleData {
  id: number
  name: string
  slug: string
  manufacturer: string | null
  release_year: number | null
  discontinued_year: number | null
  generation: string | null

  // Hero
  hero_title: string | null
  hero_subtitle: string | null
  hero_banner: string | null
  hero_logo: string | null
  hero_console_img: string | null

  // Contenido
  short_description: string | null
  full_history: string | null
  key_features: string[]
  tech_specs: { label: string; value: string }[]
  gallery: { path: string; caption: string }[]
  trivia: string[]

  // Tema
  accent_color: string
  secondary_color: string

  // Datos relacionados
  featured_games: any[]
  top_games: any[]
  total_games: number
  timeline: {
    id: number
    event_date: string | null
    event_year: number
    title: string
    description: string | null
    icon: string | null
  }[]

  // SEO
  meta_title: string | null
  meta_description: string | null
}

function resolveUrl(path: string | null): string {
  if (!path) return ''
  return path.startsWith('http') ? path : `${API}/uploads/${path}`
}

export function ConsolePage() {
  const { slug } = useParams()
  const [data, setData]       = useState<ConsoleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/platforms/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // SEO meta tags
  useEffect(() => {
    if (!data) return
    document.title = data.meta_title || `${data.name} · TDV`
    if (data.meta_description) {
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', data.meta_description)
    }
  }, [data])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 10 }}>CARGANDO CONSOLA...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-3">
        <p className="text-text-muted">Consola no encontrada</p>
        <Link to="/consolas" className="text-accent-red hover:underline">← Volver al selector</Link>
      </div>
    )
  }

  const accent    = data.accent_color    || '#e60012'
  const secondary = data.secondary_color || '#fbbf24'
  const ghostText = (data.hero_title || data.name).toUpperCase()

  // Agrupar timeline por año
  const timelineByYear: Record<number, typeof data.timeline> = {}
  data.timeline.forEach(t => {
    if (!timelineByYear[t.event_year]) timelineByYear[t.event_year] = []
    timelineByYear[t.event_year].push(t)
  })
  const timelineYears = Object.keys(timelineByYear).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#0a0a14' }}>

      {/* ═══════════════════════════════════════════════════
           HERO — Restaurado a tu diseño original con ajustes
           ═══════════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden flex flex-col justify-end"
        style={{ minHeight: 'calc(100vh - 56px)', marginTop: -32 }}
      >
        {/* Fondo con banner */}
        {data.hero_banner && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${resolveUrl(data.hero_banner)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `translateY(${scrollY * 0.4}px) scale(1.1)`,
              willChange: 'transform',
              filter: 'brightness(0.8)',
            }}
          />
        )}

        {/* Gradiente atmosférico */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 30%, ${accent}33 0%, transparent 60%),
              radial-gradient(ellipse at 70% 70%, ${secondary}22 0%, transparent 60%),
              linear-gradient(180deg, rgba(10,10,20,0.5) 0%, rgba(10,10,20,0.7) 50%, rgba(10,10,20,1) 100%)
            `,
          }}
        />

        {/* TÍTULO GIGANTE FANTASMA (Movido arriba y centrado) */}
        <div
          className="absolute top-0 left-0 w-full flex justify-center pointer-events-none overflow-hidden pt-16"
          style={{ zIndex: 1 }}
        >
          <div
            className="font-display whitespace-nowrap leading-none select-none"
            style={{
              fontSize: 'clamp(80px, 10vw, 220px)',
              color: secondary,
              opacity: 0.30,
              letterSpacing: '-0.02em',
              fontWeight: 900,
              transform: `translateY(${scrollY * -0.1}px)`,
              willChange: 'transform',
            }}
          >
            {ghostText}
          </div>
        </div>

        {/* Imagen de la consola FLOTANDO (Movida a la esquina derecha) */}
        {data.hero_console_img && (
          <div
            className="absolute right-0 bottom-0 pointer-events-none flex justify-end items-end pr-10 pb-10"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              willChange: 'transform',
              zIndex: 5,
            }}
          >
            <img
              src={resolveUrl(data.hero_console_img)}
              alt={data.name}
              className="max-h-[35vh] max-w-[55vw] object-contain"
              style={{
                filter: `drop-shadow(-20px 20px 50px rgba(0,0,0,0.8)) drop-shadow(0 0 60px ${accent}44)`,
              }}
            />
          </div>
        )}

        

        {/* CONTENIDO DEL HERO (Restaurado 100% igual a tu versión original) */}
        <div className="relative max-w-[1400px] w-full mx-auto px-6 pt-16 pb-12 flex flex-col min-h-[calc(100vh-56px)]" style={{ zIndex: 10 }}>

          {/* Top: breadcrumb + meta */}
          <div className="flex items-center gap-3 mb-auto">
            <Link to="/consolas" className="text-white/60 text-sm hover:text-white transition-colors">
              ← Consolas
            </Link>
            <span className="text-white/30">/</span>
            <span
              className="font-pixel px-2 py-1 rounded"
              style={{ fontSize: 7, background: accent, color: '#fff' }}
            >
              {data.manufacturer?.toUpperCase() || 'CONSOLE'} · PRESENTA
            </span>
          </div>

          {/* Bottom: logo + tagline + cta (Este es el que se había roto) */}
          <div className="mt-auto max-w-3xl pointer-events-auto">
            {/* Logo de la consola */}
            {data.hero_logo && (
              <img
                src={resolveUrl(data.hero_logo)}
                alt={data.name}
                className="max-h-32 mb-4"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.8))' }}
              />
            )}

            {!data.hero_logo && (
              <h1
                className="font-display leading-[0.85] mb-4"
                style={{
                  fontSize: 'clamp(56px, 7vw, 96px)',
                  color: '#fff',
                  textShadow: '0 4px 30px rgba(0,0,0,0.9)',
                  letterSpacing: '-0.02em',
                }}
              >
                {data.name.toUpperCase()}
              </h1>
            )}

            {data.hero_subtitle && (
              <p
                className="font-display uppercase mb-3"
                style={{
                  fontSize: 'clamp(18px, 2vw, 28px)',
                  color: secondary,
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                }}
              >
                {data.hero_subtitle}
              </p>
            )}

            {/* Meta info alineada horizontalmente como antes */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {data.release_year && (
                <div>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>LANZAMIENTO</div>
                  <div className="font-display text-white" style={{ fontSize: 24, lineHeight: 1 }}>{data.release_year}</div>
                </div>
              )}
              {data.discontinued_year && (
                <div>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>DESCONTINUADA</div>
                  <div className="font-display text-white" style={{ fontSize: 24, lineHeight: 1 }}>{data.discontinued_year}</div>
                </div>
              )}
              <div>
                <div className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>JUEGOS</div>
                <div className="font-display" style={{ fontSize: 24, lineHeight: 1, color: accent }}>{data.total_games}</div>
              </div>
              {data.generation && (
                <div>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>GENERACIÓN</div>
                  <div className="font-display text-white" style={{ fontSize: 24, lineHeight: 1 }}>{data.generation}ª</div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/rankings?platform=${data.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-transform hover:scale-105"
                style={{
                  background: accent,
                  boxShadow: `0 8px 24px ${accent}66`,
                }}
              >
                ▶ Ver todos los juegos
              </Link>
              {data.featured_games.length > 0 && (
                <a
                  href="#destacados"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:bg-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  ⭐ Juegos destacados
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
           SYNOPSIS — Sin cambios
           ═══════════════════════════════════════════════════ */}
      {data.full_history && (
        <section className="py-20 px-6 relative">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid md:grid-cols-[280px,1fr] gap-12 items-start">
              <div>
                <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>
                  SYNOPSIS
                </div>
                <h2 className="font-display leading-[0.95] mb-2" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                  HISTORIA Y<br />
                  <span style={{ color: accent }}>LEGADO</span>
                </h2>
                {data.short_description && (
                  <p className="text-text-muted text-sm mt-4 italic">"{data.short_description}"</p>
                )}
              </div>
              <div>
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap" style={{ fontSize: 17 }}>
                  {data.full_history}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           KEY FEATURES — Sin cambios
           ═══════════════════════════════════════════════════ */}
      {data.key_features.length > 0 && (
        <section className="py-12 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {data.key_features.map((feat, i) => (
                <span key={i} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${accent}33`, color: '#fff' }}>
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           BAJO EL CAPÓ + TOP 5 — Dividido en 2 columnas
           ═══════════════════════════════════════════════════ */}
      <section className="py-20 px-6 relative" style={{ background: 'rgba(15,15,26,0.5)' }}>
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Columna Izquierda: Especificaciones */}
          <div>
            <div className="mb-10">
              <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>ESPECIFICACIONES</div>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                BAJO EL <span style={{ color: accent }}>CAPÓ</span>
              </h2>
            </div>
            {data.tech_specs.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.tech_specs.map((spec, i) => (
                  <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(30,30,50,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${accent}` }}>
                    <div className="font-pixel mb-2" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>
                      {spec.label.toUpperCase()}
                    </div>
                    <div className="text-white font-semibold leading-tight" style={{ fontSize: 16 }}>
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Top 5 Juegos */}
          {data.top_games.length > 0 && (
            <div>
              <div className="mb-10">
                <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>RANKING</div>
                <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                  TOP 5 <span style={{ color: accent }}>SEGÚN EMILIO</span>
                </h2>
              </div>
              <div className="space-y-3">
                {data.top_games.slice(0, 5).map((game, i) => (
                  <Link key={game.id} to={`/game/${game.slug}`} className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/5 group" style={{ background: 'rgba(30,30,50,0.4)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="font-display shrink-0 text-center" style={{ fontSize: 36, color: i < 3 ? accent : 'rgba(255,255,255,0.3)', width: 50, lineHeight: 1 }}>
                      {i + 1}
                    </span>
                    {game.cover_image && (
                      <img src={resolveUrl(game.cover_image)} alt={game.title} className="rounded shrink-0 shadow-md" style={{ width: 52, height: 72, objectFit: 'cover' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-white text-xl leading-tight uppercase truncate">
                        {game.title}
                      </h3>
                      <p className="text-text-muted text-sm">{game.release_year}</p>
                    </div>
                    <div className="font-display shrink-0 text-right" style={{ fontSize: 26, color: accent, lineHeight: 1 }}>
                      {Number(game.emilio_score).toFixed(1)}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-right">
                <Link to={`/rankings?platform=${data.slug}`} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: accent }}>
                  Ver el ranking completo →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
           TIMELINE — Sin cambios (De tu código original)
           ═══════════════════════════════════════════════════ */}
      {timelineYears.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-12 text-center">
              <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>TIMELINE</div>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                LA <span style={{ color: accent }}>HISTORIA</span>
              </h2>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, transparent, ${accent}66, transparent)` }} />
              <div className="space-y-8">
                {timelineYears.map((year) => (
                  <div key={year} className="relative">
                    <div className="flex justify-center mb-4">
                      <div className="px-4 py-2 rounded-full font-display relative z-10" style={{ background: accent, color: '#fff', fontSize: 22, lineHeight: 1, boxShadow: `0 4px 20px ${accent}66` }}>
                        {year}
                      </div>
                    </div>
                    {timelineByYear[year].map((event, i) => (
                      <div key={event.id} className={`flex items-center gap-4 mb-3 ${i % 2 === 0 ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="flex-1 max-w-[45%]" />
                        <div className={`w-3 h-3 rounded-full shrink-0 z-10`} style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
                        <div className="flex-1 max-w-[45%] p-4 rounded-xl" style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            {event.icon && <span style={{ fontSize: 18 }}>{event.icon}</span>}
                            <h3 className="text-white font-bold">{event.title}</h3>
                          </div>
                          {event.description && <p className="text-text-muted text-sm leading-relaxed">{event.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           JUEGOS DESTACADOS — Sin cambios (De tu original)
           ═══════════════════════════════════════════════════ */}
      {data.featured_games.length > 0 && (
        <section id="destacados" className="py-20 px-6 relative" style={{ background: 'rgba(15,15,26,0.3)' }}>
          <div className="absolute right-0 top-0 w-32 h-32 pointer-events-none" style={{ background: accent, opacity: 0.1 }} />
          <div className="max-w-[1200px] mx-auto relative">
            <div className="mb-10">
              <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>JUEGOS DESTACADOS</div>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                LOS <span style={{ color: accent }}>IMPRESCINDIBLES</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.featured_games.map(game => (
                <Link key={game.id} to={`/game/${game.slug}`} className="group block relative aspect-[16/10] rounded-xl overflow-hidden transition-transform hover:-translate-y-1" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {game.cover_image && <img src={resolveUrl(game.cover_image)} alt={game.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, rgba(10,10,20,0.95) 100%)` }} />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {game.is_essential && <span className="inline-block font-pixel px-2 py-1 rounded mb-2" style={{ fontSize: 6, background: accent, color: '#fff' }}>⭐ ESENCIAL</span>}
                    {game.is_gem && <span className="inline-block font-pixel px-2 py-1 rounded mb-2 ml-1" style={{ fontSize: 6, background: secondary, color: '#000' }}>💎 JOYA</span>}
                    <h3 className="font-display text-white text-2xl leading-tight uppercase">{game.title}</h3>
                    {game.caption && <p className="text-text-muted text-sm mt-1 italic">"{game.caption}"</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {game.release_year && <span className="text-text-muted text-xs">{game.release_year}</span>}
                      {game.emilio_score && <span className="font-display" style={{ fontSize: 22, color: accent, lineHeight: 1 }}>{Number(game.emilio_score).toFixed(1)}</span>}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg font-pixel transition-opacity opacity-0 group-hover:opacity-100" style={{ fontSize: 7, background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(10px)' }}>
                    VER →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           GALERÍA — Sin cambios (De tu original)
           ═══════════════════════════════════════════════════ */}
      {data.gallery.length > 0 && (
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-10 text-center">
              <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>GALERÍA</div>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                EN <span style={{ color: accent }}>IMÁGENES</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery.map((img, i) => {
                const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '0']
                return (
                  <button key={i} onClick={() => setLightbox(resolveUrl(img.path))} className={`group relative aspect-[4/5] transition-transform duration-300 hover:scale-105 hover:rotate-0 ${rotations[i % rotations.length]}`} style={{ background: '#fff', padding: 8, paddingBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <img src={resolveUrl(img.path)} alt={img.caption || `Imagen ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    {img.caption && <div className="absolute bottom-1 left-0 right-0 text-center text-black text-xs font-handwriting" style={{ fontFamily: 'cursive' }}>{img.caption}</div>}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           TRIVIA — Sin cambios (De tu original)
           ═══════════════════════════════════════════════════ */}
      {data.trivia.length > 0 && (
        <section className="py-20 px-6" style={{ background: 'rgba(15,15,26,0.5)' }}>
          <div className="max-w-[900px] mx-auto">
            <div className="mb-10">
              <div className="font-pixel mb-3" style={{ fontSize: 7, color: accent, letterSpacing: 4 }}>¿SABÍAS QUE...?</div>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: 'clamp(36px, 4vw, 56px)', color: '#fff' }}>
                CURIOSIDADES
              </h2>
            </div>
            <div className="space-y-3">
              {data.trivia.map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-xl" style={{ background: 'rgba(30,30,50,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-display shrink-0" style={{ fontSize: 36, color: accent, lineHeight: 1, width: 50 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-text-primary leading-relaxed flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
           CTA FINAL — Sin cambios
           ═══════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display leading-[0.95] mb-4" style={{ fontSize: 'clamp(40px, 5vw, 64px)', color: '#fff' }}>
            EXPLORA LOS<br />
            <span style={{ color: accent }}>{data.total_games} JUEGOS</span> DE {data.name.toUpperCase()}
          </h2>
          <p className="text-text-muted mb-8 max-w-xl mx-auto">
            Descubre todo el catálogo curado, con reseñas honestas de Emilio y votos de la comunidad verificada.
          </p>
          <Link to={`/rankings?platform=${data.slug}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-105" style={{ background: accent, boxShadow: `0 12px 40px ${accent}66` }}>
            🎮 Ver ranking completo
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
           LIGHTBOX
           ═══════════════════════════════════════════════════ */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setLightbox(null)} style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  )
}