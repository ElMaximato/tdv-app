import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  if (isLoggedIn) { navigate('/profile'); return null }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Campos obligatorios'); return }
    setError(''); setNeedsVerification(false); setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.ok) {
      navigate('/profile')
    } else if (result.needsVerification) {
      // El email existe pero no está verificado
      setNeedsVerification(true)
      setError(result.error || 'Debes verificar tu email')
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  function goToVerify() {
    navigate(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <div className="retro-bar inline-flex rounded-lg mb-4">
              <span>🎮 INICIAR SESIÓN</span>
            </div>
            <h1 className="font-display text-4xl text-white">BIENVENIDO</h1>
            <p className="text-text-muted text-sm mt-2">Accede a tu cuenta gamer</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444' }}>
              {error}
              {needsVerification && (
                <button
                  type="button"
                  onClick={goToVerify}
                  className="mt-2 block w-full text-center font-semibold underline text-accent-gold"
                >
                  Ir a verificar email →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-glass" placeholder="tu@email.com" autoComplete="email" required
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
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-text-muted">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-accent-blue font-semibold hover:underline">Regístrate</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
