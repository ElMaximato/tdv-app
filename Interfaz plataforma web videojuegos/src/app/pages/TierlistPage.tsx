import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getScoreStyle } from '../utils/scoreColors'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Mode = 'score' | 'tiers'

interface Game {
  id: number; title: string; slug: string
  cover_image: string | null; release_year: number | null
  platform: string; score_overall: number | null
  is_gem: number; is_essential: number
}

const resolveImg = (p: string | null) =>
  !p ? null : p.startsWith('http') ? p : `${API}/uploads/${p}`

// ─── Configuración de tiers ───────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  S: { label: 'S', color: '#ffd700', bg: 'rgba(255,215,0,0.08)',   desc: 'OBRA MAESTRA' },
  A: { label: 'A', color: '#f97316', bg: 'rgba(249,115,22,0.08)',  desc: 'EXCELENTE'    },
  B: { label: 'B', color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   desc: 'MUY BUENO'   },
  C: { label: 'C', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  desc: 'BUENO'        },
  D: { label: 'D', color: '#9ca3af', bg: 'rgba(156,163,175,0.06)', desc: 'REGULAR'      },
}

// Agrupación para modo score: cómo aparecen los grupos numéricos
function buildScoreGroups(games: (Game & { score_overall: number })[]) {
  // Grupos: 100, 99, 98, 97, 96, 95, 90-94, 80-89, 70-79, <70
  const buckets: { label: string; color: string; bg: string; games: typeof games }[] = [
    { label: '100',   color: '#ffd700', bg: 'rgba(255,215,0,0.08)',   games: [] },
    { label: '99',    color: '#ffd700', bg: 'rgba(255,215,0,0.06)',   games: [] },
    { label: '98',    color: '#4FC3F7', bg: 'rgba(79,195,247,0.08)',  games: [] },
    { label: '97',    color: '#4FC3F7', bg: 'rgba(79,195,247,0.06)',  games: [] },
    { label: '96',    color: '#4FC3F7', bg: 'rgba(79,195,247,0.05)',  games: [] },
    { label: '95',    color: '#00E676', bg: 'rgba(0,230,118,0.07)',   games: [] },
    { label: '90-94', color: '#00E676', bg: 'rgba(0,230,118,0.05)',   games: [] },
    { label: '80-89', color: '#CD7F32', bg: 'rgba(205,127,50,0.07)',  games: [] },
    { label: '70-79', color: '#FF7043', bg: 'rgba(255,112,67,0.06)',  games: [] },
    { label: '< 70',  color: '#6b7280', bg: 'rgba(107,114,128,0.05)', games: [] },
  ]

  games.forEach(g => {
    const s = g.score_overall
    if      (s === 100)           buckets[0].games.push(g)
    else if (s === 99)            buckets[1].games.push(g)
    else if (s === 98)            buckets[2].games.push(g)
    else if (s === 97)            buckets[3].games.push(g)
    else if (s === 96)            buckets[4].games.push(g)
    else if (s === 95)            buckets[5].games.push(g)
    else if (s >= 90 && s <= 94)  buckets[6].games.push(g)
    else if (s >= 80 && s <= 89)  buckets[7].games.push(g)
    else if (s >= 70 && s <= 79)  buckets[8].games.push(g)
    else                          buckets[9].games.push(g)
  })

  return buckets.filter(b => b.games.length > 0)
}

