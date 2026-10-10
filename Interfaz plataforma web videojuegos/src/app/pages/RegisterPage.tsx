import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'outlook.com', 'outlook.es', 'outlook.com.ar', 'outlook.com.mx', 'outlook.com.co',
  'hotmail.com', 'hotmail.com.ar', 'hotmail.es', 'hotmail.com.mx', 'hotmail.com.co',
  'live.com',    'live.com.ar',    'live.es',    'live.com.mx',    'live.com.co',
  'msn.com',
  'yahoo.com', 'yahoo.com.ar', 'yahoo.es', 'yahoo.com.mx', 'yahoo.com.co',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'mail.com', 'aol.com',
])

function isAllowedEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  return !!domain && ALLOWED_DOMAINS.has(domain)
}

function getPasswordRules(password: string) {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
  }
}

export function RegisterPage() {
  const { register, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  if (isLoggedIn) { navigate('/profile'); return null }

  const rules = getPasswordRules(password)
  const allRulesOk = rules.length && rules.uppercase && rules.number

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (username.length < 3)     { setError('Mínimo 3 caracteres en el username'); return }
    if (!isAllowedEmail(email))  { setError('Solo se aceptan emails de proveedores comunes (Gmail, Outlook, Hotmail, Yahoo, iCloud, etc.)'); return }
    if (!allRulesOk)             { setError('La contraseña no cumple los requisitos'); return }
    if (password !== confirm)    { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const result = await register(username, email, password)
    setLoading(false)

    if (result.ok) {
      // NO auto-login. Redirigir a verificación de email con el email en query param
      navigate(`/verify-email?email=${encodeURIComponent(result.email || email)}`)
    } else {
      setError(result.error || 'Error al registrar')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <div className="retro-bar inline-flex rounded-lg mb-4">
              <span>🎮 NUEVO GAMER</span>
            </div>
            <h1 className="font-display text-4xl text-white">CREAR CUENTA</h1>
            <p className="text-text-muted text-sm mt-2">Únete a la comunidad</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-glass" placeholder="TuNombreGamer" required />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-glass" placeholder="tu@gmail.com" required />
              {email.includes('@') && !isAllowedEmail(email) && (
                <p className="mt-1.5 text-xs" style={{ color: '#ff6b6b' }}>
                  Solo se aceptan emails de Gmail, Outlook, Hotmail, Yahoo, iCloud, etc.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-glass" placeholder="Mínimo 8 caracteres" required />
              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  <PasswordRule ok={rules.length}    label="Al menos 8 caracteres" />
                  <PasswordRule ok={rules.uppercase} label="Al menos 1 mayúscula" />
                  <PasswordRule ok={rules.number}    label="Al menos 1 número" />
                </ul>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Confirmar Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-glass" placeholder="Repite tu contraseña" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-text-dim">
              📧 Te enviaremos un código de verificación a tu correo
            </p>
          </div>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent-blue font-semibold hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs" style={{ color: ok ? '#4ade80' : '#6b7280' }}>
      <span>{ok ? '✓' : '○'}</span>
      {label}
    </li>
  )
}
