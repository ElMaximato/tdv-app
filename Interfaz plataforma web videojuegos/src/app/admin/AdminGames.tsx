import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface GameRow {
  id: number
  title: string
  slug: string
  platform: string
  platform_slug: string
  release_year: number | null
  cover_image: string | null
  is_published: boolean | number
  emilio_score: number | null
  is_gem: number | null
  is_essential: number | null
  created_at: string
}

export function AdminGames() {
  const { adminFetch } = useAdminAuth()
  const [games, setGames] = useState<GameRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<{ total: number; pages: number } | null>(null)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (q) params.set('q', q)
    if (status !== 'all') params.set('status', status)
    const res = await adminFetch(`${API}/api/admin/games?${params}`)
    const data = await res.json()
    setGames(data.data || [])
    setMeta(data.meta || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, status])

  async function togglePublish(id: number, current: boolean | number) {
    const published = !current
    if (!confirm(`¿${published ? 'Publicar' : 'Despublicar'} este juego?`)) return
    await adminFetch(`${API}/api/admin/games/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    })
    load()
  }

  async function deleteGame(id: number, title: string) {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE "${title}"? Esta acción no se puede deshacer.`)) return
    const res = await adminFetch(`${API}/api/admin/games/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Error al eliminar')
      return
    }
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="retro-bar inline-flex rounded-lg mb-2"><span>🎮 JUEGOS</span></div>
          <h1 className="font-display text-4xl text-white">CATÁLOGO</h1>
        </div>
        <Link to="/admin/games/new" className="btn-primary text-sm">+ Nuevo Juego</Link>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6 flex flex-wrap items-center gap-3">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load() }} className="flex gap-2 flex-1 min-w-[240px]">
          <input value={q} onChange={e => setQ(e.target.value)} className="input-glass flex-1" placeholder="Buscar por título..." />
          <button className="btn-primary text-sm px-4">Buscar</button>
        </form>

        <div className="flex gap-1">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === s ? 'bg-accent-red text-white' : 'bg-white/5 text-text-muted hover:text-white'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'published' ? '✓ Publicados' : '📝 Borradores'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-pixel text-text-muted" style={{ fontSize: 9 }}>— SIN RESULTADOS —</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>COVER</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>TÍTULO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>PLATAFORMA</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>AÑO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>EMILIO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>STATUS</th>
                <th className="text-right p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => {
                const coverUrl = g.cover_image
                  ? g.cover_image.startsWith('http') ? g.cover_image : `${API}/uploads/${g.cover_image}`
                  : null
                return (
                  <tr key={g.id} className="transition-colors hover:bg-white/3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="p-3">
                      <div className="w-12 h-16 rounded overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        {coverUrl ? (
                          <img src={coverUrl} alt={g.title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-white text-sm font-semibold">{g.title}</p>
                      <p className="text-text-dim text-xs">{g.slug}</p>
                      <div className="flex gap-1 mt-1">
                        {g.is_gem === 1 && <span className="badge-gold text-[10px]">💎 Joya</span>}
                        {g.is_essential === 1 && <span className="badge-red text-[10px]">⭐ Esencial</span>}
                      </div>
                    </td>
                    <td className="p-3"><span className="badge text-xs">{g.platform}</span></td>
                    <td className="p-3 text-text-muted text-sm">{g.release_year || '—'}</td>
                    <td className="p-3 font-bold text-sm" style={{ color: g.emilio_score ? 'var(--accent-red)' : 'var(--text-dim)' }}>
                      {g.emilio_score ?? '—'}
                    </td>
                    <td className="p-3">
                      {g.is_published ? (
                        <span className="badge-green text-[10px]">✓ PUBLICADO</span>
                      ) : (
                        <span className="badge text-[10px]">📝 BORRADOR</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <Link to={`/admin/games/${g.id}`} className="btn-secondary text-xs px-3 py-1">Editar</Link>
                        <button onClick={() => togglePublish(g.id, g.is_published)} className="btn-secondary text-xs px-3 py-1">
                          {g.is_published ? 'Ocultar' : 'Publicar'}
                        </button>
                        <button onClick={() => deleteGame(g.id, g.title)} className="btn-secondary text-xs px-3 py-1" style={{ color: '#ff4444' }}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs disabled:opacity-30">← Anterior</button>
          <span className="font-pixel text-text-dim" style={{ fontSize: 8 }}>{page} / {meta.pages}</span>
          <button disabled={page === meta.pages} onClick={() => setPage(page + 1)} className="btn-secondary text-xs disabled:opacity-30">Siguiente →</button>
        </div>
      )}
    </div>
  )
}