// ─── Tarjeta de juego ─────────────────────────────────────────
function GameTile({ game, accent }: { game: Game; accent?: string }) {
  const [hov, setHov] = useState(false)
  const img   = resolveImg(game.cover_image)
  const score = game.score_overall != null ? Number(game.score_overall) : null
  const ss    = score != null ? getScoreStyle(score) : null
  const color = accent || ss?.color || '#6b7280'

  return (
    <Link to={`/game/${game.slug}`} style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width: 72, position: 'relative',
        transform: hov ? 'translateY(-4px) scale(1.04)' : 'none',
        transition: 'transform 0.2s ease',
        filter: hov ? `drop-shadow(0 6px 14px ${color}50)` : 'none',
      }}>
        {/* Portada */}
        <div style={{ width: 72, height: 90, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e', border: `1px solid ${hov ? color : 'rgba(255,255,255,0.08)'}`, transition: 'border-color 0.2s' }}>
          {img ? (
            <img src={img} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: '"VT323",monospace', fontSize: 20, color: '#374151' }}>?</span>
            </div>
          )}
        </div>

        {/* Badges */}
        {(game.is_gem === 1 || game.is_essential === 1) && (
          <div style={{ position: 'absolute', top: 3, left: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {game.is_gem === 1       && <span style={{ fontSize: 9 }}>💎</span>}
            {game.is_essential === 1 && <span style={{ fontSize: 9 }}>⭐</span>}
          </div>
        )}

        {/* Título al hover */}
        {hov && (
          <div style={{
            position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)', borderRadius: 4, padding: '3px 7px',
            whiteSpace: 'nowrap', zIndex: 10,
            fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#fff',
            maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {game.title}
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Fila de tier ─────────────────────────────────────────────
function TierRow({ label, color, bg, desc, games }: {
  label: string; color: string; bg: string; desc?: string; games: Game[]
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${color}20`,
      marginBottom: 8,
    }}>
      {/* Label */}
      <div style={{
        width: 72, flexShrink: 0,
        background: bg,
        borderRight: `1px solid ${color}20`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px 4px', gap: 4,
      }}>
        <span style={{ fontFamily: '"VT323",monospace', fontSize: 44, color, lineHeight: 1 }}>{label}</span>
        {desc && (
          <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 4, color: `${color}80`, textAlign: 'center', lineHeight: 1.4 }}>
            {desc}
          </span>
        )}
      </div>

      {/* Juegos */}
      <div style={{
        flex: 1, padding: '12px 16px',
        background: `${bg}50`,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        minHeight: 80,
      }}>
        {games.length === 0 ? (
          <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#1f2937' }}>
            — SIN JUEGOS ASIGNADOS —
          </span>
        ) : (
          games.map(g => <GameTile key={g.id} game={g} accent={color} />)
        )}
      </div>

      {/* Contador */}
      <div style={{
        width: 40, flexShrink: 0,
        background: 'rgba(0,0,0,0.2)',
        borderLeft: `1px solid rgba(255,255,255,0.04)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#374151', writingMode: 'vertical-rl' }}>
          {games.length}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function TierlistPage() {
  const [mode,      setMode]      = useState<Mode>('score')
  const [scoreData, setScoreData] = useState<(Game & { score_overall: number })[]>([])
  const [tierData,  setTierData]  = useState<Record<string, Game[]>>({ S:[], A:[], B:[], C:[], D:[] })
  const [loading,   setLoading]   = useState(true)
  const [tierEmpty, setTierEmpty] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/tierlist/scores`).then(r => r.json()),
      fetch(`${API}/api/tierlist/tiers`).then(r => r.json()),
    ]).then(([scores, tiers]) => {
      setScoreData(scores)
      setTierData(tiers)
      const total = Object.values(tiers as Record<string, any[]>).reduce((a, b) => a + b.length, 0)
      setTierEmpty(total === 0)
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const scoreGroups = buildScoreGroups(scoreData)
  const totalGames  = scoreData.length

  return (
    <div style={{ background: '#06060e', minHeight: '100vh', color: '#e8e0d0' }}>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative', padding: '72px 24px 56px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(230,0,18,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #e60012, #ffd700, #e60012, transparent)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: '"Press Start 2P",monospace', fontSize: 7,
            color: '#e60012', letterSpacing: 3,
            padding: '5px 14px', background: 'rgba(230,0,18,0.08)',
            border: '1px solid rgba(230,0,18,0.2)', borderRadius: 4, marginBottom: 20,
          }}>▶ CRITERIO DE EMILIO</div>

          <h1 style={{
            fontFamily: '"VT323",monospace',
            fontSize: 'clamp(52px,8vw,88px)',
            color: '#fff', lineHeight: 0.95, marginBottom: 16,
          }}>
            TIER LIST <span style={{ color: '#e60012' }}>OFICIAL</span>
          </h1>

          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 520, lineHeight: 1.7, marginBottom: 28 }}>
            La clasificación definitiva de Emilio. {totalGames} juegos ordenados
            por criterio editorial — sin contemplaciones.
          </p>

          {/* Switcher de modo */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 4, gap: 4,
          }}>
            {([
              { id: 'score', label: '🔢 POR PUNTUACIÓN', sub: '100 → 95 → ...' },
              { id: 'tiers', label: '🏆 S / A / B / C / D', sub: 'Clásico' },
            ] as const).map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '10px 20px', borderRadius: 7, border: 'none',
                background: mode === m.id ? '#e60012' : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, color: mode === m.id ? '#fff' : '#6b7280' }}>
                  {m.label}
                </span>
                <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: mode === m.id ? 'rgba(255,255,255,0.6)' : '#374151' }}>
                  {m.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 8, color: '#fbbf24', animation: 'pulse 1s infinite' }}>
              CARGANDO...
            </p>
          </div>
        )}

        {/* ── MODO SCORE ── */}
        {!loading && mode === 'score' && (
          <>
            {scoreGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 8, color: '#374151' }}>
                  AÚN NO HAY JUEGOS CON PUNTUACIÓN
                </p>
              </div>
            ) : (
              scoreGroups.map(group => (
                <TierRow
                  key={group.label}
                  label={group.label}
                  color={group.color}
                  bg={group.bg}
                  games={group.games}
                />
              ))
            )}
          </>
        )}

        {/* ── MODO TIERS CLÁSICO ── */}
        {!loading && mode === 'tiers' && (
          <>
            {tierEmpty ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 8, color: '#374151', marginBottom: 12 }}>
                  TIERLIST EN CONSTRUCCIÓN
                </p>
                <p style={{ fontSize: 13, color: '#4b5563' }}>
                  Emilio aún no ha asignado juegos a los tiers. Vuelve pronto.
                </p>
              </div>
            ) : (
              ['S','A','B','C','D'].map(tier => {
                const cfg = TIER_CONFIG[tier]
                return (
                  <TierRow
                    key={tier}
                    label={cfg.label}
                    color={cfg.color}
                    bg={cfg.bg}
                    desc={cfg.desc}
                    games={tierData[tier] ?? []}
                  />
                )
              })
            )}
          </>
        )}

        {/* Nota al pie */}
        {!loading && (
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#1f2937', letterSpacing: 2 }}>
              — CRITERIO EDITORIAL DE EMILIO · TIEMPO DE VIDEOJUEGOS —
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
