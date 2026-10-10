import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface SagaEntry {
  id?: number
  position: number
  game_id: number | null
  game_title: string | null
  game_slug: string | null
  game_cover: string | null
  platform_name: string | null
  release_year: number | null
  custom_title: string
  custom_platform: string
  custom_year: string
  emilio_verdict: string
  play_reason: string
  is_essential: boolean
  is_optional: boolean
  skip_reason: string
}

interface GameSearchResult {
  id: number
  title: string
  slug: string
  cover_image: string | null
  release_year: number | null
  platform: string
}

function newEntry(position: number): SagaEntry {
  return {
    position,
    game_id: null, game_title: null, game_slug: null, game_cover: null,
    platform_name: null, release_year: null,
    custom_title: '', custom_platform: '', custom_year: '',
    emilio_verdict: '', play_reason: '',
    is_essential: false, is_optional: false, skip_reason: '',
  }
}

function resolveImg(p: string | null) {
  if (!p) return null
  return p.startsWith('http') ? p : `${API}/uploads/${p}`
}

export function AdminSagaForm() {
  const { id }  = useParams()
  const isNew   = !id || id === 'new'
  const navigate = useNavigate()
  const { adminFetch } = useAdminAuth()

  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(!isNew)
  const [error,     setError]     = useState('')
  const [successMsg,setSuccessMsg]= useState('')

  // Campos de la saga
  const [form, setForm] = useState({
    name: '', short_description: '', intro_text: '',
    emilio_note: '', accent_color: '#e60012',
    publisher: '', first_game_year: '',
  })
  const [coverFile,    setCoverFile]    = useState<File | null>(null)
  const [heroFile,     setHeroFile]     = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [heroPreview,  setHeroPreview]  = useState<string | null>(null)
  const [published,    setPublished]    = useState(false)

  // Entradas
  const [entries, setEntries] = useState<SagaEntry[]>([])
  const [savedId, setSavedId] = useState<number | null>(isNew ? null : Number(id))

  // Búsqueda de juego
  const [searchQ,    setSearchQ]    = useState('')
  const [searchRes,  setSearchRes]  = useState<GameSearchResult[]>([])
  const [searching,  setSearching]  = useState(false)
  const [addingToIdx,setAddingToIdx]= useState<number | null>(null)
  const sRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Cargar saga existente ──────────────────────────────────
  useEffect(() => {
    if (isNew) return
    adminFetch(`${API}/api/admin/sagas/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name:              data.name              || '',
          short_description: data.short_description || '',
          intro_text:        data.intro_text        || '',
          emilio_note:       data.emilio_note       || '',
          accent_color:      data.accent_color      || '#e60012',
          publisher:         data.publisher         || '',
          first_game_year:   data.first_game_year ? String(data.first_game_year) : '',
        })
        setPublished(!!data.is_published)
        setEntries((data.entries || []).map((e: any) => ({
          ...e,
          custom_title:    e.custom_title    || '',
          custom_platform: e.custom_platform || '',
          custom_year:     e.custom_year     ? String(e.custom_year) : '',
          emilio_verdict:  e.emilio_verdict  || '',
          play_reason:     e.play_reason     || '',
          skip_reason:     e.skip_reason     || '',
          is_essential:    !!e.is_essential,
          is_optional:     !!e.is_optional,
        })))
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  // ── Búsqueda con debounce ──────────────────────────────────
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchRes([]); return }
    if (sRef.current) clearTimeout(sRef.current)
    sRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const d = await (await fetch(`${API}/api/games?q=${encodeURIComponent(searchQ)}&limit=8`)).json()
        setSearchRes(d.data ?? [])
      } catch { setSearchRes([]) }
      finally { setSearching(false) }
    }, 300)
  }, [searchQ])

  // ── Guardar saga ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (coverFile) fd.append('saga_cover', coverFile)
      if (heroFile)  fd.append('saga_hero',  heroFile)

      const url    = isNew ? `${API}/api/admin/sagas` : `${API}/api/admin/sagas/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const res    = await adminFetch(url, { method, body: fd })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      const sagaId = isNew ? data.id : Number(id)
      setSavedId(sagaId)

      // Guardar entradas
      await adminFetch(`${API}/api/admin/sagas/${sagaId}/entries`, {
        method: 'PUT',
        body: JSON.stringify({
          entries: entries.map((e, i) => ({
            ...e,
            position:     i + 1,
            custom_year:  e.custom_year ? parseInt(e.custom_year) : null,
          })),
        }),
      })

      setSuccessMsg(isNew ? '¡Saga creada!' : '¡Saga actualizada!')
      if (isNew) setTimeout(() => navigate(`/admin/sagas/${sagaId}`), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  // ── Publicar / despublicar ────────────────────────────────
  async function togglePublish() {
    if (!savedId) return
    const next = !published
    await adminFetch(`${API}/api/admin/sagas/${savedId}/publish`, {
      method: 'PATCH', body: JSON.stringify({ published: next }),
    })
    setPublished(next)
    setSuccessMsg(next ? 'Saga publicada ✓' : 'Saga despublicada')
  }

  // ── Entradas helpers ──────────────────────────────────────
  function addEntry() { setEntries([...entries, newEntry(entries.length + 1)]) }
  function removeEntry(idx: number) { setEntries(entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, position: i + 1 }))) }
  function updateEntry(idx: number, patch: Partial<SagaEntry>) {
    setEntries(entries.map((e, i) => i === idx ? { ...e, ...patch } : e))
  }
  function moveEntry(idx: number, dir: -1 | 1) {
    const next = [...entries]
    const target = idx + dir
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    setEntries(next.map((e, i) => ({ ...e, position: i + 1 })))
  }
  function attachGame(idx: number, g: GameSearchResult) {
    updateEntry(idx, {
      game_id:      g.id,
      game_title:   g.title,
      game_slug:    g.slug,
      game_cover:   g.cover_image,
      platform_name: g.platform,
      release_year:  g.release_year,
      custom_title:  '',
    })
    setSearchQ(''); setSearchRes([]); setAddingToIdx(null)
  }
  function detachGame(idx: number) {
    updateEntry(idx, { game_id: null, game_title: null, game_slug: null, game_cover: null, platform_name: null, release_year: null })
  }

  if (loading) return <div className="p-8"><p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p></div>

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <Link to="/admin/sagas" className="text-text-muted text-sm mb-4 inline-block hover:text-white transition-colors">← Volver a Sagas</Link>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="retro-bar inline-flex rounded-lg mb-2">
            <span>{isNew ? '+ NUEVA SAGA' : '✏ EDITAR SAGA'}</span>
          </div>
          <h1 className="font-display text-4xl text-white">{isNew ? 'Crear Saga' : (form.name || 'Editar Saga')}</h1>
        </div>
        {savedId && (
          <div className="flex gap-2">
            <button onClick={togglePublish} className={published ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
              {published ? '⬇ Despublicar' : '▶ Publicar'}
            </button>
            <a href={`/sagas/${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" className="btn-secondary text-sm">
              👁 Ver pública
            </a>
          </div>
        )}
      </div>

      {error      && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444' }}>{error}</div>}
      {successMsg && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Info básica ── */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-2xl text-white mb-4">INFORMACIÓN DE LA SAGA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Nombre *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-glass" placeholder="The Legend of Zelda" required />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Publisher</label>
              <input value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} className="input-glass" placeholder="Nintendo" />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Año del primer juego</label>
              <input type="number" value={form.first_game_year} onChange={e => setForm({ ...form, first_game_year: e.target.value })} className="input-glass" placeholder="1986" />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Color acento</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'none', padding: 2 }} />
                <input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="input-glass flex-1" placeholder="#e60012" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Descripción corta (aparece en la tarjeta)</label>
              <input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className="input-glass" placeholder="La saga de aventura más icónica de Nintendo..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Texto introductorio (se muestra en la página de la saga)</label>
              <textarea value={form.intro_text} onChange={e => setForm({ ...form, intro_text: e.target.value })} className="input-glass py-2 min-h-[120px]" rows={6} placeholder="Escribe aquí la historia de la saga, qué la hace especial...&#10;&#10;Separa párrafos con una línea en blanco." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Nota personal de Emilio</label>
              <textarea value={form.emilio_note} onChange={e => setForm({ ...form, emilio_note: e.target.value })} className="input-glass py-2" rows={3} placeholder="Mi relación personal con esta saga..." />
            </div>
          </div>
        </section>

        {/* ── Imágenes ── */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-2xl text-white mb-4">IMÁGENES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portada */}
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-2 uppercase tracking-wide">Portada (tarjeta 16:9)</label>
              {coverPreview && <img src={coverPreview} alt="" className="w-full aspect-video object-cover rounded-xl mb-2" />}
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }}
                className="input-glass cursor-pointer" style={{ padding: '8px 12px' }} />
            </div>
            {/* Hero */}
            <div>
              <label className="block text-xs text-text-muted font-semibold mb-2 uppercase tracking-wide">Imagen hero (fondo cinematográfico)</label>
              {heroPreview && <img src={heroPreview} alt="" className="w-full aspect-video object-cover rounded-xl mb-2" />}
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setHeroFile(f); setHeroPreview(URL.createObjectURL(f)) } }}
                className="input-glass cursor-pointer" style={{ padding: '8px 12px' }} />
              <p className="text-text-dim text-xs mt-1">Recomendado: 1920×1080px, panorámica con mucho cielo/fondo</p>
            </div>
          </div>
        </section>

        {/* ── ENTRADAS ── */}
        <section className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl text-white">JUEGOS DE LA SAGA</h2>
              <p className="text-text-muted text-xs mt-1">En orden de juego recomendado. Puedes buscar en la BD o agregar manualmente.</p>
            </div>
            <button type="button" onClick={addEntry} className="btn-secondary text-sm">+ Agregar juego</button>
          </div>

          {entries.length === 0 && (
            <div className="text-center py-12 text-text-dim text-sm">
              No hay juegos. Usa el botón de arriba para agregar.
            </div>
          )}

          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={idx} style={{ border: `1px solid ${entry.is_essential ? form.accent_color + '40' : 'rgba(255,255,255,0.08)'}`, borderLeft: entry.is_essential ? `3px solid ${form.accent_color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', background: 'rgba(14,14,24,0.8)' }}>

                {/* Header de la entrada */}
                <div className="flex items-center gap-3 px-4 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="font-pixel text-text-dim" style={{ fontSize: 8, minWidth: 24 }}>#{idx + 1}</span>
                  <div className="flex-1 font-semibold text-sm text-white truncate">
                    {entry.game_title || entry.custom_title || <span className="text-text-dim italic">Sin título</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => moveEntry(idx, -1)} disabled={idx === 0} className="text-text-dim hover:text-white disabled:opacity-30 text-xs px-1">▲</button>
                    <button type="button" onClick={() => moveEntry(idx, 1)} disabled={idx === entries.length - 1} className="text-text-dim hover:text-white disabled:opacity-30 text-xs px-1">▼</button>
                    <button type="button" onClick={() => removeEntry(idx)} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Juego de la BD */}
                  {entry.game_id ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {entry.game_cover && (
                        <img src={resolveImg(entry.game_cover)!} alt="" style={{ width: 36, height: 46, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                      <div className="flex-1">
                        <div className="text-white text-sm font-semibold">{entry.game_title}</div>
                        <div className="text-text-muted text-xs">{entry.platform_name} {entry.release_year ? `· ${entry.release_year}` : ''}</div>
                      </div>
                      <button type="button" onClick={() => detachGame(idx)} className="text-xs text-text-dim hover:text-red-400 transition-colors">Desvincula</button>
                    </div>
                  ) : (
                    <div>
                      {/* Buscador */}
                      <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">Buscar juego en la BD</label>
                      <div className="relative">
                        <input
                          value={addingToIdx === idx ? searchQ : ''}
                          onFocus={() => setAddingToIdx(idx)}
                          onChange={e => { setSearchQ(e.target.value); setAddingToIdx(idx) }}
                          placeholder="Escribe para buscar..."
                          className="input-glass text-sm"
                        />
                        {searching && addingToIdx === idx && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
                        )}
                        {searchRes.length > 0 && addingToIdx === idx && (
                          <div className="absolute z-30 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden" style={{ background: 'rgba(14,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            {searchRes.map(g => (
                              <button key={g.id} type="button" onClick={() => attachGame(idx, g)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5">
                                {g.cover_image && <img src={resolveImg(g.cover_image)!} alt="" style={{ width: 28, height: 36, objectFit: 'cover', borderRadius: 4 }} />}
                                <div>
                                  <div className="text-white text-sm font-semibold">{g.title}</div>
                                  <div className="text-text-muted text-xs">{g.platform} {g.release_year ? `· ${g.release_year}` : ''}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* O título manual */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <input value={entry.custom_title} onChange={e => updateEntry(idx, { custom_title: e.target.value })} placeholder="Título manual" className="input-glass text-sm col-span-1" />
                        <input value={entry.custom_platform} onChange={e => updateEntry(idx, { custom_platform: e.target.value })} placeholder="Plataforma" className="input-glass text-sm" />
                        <input type="number" value={entry.custom_year} onChange={e => updateEntry(idx, { custom_year: e.target.value })} placeholder="Año" className="input-glass text-sm" />
                      </div>
                    </div>
                  )}

                  {/* Campos editoriales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted font-semibold mb-1 uppercase tracking-wide">Veredicto de Emilio</label>
                      <textarea value={entry.emilio_verdict} onChange={e => updateEntry(idx, { emilio_verdict: e.target.value })} className="input-glass text-sm py-2" rows={2} placeholder="Corta opinión sobre este juego en el contexto de la saga..." />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted font-semibold mb-1 uppercase tracking-wide">Por qué jugarlo / saltarlo</label>
                      <textarea value={entry.play_reason || entry.skip_reason} onChange={e => updateEntry(idx, { play_reason: e.target.value, skip_reason: '' })} className="input-glass text-sm py-2" rows={2} placeholder="Qué aporta a la saga, o por qué se puede saltar..." />
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={entry.is_essential} onChange={e => updateEntry(idx, { is_essential: e.target.checked, is_optional: e.target.checked ? false : entry.is_optional })} className="w-4 h-4" />
                      <span className="text-sm text-text-muted">⭐ Esencial</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={entry.is_optional} onChange={e => updateEntry(idx, { is_optional: e.target.checked, is_essential: e.target.checked ? false : entry.is_essential })} className="w-4 h-4" />
                      <span className="text-sm text-text-muted">💡 Opcional / spin-off</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {entries.length > 0 && (
            <button type="button" onClick={addEntry} className="btn-secondary text-sm mt-4 w-full justify-center">
              + Agregar otro juego
            </button>
          )}
        </section>

        {/* ── Submit ── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 disabled:opacity-50">
            {saving ? 'Guardando...' : isNew ? 'Crear Saga' : 'Guardar Cambios'}
          </button>
          <Link to="/admin/sagas" className="btn-secondary px-8 py-3">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
