import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useGames, type GamesFilters } from '../hooks/Usegames'
import { GameCard } from './GameCard'
import { SCORE_TAB_STYLES } from '../utils/scoreColors'

// ─── Constantes ───────────────────────────────────────────────

const SCORE_TABS = [
  { label: '95 +',  min: 95,  max: 100 },
  { label: '90',    min: 90,  max: 94  },
  { label: '80',    min: 80,  max: 89  },
  { label: '70 -',  min: 0,   max: 79  },
  { label: 'TODOS', min: 0,   max: 100 },
] as const

type ScoreTab = typeof SCORE_TABS[number]

const PLATFORMS = [
  { label: 'Todos',     slug: '' },
  { label: 'SNES',      slug: 'snes' },
  { label: 'N64',       slug: 'n64' },
  { label: 'GameCube',  slug: 'ngc' },
  { label: 'Wii',       slug: 'wii' },
  { label: 'Switch',    slug: 'switch'},
  { label: 'PS1',       slug: 'ps1' },
  { label: 'PS2',       slug: 'ps2' },
  { label: 'PS3',       slug: 'ps3' },
  { label: 'PS4',       slug: 'ps4' },
  { label: 'GBA',       slug: 'gba' },
  
]

const GENRES = [
  { label: 'Todos los géneros', slug: '' },
  { label: 'JRPG',              slug: 'jrpg' },
  { label: 'RPG',               slug: 'rpg' },
  { label: 'Plataformas',       slug: 'plataformas' },
  { label: 'Acción',            slug: 'accion' },
  { label: 'Aventura',          slug: 'aventura' },
  { label: 'Survival Horror',   slug: 'survival-horror' },
  { label: 'Lucha',             slug: 'lucha' },
  { label: 'Shooter',           slug: 'shooter' },
  { label: 'Puzzle',            slug: 'puzzle' },
  { label: 'Carreras',          slug: 'carreras' },
  { label: 'Estrategia',        slug: 'estrategia' },
  { label: 'Metroidvania',      slug: 'metroidvania' },
]

// ─── Dropdown personalizado ────────────────────────────────────

interface CustomSelectProps {
  value: string
  options: { label: string; slug: string }[]
  onChange: (slug: string) => void
  placeholder?: string
}

