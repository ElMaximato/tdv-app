import { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface Question {
  id: number
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_opt: 'a' | 'b' | 'c' | 'd'
  difficulty: 'easy' | 'medium' | 'hard'
}

const EMPTY: Omit<Question, 'id'> = {
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_opt: 'a', difficulty: 'medium',
}

export function AdminQuiz() {
  const { adminFetch } = useAdminAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Question> | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await adminFetch(`${API}/api/admin/quiz/questions`)
      if (res.ok) {
        setQuestions(await res.json())
      }
    } catch (error) {
      console.error("Error cargando preguntas:", error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const isNew = !editing.id
    const url = isNew ? `${API}/api/admin/quiz/questions` : `${API}/api/admin/quiz/questions/${editing.id}`
    
    try {
      const res = await adminFetch(url, { 
        method: isNew ? 'POST' : 'PUT', 
        body: JSON.stringify(editing) 
      })
      if (!res.ok) { 
        const err = await res.json()
        alert(err.error)
        return 
      }
      setEditing(null)
      load()
    } catch (error) {
      console.error("Error guardando:", error)
    }
  }

  async function del(id: number) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await adminFetch(`${API}/api/admin/quiz/questions/${id}`, { method: 'DELETE' })
      load()
    } catch (error) {
      console.error("Error eliminando:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="retro-bar inline-flex rounded-lg mb-2"><span>🧩 QUIZ</span></div>
          <h1 className="font-display text-4xl text-white">PREGUNTAS DEL QUIZ</h1>
        </div>
        <button onClick={() => setEditing(EMPTY)} className="btn-primary text-sm">+ Nueva Pregunta</button>
      </div>

      {editing && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="font-display text-2xl text-white mb-4">{editing.id ? 'Editar' : 'Nueva'} pregunta</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1 uppercase">Pregunta</label>
              <textarea 
                value={editing.question_text || ''} 
                onChange={e => setEditing({ ...editing, question_text: e.target.value })} 
                className="input-glass py-2" rows={2} required 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['a','b','c','d'] as const).map(k => (
                <div key={k}>
                  <label className="block text-xs text-text-muted mb-1 uppercase">Opción {k.toUpperCase()}</label>
                  <input 
                    value={editing[`option_${k}` as keyof Question] as string || ''} 
                    onChange={e => setEditing({ ...editing, [`option_${k}`]: e.target.value })} 
                    className="input-glass" required 
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1 uppercase">Respuesta correcta</label>
                <select 
                  value={editing.correct_opt || 'a'} 
                  onChange={e => setEditing({ ...editing, correct_opt: e.target.value as any })} 
                  className="input-glass"
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 uppercase">Dificultad</label>
                <select 
                  value={editing.difficulty || 'medium'} 
                  onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })} 
                  className="input-glass"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Sin preguntas. ¡Crea la primera!</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {questions.map(q => (
              <div key={q.id} className="p-4 hover:bg-white/3 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge text-xs">#{q.id}</span>
                      <span className={`badge text-xs ${q.difficulty === 'hard' ? 'badge-red' : q.difficulty === 'easy' ? 'badge-green' : 'badge-gold'}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-white text-sm font-semibold mb-2">{q.question_text}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {(['a','b','c','d'] as const).map(k => (
                        <div key={k} className={q.correct_opt === k ? 'text-accent-green' : 'text-text-muted'}>
                          {k.toUpperCase()}. {q[`option_${k}` as keyof Question] as string} {q.correct_opt === k && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(q)} className="btn-secondary text-xs px-3 py-1">Editar</button>
                    <button onClick={() => del(q.id)} className="btn-secondary text-xs px-3 py-1" style={{ color: '#ff4444' }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}