import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const emailFromQuery = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromQuery)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Auto-focus al primer input al cargar
  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus()
  }, [])

  function handleDigitChange(idx: number, value: string) {
    // Solo dígitos
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[idx] = digit
    setDigits(newDigits)
    setError('')

    // Auto-avanzar al siguiente input
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }

    // Auto-submit cuando se completa
    if (idx === 5 && digit) {
      const fullCode = [...newDigits.slice(0, 5), digit].join('')
      if (fullCode.length === 6) {
        setTimeout(() => handleSubmit(fullCode), 100)
      }
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Backspace: si vacío, ir al anterior
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
    // Flechas
    if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 0) return
    const newDigits = pasted.split('')
    while (newDigits.length < 6) newDigits.push('')
    setDigits(newDigits)

    // Focus al último input con dígito, o al último
    const lastFilled = Math.min(pasted.length - 1, 5)
    inputRefs.current[lastFilled]?.focus()

    // Auto-submit si completo
    if (pasted.length === 6) {
      setTimeout(() => handleSubmit(pasted), 100)
    }
  }

  async function handleSubmit(overrideCode?: string) {
    const code = overrideCode || digits.join('')
    if (code.length !== 6) { setError('Ingresa los 6 dígitos'); return }
    if (!email) { setError('Email requerido'); return }

    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Código incorrecto')
        // Limpiar los inputs para reintentar
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setSuccess(data.message || '¡Email verificado! Redirigiendo...')
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) { setError('Email requerido'); return }
    setResending(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al reenviar')
      } else {
        setSuccess('📨 Código reenviado. Revisa tu correo.')
        setResendCooldown(60)
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8">
          <div className="text-center mb-6">
            <div className="retro-bar inline-flex rounded-lg mb-4">
              <span>📧 VERIFICACIÓN</span>
            </div>
            <h1 className="font-display text-4xl text-white leading-none">VERIFICA TU EMAIL</h1>
            <p className="text-text-muted text-sm mt-3 leading-relaxed">
              Te enviamos un código de 6 dígitos a<br />
              <span className="text-white font-semibold">{email || 'tu correo'}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
              {success}
            </div>
          )}

          {/* Email input si no vino por query */}
          {!emailFromQuery && (
            <div className="mb-4">
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-glass"
                placeholder="tu@email.com"
              />
            </div>
          )}

          {/* Pin code inputs */}
          <div className="mb-6">
            <label className="block text-xs text-text-muted font-semibold mb-3 uppercase tracking-wide text-center">
              Código de 6 dígitos
            </label>
            <div className="flex gap-2 justify-center">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg transition-all focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${d ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={loading || digits.join('').length !== 6}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar Email'}
          </button>

          {/* Reenvío */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-xs mb-2">¿No te llegó el código?</p>
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-accent-blue text-sm font-semibold hover:underline disabled:text-text-dim disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : resending
                  ? 'Enviando...'
                  : 'Reenviar código'}
            </button>
            <p className="text-text-dim text-xs mt-3">
              Revisa también tu carpeta de <strong>spam</strong>
            </p>
          </div>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-text-muted">
              ¿Te equivocaste de email?{' '}
              <Link to="/register" className="text-accent-blue font-semibold hover:underline">Registrarse de nuevo</Link>
            </p>
          </div>
        </div>

        {/* Nota dev */}
        <p className="text-center text-text-dim text-[11px] mt-4 font-pixel" style={{ fontSize: 7 }}>
          🔒 CÓDIGO EXPIRA EN 15 MINUTOS · MÁX 5 INTENTOS
        </p>
      </div>
    </div>
  )
}
