import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface Console {
  id: number
  name: string
  slug: string
  manufacturer: string | null
  release_year: number | null
  is_published: number | boolean
  hero_logo: string | null
  accent_color: string
  games_count: number
  updated_at: string
}

export function AdminConsoles() {
  const { adminFetch } = useAdminAuth()
  const [consoles, setConsoles] = useState<Console[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await adminFetch(`${API}/api/admin/platforms`)
    setConsoles(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublish(id: number, current: number | boolean) {
    const published = !current
    if (!confirm(`¿${published ? 'Publicar' : 'Despublicar'} esta consola?`)) return
    await adminFetch(`${API}/api/admin/platforms/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    })
    load()
  }

  async function deleteConsole(id: number, name: string) {
    if (!confirm(`¿Eliminar permanentemente "${name}"?\n\nEsto solo funciona si NO hay juegos asociados.`)) return
    const res = await adminFetch(`${API}/api/admin/platforms/${id}`, { method: 'DELETE' })
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
          <div className="retro-bar inline-flex rounded-lg mb-2"><span>🕹 CONSOLAS</span></div>
          <h1 className="font-display text-4xl text-white">PÁGINAS DE CONSOLAS</h1>
        </div>
        <Link to="/admin/consoles/new" className="btn-primary text-sm">+ Nueva Consola</Link>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p></div>
        ) : consoles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-pixel text-text-muted mb-4" style={{ fontSize: 9 }}>— SIN CONSOLAS —</p>
            <Link to="/admin/consoles/new" className="btn-primary text-sm">Crear primera consola</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>LOGO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>NOMBRE</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>FABRICANTE</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>AÑO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>JUEGOS</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>STATUS</th>
                <th className="text-right p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {consoles.map(c => (
                <tr key={c.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="p-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                      style={{ background: c.accent_color + '22', border: `1px solid ${c.accent_color}66` }}
                    >
                      {c.hero_logo ? (
                        <img src={`${API}/uploads/${c.hero_logo}`} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-pixel" style={{ fontSize: 8, color: c.accent_color }}>{c.slug.toUpperCase().slice(0, 4)}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-white text-sm font-semibold">{c.name}</p>
                    <p className="text-text-dim text-xs">{c.slug}</p>
                  </td>
                  <td className="p-3"><span className="text-text-muted text-sm">{c.manufacturer || '—'}</span></td>
                  <td className="p-3 text-text-muted text-sm">{c.release_year || '—'}</td>
                  <td className="p-3"><span className="badge text-xs">{c.games_count} juegos</span></td>
                  <td className="p-3">
                    {c.is_published ? (
                      <span className="badge-green text-[10px]">✓ PUBLICADA</span>
                    ) : (
                      <span className="badge text-[10px]">📝 BORRADOR</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link to={`/admin/consoles/${c.id}`} className="btn-secondary text-xs px-3 py-1">Editar</Link>
                      <button onClick={() => togglePublish(c.id, c.is_published)} className="btn-secondary text-xs px-3 py-1">
                        {c.is_published ? 'Ocultar' : 'Publicar'}
                      </button>
                      <button onClick={() => deleteConsole(c.id, c.name)} className="btn-secondary text-xs px-3 py-1" style={{ color: '#ff4444' }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
