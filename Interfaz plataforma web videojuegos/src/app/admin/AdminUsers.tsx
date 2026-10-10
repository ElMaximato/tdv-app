import { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface User {
  id: number; username: string; email: string;
  role: 'admin' | 'editor' | 'member';
  is_verified: number | boolean; created_at: string;
}

export function AdminUsers() {
  const { admin, adminFetch } = useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  async function load() {
    setLoading(true)
    const res = await adminFetch(`${API}/api/admin/users?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setUsers(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function changeRole(userId: number, newRole: string) {
    if (!confirm(`¿Cambiar rol a "${newRole}"?`)) return
    const res = await adminFetch(`${API}/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) { const err = await res.json(); alert(err.error); return }
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="retro-bar inline-flex rounded-lg mb-2"><span>👥 USUARIOS</span></div>
        <h1 className="font-display text-4xl text-white">GESTIÓN DE USUARIOS</h1>
      </div>

      <form onSubmit={e => { e.preventDefault(); load() }} className="glass-panel p-4 mb-6 flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} className="input-glass flex-1" placeholder="Buscar por username o email..." />
        <button className="btn-primary text-sm px-4">Buscar</button>
      </form>

      <div className="glass-panel overflow-hidden">
        {loading ? <div className="p-8 text-center"><p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p></div>
        : users.length === 0 ? <div className="p-8 text-center text-text-muted">Sin resultados</div>
        : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>ID</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>USERNAME</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>EMAIL</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>ROL</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>VERIFICADO</th>
                <th className="text-left p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>CREADO</th>
                <th className="text-right p-3 font-pixel text-text-muted" style={{ fontSize: 8 }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="p-3 text-text-dim text-xs">#{u.id}</td>
                  <td className="p-3 text-white text-sm font-semibold">{u.username}</td>
                  <td className="p-3 text-text-muted text-sm">{u.email}</td>
                  <td className="p-3">
                    <span className={`badge text-xs ${u.role === 'admin' ? 'badge-red' : u.role === 'editor' ? 'badge-gold' : ''}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.is_verified ? <span className="badge-green text-[10px]">✓ SÍ</span> : <span className="badge text-[10px]">— NO</span>}
                  </td>
                  <td className="p-3 text-text-dim text-xs">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                  <td className="p-3 text-right">
                    {admin?.role === 'admin' && u.id !== admin.id && (
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="input-glass text-xs h-8 py-0"
                      >
                        <option value="member">member</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
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