function CustomSelect({ value, options, onChange, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.slug === value) ?? options[0]

  // Cerrar al click fuera
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 190 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="font-body font-semibold text-xs w-full flex items-center justify-between gap-2 transition-all"
        style={{
          height: 32,
          padding: '0 10px',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          color: value ? '#fff' : '#6b7280',
          cursor: 'pointer',
        }}
      >
        <span>{selected?.label ?? placeholder ?? 'Seleccionar'}</span>
        <span style={{ fontSize: 10, color: '#6b7280', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#1a1b2e',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {options.map(opt => {
            const active = opt.slug === value
            return (
              <button
                key={opt.slug}
                onClick={() => { onChange(opt.slug); setOpen(false) }}
                className="w-full text-left font-body text-xs transition-colors"
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  background: active ? 'rgba(230,0,18,0.15)' : 'transparent',
                  color: active ? '#fff' : '#9ca3af',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {active && <span style={{ color: '#e60012', marginRight: 6 }}>▸</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────

export function RankingSection() {
  const [searchParams] = useSearchParams()

  const urlPlatform = searchParams.get('platform') || ''
  const urlGenre    = searchParams.get('genre')    || ''
  const urlQ        = searchParams.get('q')        || ''

  const [scoreTab,  setScoreTab]  = useState<ScoreTab>(SCORE_TABS[0])
  const [scoreMode, setScoreMode] = useState<'emilio' | 'community'>('emilio')
  const [platform,  setPlatform]  = useState(urlPlatform)
  const [genre,     setGenre]     = useState(urlGenre)
  const [page,      setPage]      = useState(1)
  const [q,         setQ]         = useState(urlQ)
  const [inputQ,    setInputQ]    = useState(urlQ)

  useEffect(() => {
    setPlatform(urlPlatform)
    setGenre(urlGenre)
    setQ(urlQ)
    setInputQ(urlQ)
    setPage(1)
  }, [urlPlatform, urlGenre, urlQ])

  const filters: GamesFilters = {
    platform: platform || undefined,
    genre:    genre    || undefined,
    q:        q        || undefined,
    sort:     scoreMode === 'emilio' ? 'emilio_score' : 'community_avg',
    page,
    limit: 60,
  }

  const { games: allGames, meta, loading, error } = useGames(filters)

  // Filtrar por rango de score en cliente
  const games = scoreTab.label === 'TODOS'
    ? allGames
    : allGames.filter(g => {
        const score = scoreMode === 'emilio'
          ? Number(g.emilio_score)
          : Number(g.community_avg)
        if (isNaN(score)) return false
        return score >= scoreTab.min && score <= scoreTab.max
      })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setQ(inputQ)
    setPage(1)
  }

  const startRank = ((page - 1) * 60) + 1

  return (
    <section className="px-4 py-8">
      <div className="max-w-[1200px] mx-auto">

        {/* Encabezado */}
        <div className="section-header">
          <div className="retro-tag">▶ TOP RANKINGS</div>
          <h2 className="font-display text-3xl text-white">RANKING GLOBAL</h2>
          {meta && (
            <span className="text-text-dim text-sm ml-auto">{meta.total} juegos</span>
          )}
        </div>

        <div className="glass-panel p-5 mb-6 space-y-4">

          {/* Fila 1: tabs de puntuaje + switch Emilio/Comunidad */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-body text-xs font-semibold" style={{ color: '#6b7280' }}>
              Puntuaje
            </span>

            <div className="flex gap-1.5 flex-wrap">
              {SCORE_TABS.map(tab => {
                const active = scoreTab.label === tab.label
                return (
                  <button
                    key={tab.label}
                    onClick={() => { setScoreTab(tab); setPage(1) }}
                    className="font-body font-bold text-xs transition-all"
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: `2px solid ${active ? SCORE_TAB_STYLES[tab.label as keyof typeof SCORE_TAB_STYLES]?.activeColor ?? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      background: active ? (SCORE_TAB_STYLES[tab.label as keyof typeof SCORE_TAB_STYLES]?.activeBg ?? 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
                      color: active ? (SCORE_TAB_STYLES[tab.label as keyof typeof SCORE_TAB_STYLES]?.activeColor ?? '#fff') : '#9ca3af',
                      cursor: 'pointer',
                      boxShadow: active ? (SCORE_TAB_STYLES[tab.label as keyof typeof SCORE_TAB_STYLES]?.glow ?? 'none') : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Switch */}
            <div
              className="ml-auto flex items-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              {(['emilio', 'community'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setScoreMode(mode); setPage(1) }}
                  className="font-body font-semibold text-xs transition-all"
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: scoreMode === mode ? '#e60012' : 'transparent',
                    color: scoreMode === mode ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'emilio' ? '⭐ Emilio' : '👥 Comunidad'}
                </button>
              ))}
            </div>
          </div>

          {/* Fila 2: plataformas */}
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p.slug}
                onClick={() => { setPlatform(p.slug); setPage(1) }}
                className="font-body font-semibold text-xs transition-all"
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: platform === p.slug ? 'transparent' : 'rgba(255,255,255,0.08)',
                  background: platform === p.slug ? '#e60012' : 'rgba(255,255,255,0.05)',
                  color: platform === p.slug ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Fila 3: Género + búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 items-end pt-1">
            <div className="flex items-center gap-2">
              <span className="font-body text-xs font-semibold shrink-0" style={{ color: '#6b7280' }}>
                Género
              </span>
              <CustomSelect
                value={genre}
                options={GENRES}
                onChange={slug => { setGenre(slug); setPage(1) }}
              />
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                value={inputQ}
                onChange={e => setInputQ(e.target.value)}
                className="input-glass flex-1"
                placeholder="Buscar juego..."
              />
              <button type="submit" className="btn-primary text-sm px-5">
                Buscar
              </button>
            </form>

            {(platform || genre || q) && (
              <button
                onClick={() => { setPlatform(''); setGenre(''); setQ(''); setInputQ(''); setPage(1) }}
                className="font-body text-xs transition-colors shrink-0"
                style={{ color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {/* Tags filtros activos */}
          {(platform || genre || q || scoreTab.label !== 'TODOS') && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                platform && `${PLATFORMS.find(p => p.slug === platform)?.label}`,
                genre    && `${GENRES.find(g => g.slug === genre)?.label}`,
                q        && `"${q}"`,
                scoreTab.label !== 'TODOS' && `Score ${scoreTab.label} · ${scoreMode === 'emilio' ? 'Emilio' : 'Comunidad'}`,
              ].filter(Boolean).map(tag => (
                <span
                  key={String(tag)}
                  className="font-body text-xs"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(230,0,18,0.12)',
                    border: '1px solid rgba(230,0,18,0.3)',
                    color: '#f87171',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-8 text-center mb-6">
            <p className="font-pixel text-accent-red mb-2" style={{ fontSize: 9 }}>
              ERROR DE CONEXIÓN
            </p>
            <p className="text-text-muted text-sm">
              No se pudo conectar con el servidor. ¿Está corriendo Express?
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="glass-card overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-bg-elevated" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-bg-elevated rounded w-3/4" />
                  </div>
                </div>
              ))
            : games.map((game, i) => (
                <GameCard key={game.id} game={game} rank={startRank + i} />
              ))
          }
        </div>

        {/* Sin resultados */}
        {!loading && !error && games.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="font-pixel text-accent-gold" style={{ fontSize: 9 }}>
              — SIN RESULTADOS —
            </p>
            <p className="text-text-muted text-sm mt-2">
              {scoreTab.label !== 'TODOS'
                ? `No hay juegos con score ${scoreTab.label} con los filtros actuales.`
                : 'Intenta con otros filtros.'}
            </p>
          </div>
        )}

        {/* Paginación */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-secondary text-xs disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="font-pixel text-text-dim" style={{ fontSize: 8 }}>
              {page} / {meta.pages}
            </span>
            <button
              disabled={page === meta.pages}
              onClick={() => setPage(page + 1)}
              className="btn-secondary text-xs disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}