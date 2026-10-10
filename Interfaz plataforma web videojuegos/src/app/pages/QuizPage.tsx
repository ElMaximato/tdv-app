import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export function QuizPage() {
  const { user, isLoggedIn, authFetch } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<{ question_id: number; answer: string }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [finished, setFinished] = useState(false)
  const [finalScore, setFinalScore] = useState<{ score: number; total: number; passed: boolean; message: string } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) return
    loadQuestions()
  }, [isLoggedIn])

  async function loadQuestions() {
    try {
      const res = await authFetch(`${API}/api/quiz/questions`)
      const data = await res.json()
      if (!res.ok) { setLoadError(data.error || 'Error al cargar preguntas'); return }
      setQuestions(data.questions)
    } catch {
      setLoadError('No se pudo conectar al servidor')
    }
  }

  // Timer
  useEffect(() => {
    if (finished || showResult || questions.length === 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, finished, showResult, questions.length])

  function handleTimeout() {
    setSelected(null)
    setShowResult(true)
    // Register empty answer
    if (questions[current]) {
      setAnswers(prev => [...prev, { question_id: questions[current].id, answer: '' }])
    }
  }

  function handleAnswer(opt: string) {
    if (showResult) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(opt)
    setShowResult(true)
    setAnswers(prev => [...prev, { question_id: questions[current].id, answer: opt }])
  }

  async function handleNext() {
    if (current + 1 >= questions.length) {
      // Submit to API
      setFinished(true)
      setSubmitting(true)
      try {
        const allAnswers = [...answers]
        // If current answer hasn't been added yet
        const res = await authFetch(`${API}/api/quiz/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers: allAnswers }),
        })
        const data = await res.json()
        setFinalScore(data)
      } catch {
        setFinalScore({ score: 0, total: questions.length, passed: false, message: 'Error al enviar resultados' })
      }
      setSubmitting(false)
      return
    }
    setCurrent(c => c + 1)
    setSelected(null)
    setShowResult(false)
    setTimeLeft(45)
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8">
          <div className="retro-bar inline-flex rounded-lg mb-4"><span>🔒 ACCESO REQUERIDO</span></div>
          <h1 className="font-display text-4xl text-white mb-4">QUIZ DE VERIFICACIÓN</h1>
          <p className="text-text-muted text-sm mb-6">Debes iniciar sesión para tomar el quiz.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
            <Link to="/register" className="btn-secondary">Registrarse</Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading / Error
  if (loadError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8">
          <p className="font-pixel text-accent-red mb-4" style={{ fontSize: 9 }}>⚠ ERROR</p>
          <p className="text-text-muted text-sm mb-6">{loadError}</p>
          <Link to="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8">
          <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO QUIZ...</p>
        </div>
      </div>
    )
  }

  // Finished
  if (finished) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="glass-panel p-8 text-center">
          {submitting ? (
            <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>PROCESANDO RESULTADOS...</p>
          ) : finalScore ? (
            <>
              <div className="retro-bar inline-flex rounded-lg mb-4">
                <span>{finalScore.passed ? '✅ APROBADO' : '❌ NO APROBADO'}</span>
              </div>
              <div className="font-display text-7xl text-white my-4">{finalScore.score}/{finalScore.total}</div>
              <p className="text-text-muted text-sm mb-6">{finalScore.message}</p>
              <div className="flex gap-3 justify-center">
                <Link to="/profile" className="btn-primary">Mi Perfil</Link>
                <Link to="/" className="btn-secondary">Inicio</Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  const q = questions[current]
  const options = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-text-muted text-sm mb-6 hover:text-white transition-colors">
        ← Cancelar Quiz
      </Link>

      <div className="glass-panel overflow-hidden">
        {/* Progress */}
        <div className="h-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%`, background: 'var(--accent-red)' }} />
        </div>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="badge">Pregunta {current + 1}/{questions.length}</div>
            <div className={`badge ${timeLeft < 10 ? 'badge-red' : ''}`}>
              ⏱ 0:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Question */}
          <h2 className="font-display text-3xl text-white mb-6 leading-tight">{q.question_text}</h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {options.map((opt, i) => {
              const isSelected = selected === opt.key
              let borderColor = 'rgba(255,255,255,0.08)'
              let bg = 'transparent'
              if (showResult && isSelected) {
                borderColor = 'rgba(59,130,246,0.5)'
                bg = 'rgba(59,130,246,0.1)'
              }

              return (
                <button
                  key={opt.key}
                  onClick={() => handleAnswer(opt.key)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${showResult ? 'cursor-not-allowed' : 'cursor-pointer hover:border-white/20 hover:bg-white/3'}`}
                  style={{ borderColor, background: bg }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-accent-blue shrink-0" style={{ fontSize: 9 }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-sm text-white font-medium">{opt.text}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Next */}
          {showResult && (
            <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
              {current + 1 >= questions.length ? 'Ver Resultados' : 'Siguiente →'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-4 mt-4">
        <p className="text-text-dim text-xs">
          ⚠ Necesitas al menos <strong className="text-accent-gold">70%</strong> para desbloquear el derecho a votar. Una oportunidad cada 30 días.
        </p>
      </div>
    </div>
  )
}