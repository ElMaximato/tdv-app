import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Tier = 'S' | 'A' | 'B' | 'C' | 'D'

interface GameEntry {
  id: number; title: string; slug: string
  cover_image: string | null; release_year: number | null
  platform: string; score_overall: number | null
  entry_id?: number; tier?: Tier; position?: number
}

const TIER_CONFIG: Record<Tier, { color: string; bg: string; label: string }> = {
  S: { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',   label: 'S — OBRA MAESTRA' },
  A: { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  label: 'A — EXCELENTE'    },
  B: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   label: 'B — MUY BUENO'   },
  C: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  label: 'C — BUENO'        },
  D: { color: '#9ca3af', bg: 'rgba(156,163,175,0.06)', label: 'D — REGULAR'      },
}

const resolveImg = (p: string | null) =>
  !p ? null : p.startsWith('http') ? p : `${API}/uploads/${p}`

export function AdminTierlist() {
  const { adminFetch } = useAdminAuth()

  const [tiers,     setTiers]     = useState<Record<Tier, GameEntry[]>>({ S:[], A:[], B:[], C:[], D:[] })
  const [available, setAvailable] = useState<GameEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [search,    setSearch]    = useState('')

  // Drag state
  const dragging   = useRef<{ game: GameEntry; from: Tier | 'available' } | null>(null)
  const [dragOver, setDragOver] = useState<Tier | 'available' | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const d = await adminFetch(`${API}/api/admin/tierlist`).then(r => r.json())
      setTiers(d.tiers)
      setAvailable(d.available)
    } catch { setMsg({ type: 'err', text: 'Error al cargar' }) }
    finally { setLoading(false) }
  }

  // ── Drag & Drop ──────────────────────────────────────────────
  function onDragStart(game: GameEntry, from: Tier | 'available') {
    dragging.current = { game, from }
  }

  function onDrop(to: Tier | 'available') {
    const d = dragging.current
    if (!d) return
    const { game, from } = d
    if (from === to) { setDragOver(null); return }

    // Quitar del origen
    if (from === 'available') {
      setAvailable(prev => prev.filter(g => g.id !== game.id))
    } else {
      setTiers(prev => ({ ...prev, [from]: prev[from].filter(g => g.id !== game.id) }))
    }

    // Agregar al destino
    if (to === 'available') {
      setAvailable(prev => [...prev, { ...game, tier: undefined }])
    } else {
      setTiers(prev => ({ ...prev, [to]: [...prev[to], { ...game, tier: to }] }))
    }

    setDragOver(null)
    dragging.current = null
  }

  // ── Mover con botones (alternativa al drag) ───────────────────
  function moveTo(game: GameEntry, from: Tier | 'available', to: Tier | 'available') {
    onDragStart(game, from)
    onDrop(to)
  }

  // ── Guardar ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true); setMsg(null)
    const entries: { game_id: number; tier: Tier; position: number }[] = []
    ;(['S','A','B','C','D'] as Tier[]).forEach(tier => {
      tiers[tier].forEach((g, i) => entries.push({ game_id: g.id, tier, position: i }))
    })
    try {
      const res = await adminFetch(`${API}/api/admin/tierlist`, {
        method: 'PUT', body: JSON.stringify({ entries }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMsg({ type: 'ok', text: `¡Tierlist guardada! (${entries.length} juegos)` })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally { setSaving(false) }
  }

  const filteredAvailable = available.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8">
      <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p>
    </div>
  )

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="retro-bar inline-flex rounded-lg mb-2"><span>🏆 TIERLIST</span></div>
          <h1 className="font-display text-4xl text-white">Tier List de Emilio</h1>
          <p className="text-text-muted text-xs mt-1">
            Arrastra los juegos entre los tiers o usa los botones. Los cambios no se guardan hasta que pulses Guardar.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <a href="/tierlist" target="_blank" className="btn-secondary text-sm">👁 Ver pública</a>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving ? 'Guardando...' : '💾 Guardar Tierlist'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(230,0,18,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(230,0,18,0.3)'}`,
          color: msg.type === 'ok' ? '#22c55e' : '#ff4444',
        }}>{msg.text}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,280px] gap-6">

        {/* ── TIERS ── */}
        <div className="space-y-3">
          {(['S','A','B','C','D'] as Tier[]).map(tier => {
            const cfg    = TIER_CONFIG[tier]
            const isOver = dragOver === tier

            return (
              <div key={tier}
                onDragOver={e => { e.preventDefault(); setDragOver(tier) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => onDrop(tier)}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${isOver ? cfg.color : `${cfg.color}20`}`,
                  boxShadow: isOver ? `0 0 20px ${cfg.color}20` : 'none',
                  transition: 'all 0.15s',
                  background: isOver ? `${cfg.color}05` : 'transparent',
                }}
              >
                {/* Label */}
                <div style={{
                  width: 80, flexShrink: 0,
                  background: cfg.bg,
                  borderRight: `1px solid ${cfg.color}20`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '10px 4px', gap: 2,
                }}>
                  <span style={{ fontFamily: '"VT323",monospace', fontSize: 48, color: cfg.color, lineHeight: 1 }}>{tier}</span>
                  <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 4, color: `${cfg.color}80`, textAlign: 'center' }}>
                    {cfg.label.split('—')[1]?.trim()}
                  </span>
                </div>

                {/* Juegos en este tier */}
                <div style={{
                  flex: 1, padding: '10px 14px',
                  display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                  minHeight: 90, background: `${cfg.bg}50`,
                }}>
                  {tiers[tier].length === 0 && (
                    <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#1f2937' }}>
                      ARRASTRA AQUÍ
                    </span>
                  )}
                  {tiers[tier].map(game => {
                    const img = resolveImg(game.cover_image)
                    return (
                      <div
                        key={game.id}
                        draggable
                        onDragStart={() => onDragStart(game, tier)}
                        style={{ position: 'relative', cursor: 'grab', userSelect: 'none' }}
                        title={game.title}
                      >
                        <div style={{ width: 52, height: 66, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e', border: `1px solid ${cfg.color}40` }}>
                          {img
                            ? <img src={img} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12, color: '#374151' }}>?</span></div>
                          }
                        </div>
                        {/* Botón quitar */}
                        <button
                          onClick={() => moveTo(game, tier, 'available')}
                          title="Quitar del tier"
                          style={{
                            position: 'absolute', top: -4, right: -4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#e60012', border: 'none',
                            color: '#fff', fontSize: 9, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >✕</button>
                      </div>
                    )
                  })}
                </div>

                {/* Contador */}
                <div style={{
                  width: 36, flexShrink: 0,
                  background: 'rgba(0,0,0,0.2)',
                  borderLeft: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#374151', writingMode: 'vertical-rl' }}>
                    {tiers[tier].length}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── POOL DE JUEGOS DISPONIBLES ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver('available') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => onDrop('available')}
        >
          <div className="glass-panel p-4 sticky top-4" style={{
            border: dragOver === 'available' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
            transition: 'border-color 0.15s', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-pixel text-text-muted" style={{ fontSize: 6 }}>DISPONIBLES</div>
                <div className="font-display text-white text-xl">{available.length} juegos</div>
              </div>
            </div>

            {/* Buscador */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar juego..."
              className="input-glass text-sm mb-3"
            />

            {/* Lista */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {filteredAvailable.map(game => {
                const img = resolveImg(game.cover_image)
                return (
                  <div
                    key={game.id}
                    draggable
                    onDragStart={() => onDragStart(game, 'available')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 8px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'grab', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    {/* Portada mini */}
                    <div style={{ width: 32, height: 40, borderRadius: 4, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
                      {img && <img src={img} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#e8e0d0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {game.title}
                      </div>
                      <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#374151', marginTop: 2 }}>
                        {game.platform}{game.score_overall != null ? ` · ${game.score_overall}` : ''}
                      </div>
                    </div>

                    {/* Botones rápidos S/A/B/C/D */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                      {(['S','A','B','C','D'] as Tier[]).map(t => (
                        <button
                          key={t}
                          onClick={() => moveTo(game, 'available', t)}
                          title={`Mover a ${t}`}
                          style={{
                            width: 18, height: 12,
                            borderRadius: 2, border: 'none',
                            background: TIER_CONFIG[t].color,
                            color: '#000', fontSize: 7,
                            fontFamily: '"Press Start 2P",monospace',
                            cursor: 'pointer', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {filteredAvailable.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#374151' }}>
                    {search ? 'SIN RESULTADOS' : 'TODOS LOS JUEGOS ASIGNADOS'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
