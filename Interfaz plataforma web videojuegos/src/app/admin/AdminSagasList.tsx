import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface SagaRow {
  id: number; slug: string; name: string; is_published: boolean
  accent_color: string; publisher: string | null; game_count: number
  cover_image: string | null; updated_at: string
}

export function AdminSagasList() {
  const { adminFetch } = useAdminAuth()
  const [sagas,   setSagas]   = useState<SagaRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch(`${API}/api/admin/sagas`)
      .then(r => r.json()).then(setSagas).finally(() => setLoading(false))
  }, [])

  async function togglePublish(s: SagaRow) {
    await adminFetch(`${API}/api/admin/sagas/${s.id}/publish`, {
      method: 'PATCH', body: JSON.stringify({ published: !s.is_published }),
    })
    setSagas(prev => prev.map(x => x.id === s.id ? { ...x, is_published: !s.is_published } : x))
  }

  if (loading) return <div className="p-8"><p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p></div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="retro-bar inline-flex rounded-lg mb-2"><span>📚 SAGAS</span></div>
          <h1 className="font-display text-4xl text-white">Guías de Saga</h1>
        </div>
        <Link to="/admin/sagas/new" className="btn-primary">+ Nueva Saga</Link>
      </div>

      {sagas.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-text-muted mb-4">No hay sagas todavía</p>
          <Link to="/admin/sagas/new" className="btn-primary inline-flex">+ Crear primera saga</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sagas.map(s => (
            <div key={s.id} className="glass-panel p-4 flex items-center gap-4">
              {/* Color dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent_color, flexShrink: 0, boxShadow: `0 0 8px ${s.accent_color}` }} />

              {/* Cover mini */}
              <div style={{ width: 56, height: 36, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
                {s.cover_image && (
                  <img
                    src={s.cover_image.startsWith('http') ? s.cover_image : `${API}/uploads/${s.cover_image}`}
                    alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-display text-white text-xl leading-none">{s.name}</div>
                <div className="text-text-muted text-xs mt-0.5">
                  {s.publisher && <span>{s.publisher} · </span>}
                  {s.game_count} juego{s.game_count !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Estado */}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.is_published ? 'badge-green' : 'badge'}`}>
                {s.is_published ? 'Publicada' : 'Borrador'}
              </span>

              {/* Acciones */}
              <div className="flex gap-2 shrink-0">
                <Link to={`/admin/sagas/${s.id}`} className="btn-secondary text-xs px-3 py-1.5">✏ Editar</Link>
                <button onClick={() => togglePublish(s)} className="btn-secondary text-xs px-3 py-1.5">
                  {s.is_published ? '⬇ Bajar' : '▶ Publicar'}
                </button>
                <a href={`/sagas/${s.slug}`} target="_blank" className="btn-secondary text-xs px-3 py-1.5">👁 Ver</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
