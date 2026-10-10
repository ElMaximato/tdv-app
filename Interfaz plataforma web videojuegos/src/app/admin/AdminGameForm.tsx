import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { AdminGameFeaturedSection } from './AdminGameFeaturedSection'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface Platform { id: number; name: string; slug: string }
interface Genre    { id: number; name: string; slug: string }

export function AdminGameForm() {
  const { id }    = useParams()
  const isNew     = !id || id === 'new'
  const navigate  = useNavigate()
  const { adminFetch } = useAdminAuth()

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres,    setGenres]    = useState<Genre[]>([])
  const [loading,   setLoading]   = useState(!isNew)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    title: '', platform_id: '', release_year: '',
    developer: '', publisher: '', description: '',
  })
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [coverFile,    setCoverFile]    = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [currentCover, setCurrentCover] = useState<string | null>(null)

  const [hasFeaturedPage, setHasFeaturedPage] = useState(false)
  const [savedGameId, setSavedGameId] = useState<number | null>(isNew ? null : Number(id))

  const [reviewEnabled, setReviewEnabled] = useState(false)
  const [review, setReview] = useState({
    score_overall:  '',   // 0–100, única calificación
    summary:        '',
    review_body:    '',
    personal_note:  '',
    played_year:    '',
    hours_played:   '',
    is_gem:         false,
    is_essential:   false,
    emilio_rank:    '',
  })

  useEffect(() => {
    fetch(`${API}/api/platforms`).then(r => r.json()).then(setPlatforms)
    fetch(`${API}/api/genres`).then(r => r.json()).then(setGenres)
  }, [])

  useEffect(() => {
    if (isNew) return
    adminFetch(`${API}/api/admin/games/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title:        data.title        || '',
          platform_id:  String(data.platform_id || ''),
          release_year: data.release_year ? String(data.release_year) : '',
          developer:    data.developer    || '',
          publisher:    data.publisher    || '',
          description:  data.description  || '',
        })
        setSelectedGenres((data.genres || []).map((g: Genre) => g.id))
        setCurrentCover(data.cover_image)
        setHasFeaturedPage(!!data.has_featured_page)

        if (data.score_overall != null) {
          setReviewEnabled(true)
          setReview({
            score_overall:  String(data.score_overall),
            summary:        data.summary        || '',
            review_body:    data.review_body    || '',
            personal_note:  data.personal_note  || '',
            played_year:    data.played_year    ? String(data.played_year)  : '',
            hours_played:   data.hours_played   ? String(data.hours_played) : '',
            is_gem:         !!data.is_gem,
            is_essential:   !!data.is_essential,
            emilio_rank:    data.emilio_rank    ? String(data.emilio_rank)  : '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen debe pesar menos de 5MB'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function toggleGenre(gid: number) {
    setSelectedGenres(prev => prev.includes(gid) ? prev.filter(g => g !== gid) : [...prev, gid])
  }

  async function disableFeaturedPage() {
    if (!savedGameId) return
    if (!confirm('¿Eliminar la featured page? Los datos e imágenes se borrarán.')) return
    await adminFetch(`${API}/api/admin/games/${savedGameId}/featured`, { method: 'DELETE' })
    setHasFeaturedPage(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setSaving(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (selectedGenres.length > 0) fd.append('genres', JSON.stringify(selectedGenres))
      if (coverFile) fd.append('cover', coverFile)

      const url    = isNew ? `${API}/api/admin/games` : `${API}/api/admin/games/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const res    = await adminFetch(url, { method, body: fd })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      const gameId = isNew ? data.id : Number(id)
      setSavedGameId(gameId)

      if (reviewEnabled) {
        const reviewBody: Record<string, any> = {}
        Object.entries(review).forEach(([k, v]) => {
          if (typeof v === 'boolean') {
            reviewBody[k] = v
          } else if (v !== '') {
            const isNum = k === 'score_overall' || k.includes('year') || k.includes('hours') || k === 'emilio_rank'
            reviewBody[k] = isNum ? Number(v) : v
          }
        })
        const resRev = await adminFetch(`${API}/api/admin/games/${gameId}/review`, {
          method: 'POST', body: JSON.stringify(reviewBody),
        })
        if (!resRev.ok) {
          const err = await resRev.json()
          throw new Error(err.error || 'Juego guardado pero reseña falló')
        }
      }

      setSuccessMsg(isNew
        ? hasFeaturedPage ? '¡Juego creado! Configura la featured page abajo.' : '¡Juego creado!'
        : '¡Juego actualizado!')

      if (isNew && !hasFeaturedPage) setTimeout(() => navigate('/admin/games'), 1000)
      else if (isNew && hasFeaturedPage) navigate(`/admin/games/${gameId}`, { replace: true })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-8">
      <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p>
    </div>
  )

  const scoreNum = Number(review.score_overall)
  const scoreValid = review.score_overall !== '' && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100

  return (
    <div className="p-6 max-w-7xl">
      <Link to="/admin/games" className="text-text-muted text-sm mb-4 inline-block hover:text-white transition-colors">
        ← Volver
      </Link>

      <div className="mb-6">
        <div className="retro-bar inline-flex rounded-lg mb-2">
          <span>{isNew ? '+ NUEVO JUEGO' : '✏ EDITAR JUEGO'}</span>
        </div>
        <h1 className="font-display text-4xl text-white">{isNew ? 'Crear Juego' : 'Editar Juego'}</h1>
      </div>

      {error      && <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(230,0,18,0.1)',  border: '1px solid rgba(230,0,18,0.3)',  color: '#ff4444', fontSize: 14 }}>{error}</div>}
      {successMsg && <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 14 }}>{successMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="space-y-6">

        {/* ── Información básica ── */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-2xl text-white mb-4">INFORMACIÓN BÁSICA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Título *" full>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-glass" required />
            </Field>
            <Field label="Plataforma *">
              <select value={form.platform_id} onChange={e => setForm({ ...form, platform_id: e.target.value })} className="input-glass" required>
                <option value="">Selecciona...</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Año de lanzamiento">
              <input type="number" value={form.release_year} onChange={e => setForm({ ...form, release_year: e.target.value })} className="input-glass" placeholder="1998" />
            </Field>
            <Field label="Developer">
              <input value={form.developer} onChange={e => setForm({ ...form, developer: e.target.value })} className="input-glass" placeholder="Nintendo EAD" />
            </Field>
            <Field label="Publisher">
              <input value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} className="input-glass" placeholder="Nintendo" />
            </Field>
          </div>
          <Field label="Descripción" full className="mt-4">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-glass min-h-[100px] py-2" rows={4} />
          </Field>
        </section>

        {/* ── Portada ── */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-2xl text-white mb-4">PORTADA</h2>
          <div className="flex items-start gap-4">
            <div className="w-40 aspect-[3/4] rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--bg-elevated)' }}>
              {coverPreview
                ? <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                : currentCover
                  ? <img src={currentCover.startsWith('http') ? currentCover : `${API}/uploads/${currentCover}`} alt="Portada actual" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="font-pixel text-text-dim" style={{ fontSize: 8 }}>SIN PORTADA</span></div>
              }
            </div>
            <div className="flex-1">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="input-glass cursor-pointer" style={{ padding: '8px 12px' }} />
              <p className="text-text-dim text-xs mt-2">JPG, PNG o WebP · Máx 5MB · Recomendado 400×560px</p>
            </div>
          </div>
        </section>

        {/* ── Géneros ── */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-2xl text-white mb-4">GÉNEROS</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map(g => (
              <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGenres.includes(g.id) ? 'bg-accent-red text-white' : 'bg-white/5 text-text-muted hover:text-white'
                }`}>
                {g.name}
              </button>
            ))}
          </div>
        </section>

        </div>{/* fin col izquierda */}

        {/* ── COLUMNA DERECHA ── */}
        <div className="space-y-6">
        {/* ── Reseña de Emilio ── */}
        <section className="glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-white">RESEÑA DE EMILIO</h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={reviewEnabled} onChange={e => setReviewEnabled(e.target.checked)} className="w-4 h-4" />
              <span className="text-text-muted text-sm">Añadir reseña</span>
            </label>
          </div>

          {reviewEnabled && (
            <div className="space-y-5">

              {/* Nota principal 0-100 */}
              <div
                className="p-5 rounded-xl flex items-center gap-6"
                style={{ background: 'rgba(230,0,18,0.06)', border: '2px solid rgba(230,0,18,0.25)' }}
              >
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#e60012' }}>
                    ⭐ CALIFICACIÓN (0 – 100)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={review.score_overall}
                    onChange={e => setReview({ ...review, score_overall: e.target.value })}
                    className="input-glass text-center font-bold"
                    style={{ width: 110, fontSize: 36, height: 64, color: '#e60012', borderColor: 'rgba(230,0,18,0.5)' }}
                    placeholder="94"
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Nota global del juego según Emilio</p>
                  <p className="text-text-muted text-xs mt-1">Escala 0 – 100 · Se muestra en el ranking público</p>
                  {scoreValid && (
                    <p className="text-xs mt-2" style={{ color: '#22c55e' }}>
                      Se mostrará como{' '}
                      <strong style={{ fontSize: 18, color: '#e60012' }}>{review.score_overall}</strong>
                      {' '}en el ranking
                    </p>
                  )}
                </div>
              </div>

              {/* Textos */}
              <Field label="Resumen (máx 300 caracteres)" full>
                <input maxLength={300} value={review.summary} onChange={e => setReview({ ...review, summary: e.target.value })} className="input-glass" placeholder="Una frase que capture la esencia..." />
              </Field>

              <Field label="Reseña completa (Markdown)" full>
                <textarea value={review.review_body} onChange={e => setReview({ ...review, review_body: e.target.value })} className="input-glass min-h-[180px] py-2 font-mono text-sm" rows={8} />
              </Field>

              <Field label="Nota personal de Emilio" full>
                <textarea value={review.personal_note} onChange={e => setReview({ ...review, personal_note: e.target.value })} className="input-glass py-2" rows={3} placeholder="Mi anécdota personal con este juego..." />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Año que lo jugaste">
                  <input type="number" value={review.played_year} onChange={e => setReview({ ...review, played_year: e.target.value })} className="input-glass" placeholder="2003" />
                </Field>
                <Field label="Horas jugadas">
                  <input type="number" value={review.hours_played} onChange={e => setReview({ ...review, hours_played: e.target.value })} className="input-glass" placeholder="40" />
                </Field>
                <Field label="Posición ranking Emilio">
                  <input type="number" value={review.emilio_rank} onChange={e => setReview({ ...review, emilio_rank: e.target.value })} className="input-glass" placeholder="1, 2, 3..." />
                </Field>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={review.is_gem} onChange={e => setReview({ ...review, is_gem: e.target.checked })} className="w-4 h-4" />
                  <span className="text-text-muted text-sm">💎 Joya oculta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={review.is_essential} onChange={e => setReview({ ...review, is_essential: e.target.checked })} className="w-4 h-4" />
                  <span className="text-text-muted text-sm">⭐ Esencial de su generación</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ── Featured Page ── */}
        <section className="glass-panel p-6" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-display text-2xl text-white mb-1">🎬 FEATURED PAGE</h2>
              <p className="text-text-muted text-sm">
                Solo para los juegos más icónicos. Les da una página cinemática con imagen de fondo, trailer, galería y citas de prensa.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-4 select-none">
              <input
                type="checkbox"
                checked={hasFeaturedPage}
                onChange={e => {
                  if (!e.target.checked && savedGameId) disableFeaturedPage()
                  else setHasFeaturedPage(e.target.checked)
                }}
                className="w-5 h-5"
              />
              <span className="text-white text-sm font-semibold">{hasFeaturedPage ? 'Activada' : 'Activar'}</span>
            </label>
          </div>
        </section>

        </div>{/* fin col derecha */}
        </div>{/* fin grid */}

        {/* ── Submit ── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 disabled:opacity-50">
            {saving ? 'Guardando...' : isNew ? 'Crear Juego' : 'Guardar Cambios'}
          </button>
          <Link to="/admin/games" className="btn-secondary px-8 py-3">Cancelar</Link>
        </div>
      </form>

      {hasFeaturedPage && savedGameId && (
        <div className="mt-6">
          <AdminGameFeaturedSection
            gameId={savedGameId}
            enabled={hasFeaturedPage}
            onSaved={() => { setSuccessMsg('¡Featured page guardada!'); setTimeout(() => setSuccessMsg(''), 3000) }}
          />
        </div>
      )}

      {hasFeaturedPage && !savedGameId && (
        <div className="mt-6 glass-panel p-6">
          <p className="text-accent-gold text-sm">💡 Primero guarda el juego para poder configurar la Featured Page</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, full, className = '' }: {
  label: string; children: React.ReactNode; full?: boolean; className?: string
}) {
  return (
    <div className={`${full ? 'md:col-span-2' : ''} ${className}`}>
      <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}