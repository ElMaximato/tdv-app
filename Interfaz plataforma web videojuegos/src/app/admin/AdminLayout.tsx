import { Link, useLocation, useNavigate, Outlet } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',  icon: '📊', exact: true },
  { to: '/admin/sagas',     label: 'Sagas',      icon: '🎮' },
  { to: '/admin/games',     label: 'Juegos',     icon: '🎮' },
  { to: '/admin/consoles',  label: 'Consolas',   icon: '🕹️' },
  { to: '/admin/tierlist',  label: 'Tierlist',   icon: '🏆' },
  { to: '/admin/reviews',   label: 'Reseñas',    icon: '📝' },
  { to: '/admin/users',     label: 'Usuarios',   icon: '👥' },
  { to: '/admin/quiz',      label: 'Quiz',       icon: '🧩' },
  { to: '/admin/audit',     label: 'Audit Log',  icon: '🔒', adminOnly: true },

]

export function AdminLayout() {
  const { admin, isAdmin, loading, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Redirect to login if not admin (after loading completes)
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login', { replace: true })
    }
  }, [isAdmin, loading, navigate])

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>VERIFICANDO SESIÓN...</p>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 border-r flex flex-col"
        style={{ background: 'rgba(15,15,26,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="retro-bar rounded-lg px-2 py-1.5">
              <span style={{ fontSize: 8 }}>ADM</span>
            </div>
            <div>
              <div className="font-pixel text-white leading-none" style={{ fontSize: 8 }}>TDV ADMIN</div>
              <div className="font-pixel text-accent-gold leading-none mt-1" style={{ fontSize: 6 }}>PANEL v1.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            if (item.adminOnly && admin?.role !== 'admin') return null
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, rgba(230,0,18,0.15), rgba(230,0,18,0.05))', border: '1px solid rgba(230,0,18,0.2)' } : {}}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="glass-card p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, var(--accent-red), var(--accent-blue))' }}>
                {admin?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{admin?.username}</p>
                <p className="text-text-dim text-xs truncate">{admin?.email}</p>
              </div>
            </div>
            <span className={`badge text-[10px] ${admin?.role === 'admin' ? 'badge-red' : 'badge-gold'}`}>
              {admin?.role?.toUpperCase()}
            </span>
          </div>

          <button onClick={handleLogout} className="btn-secondary w-full text-xs py-2">
            🚪 Cerrar sesión
          </button>

          <Link to="/" className="block text-center text-text-dim text-xs mt-2 hover:text-white transition-colors">
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
