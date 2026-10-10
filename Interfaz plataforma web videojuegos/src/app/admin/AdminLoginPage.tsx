import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

export function AdminLoginPage() {
  const { login, isAdmin } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdmin) { navigate('/admin', { replace: true }); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Campos obligatorios'); return }
    setError(''); setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) navigate('/admin', { replace: true })
    else setError(result.error || 'Error al iniciar sesión')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated bg decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'var(--accent-red)' }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'var(--accent-blue)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <div className="retro-bar inline-flex rounded-lg mb-4">
              <span>🔒 ACCESO ADMINISTRATIVO</span>
            </div>
            <h1 className="font-display text-4xl text-white mb-2">PANEL ADMIN</h1>
            <p className="text-text-muted text-sm">Área restringida · TDV</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-glass" placeholder="admin@tdv.com" autoComplete="email" required
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-glass" placeholder="••••••••" autoComplete="current-password" required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
              {loading ? 'Verificando...' : 'Acceder al Panel'}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-text-dim mb-2">
              ⚠ Área exclusiva para administradores y editores.
            </p>
            <Link to="/" className="text-xs text-accent-blue hover:underline">← Volver al sitio público</Link>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 text-center">
          <p className="font-pixel text-text-dim" style={{ fontSize: 6 }}>
            🛡 SESIÓN SEGURA · TOKEN EXPIRA EN 2H · RATE LIMITED
          </p>
        </div>
      </div>
    </div>
  )
}
