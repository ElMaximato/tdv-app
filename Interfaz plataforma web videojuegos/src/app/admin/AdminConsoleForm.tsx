import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Section = 'basic' | 'hero' | 'content' | 'specs' | 'gallery' | 'timeline' | 'featured' | 'seo' | 'publish'

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'basic',    label: 'Información Básica',  icon: '📋' },
  { id: 'hero',     label: 'Hero Section',         icon: '🎬' },
  { id: 'content',  label: 'Contenido',            icon: '📝' },
  { id: 'specs',    label: 'Especificaciones',     icon: '⚙️' },
  { id: 'gallery',  label: 'Multimedia',           icon: '📸' },
  { id: 'timeline', label: 'Timeline',             icon: '📅' },
  { id: 'featured', label: 'Juegos Destacados',    icon: '⭐' },
  { id: 'seo',      label: 'SEO',                  icon: '🔍' },
  { id: 'publish',  label: 'Publicación',          icon: '🚀' },
]

interface TimelineEvent {
  id?: number
  event_year: number
  event_date: string | null
  title: string
  description: string | null
  icon: string | null
  position: number
}

interface FeaturedGame {
  game_id: number
  title: string
  slug: string
  cover_image: string | null
  position: number
  caption: string | null
}

export function AdminConsoleForm() {
  const { id } = useParams()
  const isNew  = !id || id === 'new'
  const navigate = useNavigate()
  const { adminFetch } = useAdminAuth()

  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving]   = useState(false)
  const [savedId, setSavedId] = useState<number | null>(isNew ? null : Number(id))
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // ─── Estado del formulario ───────────────────────────────
  const [form, setForm] = useState({
    name: '', slug: '', generation: '', manufacturer: '',
    release_year: '', discontinued_year: '',
    hero_title: '', hero_subtitle: '',
    short_description: '', full_history: '',
    accent_color: '#e60012', secondary_color: '#fbbf24',
    meta_title: '', meta_description: '', meta_keywords: '',
    is_published: true,
  })

  // Arrays dinámicos
  const [keyFeatures, setKeyFeatures] = useState<string[]>([])
  const [techSpecs, setTechSpecs]     = useState<{ label: string; value: string }[]>([])
  const [trivia, setTrivia]           = useState<string[]>([])

  // Imágenes
  const [heroBannerFile, setHeroBannerFile]       = useState<File | null>(null)
  const [heroBannerPreview, setHeroBannerPreview] = useState<string | null>(null)
  const [currentHeroBanner, setCurrentHeroBanner] = useState<string | null>(null)

  const [heroLogoFile, setHeroLogoFile]       = useState<File | null>(null)
  const [heroLogoPreview, setHeroLogoPreview] = useState<string | null>(null)
  const [currentHeroLogo, setCurrentHeroLogo] = useState<string | null>(null)

  const [heroConsoleImgFile, setHeroConsoleImgFile]       = useState<File | null>(null)
  const [heroConsoleImgPreview, setHeroConsoleImgPreview] = useState<string | null>(null)
  const [currentHeroConsoleImg, setCurrentHeroConsoleImg] = useState<string | null>(null)

  // Galería
  const [galleryFiles, setGalleryFiles]               = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews]         = useState<string[]>([])
  const [existingGallery, setExistingGallery]         = useState<{ path: string; caption: string }[]>([])

  // Timeline (gestionado en endpoints separados)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])

  // Juegos destacados (gestionado por endpoint separado)
  const [featuredGames, setFeaturedGames] = useState<FeaturedGame[]>([])
  const [allGames, setAllGames]           = useState<any[]>([])

  // ─── Cargar datos al editar ───────────────────────────────
  useEffect(() => {
    if (isNew) return
    adminFetch(`${API}/api/admin/platforms/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          generation: data.generation || '',
          manufacturer: data.manufacturer || '',
          release_year: data.release_year ? String(data.release_year) : '',
          discontinued_year: data.discontinued_year ? String(data.discontinued_year) : '',
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          short_description: data.short_description || '',
          full_history: data.full_history || '',
          accent_color: data.accent_color || '#e60012',
          secondary_color: data.secondary_color || '#fbbf24',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          meta_keywords: data.meta_keywords || '',
          is_published: !!data.is_published,
        })
        setKeyFeatures(data.key_features || [])
        setTechSpecs(data.tech_specs || [])
        setTrivia(data.trivia || [])
        setExistingGallery(data.gallery || [])
        setCurrentHeroBanner(data.hero_banner)
        setCurrentHeroLogo(data.hero_logo)
        setCurrentHeroConsoleImg(data.hero_console_img)
        setTimeline(data.timeline || [])
        setFeaturedGames(data.featured_games || [])
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  // Cargar lista de juegos para el selector de destacados
  useEffect(() => {
    if (!savedId) return
    adminFetch(`${API}/api/admin/games?limit=200&status=published`)
      .then(r => r.json())
      .then(data => {
        // Filtrar solo los de esta plataforma
        // (el endpoint actual no filtra por plataforma, pero la mayoría serán relevantes)
        setAllGames(data.data || [])
      })
  }, [savedId])

  // ─── Helper de imagen ─────────────────────────────────────
  function handleImageChange(setter: (f: File) => void, previewSetter: (url: string) => void, maxMB = 8) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > maxMB * 1024 * 1024) { setError(`Imagen debe pesar menos de ${maxMB}MB`); return }
      setter(file)
      previewSetter(URL.createObjectURL(file))
    }
  }

  function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setGalleryFiles(prev => [...prev, ...files])
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  // ─── Guardar ──────────────────────────────────────────────
  async function handleSave() {
    setError(''); setSuccess(''); setSaving(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') fd.append(k, String(v))
        else if (v) fd.append(k, v)
      })

      // Arrays JSON
      fd.append('key_features', JSON.stringify(keyFeatures.filter(Boolean)))
      fd.append('tech_specs',   JSON.stringify(techSpecs.filter(s => s.label && s.value)))
      fd.append('trivia',       JSON.stringify(trivia.filter(Boolean)))

      // Imágenes
      if (heroBannerFile)     fd.append('hero_banner',      heroBannerFile)
      if (heroLogoFile)       fd.append('hero_logo',        heroLogoFile)
      if (heroConsoleImgFile) fd.append('hero_console_img', heroConsoleImgFile)

      // Galería: existing + new
      fd.append('existing_gallery', JSON.stringify(existingGallery))
      galleryFiles.forEach(f => fd.append('gallery', f))

      const url = isNew ? `${API}/api/admin/platforms` : `${API}/api/admin/platforms/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await adminFetch(url, { method, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      const newId = isNew ? data.id : Number(id)
      setSavedId(newId)

      setSuccess('¡Consola guardada!')

      if (isNew) {
        setTimeout(() => navigate(`/admin/consoles/${newId}`, { replace: true }), 800)
      } else {
        // Limpiar archivos pendientes
        setHeroBannerFile(null); setHeroBannerPreview(null)
        setHeroLogoFile(null);   setHeroLogoPreview(null)
        setHeroConsoleImgFile(null); setHeroConsoleImgPreview(null)
        setGalleryFiles([]); setGalleryPreviews([])
        // Recargar para que existing_gallery refleje las subidas
        setTimeout(() => location.reload(), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  // ─── Featured Games — guardar selección ───────────────────
  async function saveFeaturedGames() {
    if (!savedId) return
    const res = await adminFetch(`${API}/api/admin/platforms/${savedId}/featured-games`, {
      method: 'POST',
      body: JSON.stringify({
        games: featuredGames.map((g, i) => ({ game_id: g.game_id, position: i, caption: g.caption })),
      }),
    })
    if (!res.ok) { alert('Error al guardar destacados'); return }
    setSuccess('Juegos destacados guardados')
    setTimeout(() => setSuccess(''), 2000)
  }

  // ─── Timeline — CRUD ──────────────────────────────────────
  async function addTimelineEvent() {
    if (!savedId) return
    const newEvent = { event_year: new Date().getFullYear(), title: '', description: '', icon: '', position: 0 }
    const res = await adminFetch(`${API}/api/admin/platforms/${savedId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(newEvent),
    })
    const data = await res.json()
    setTimeline([...timeline, { ...newEvent, id: data.id, event_date: null }])
  }

  async function updateTimelineEvent(idx: number, updates: Partial<TimelineEvent>) {
    const updated = [...timeline]
    updated[idx] = { ...updated[idx], ...updates }
    setTimeline(updated)
    if (updated[idx].id) {
      await adminFetch(`${API}/api/admin/timeline/${updated[idx].id}`, {
        method: 'PUT',
        body: JSON.stringify(updated[idx]),
      })
    }
  }

  async function deleteTimelineEvent(idx: number) {
    if (!confirm('¿Eliminar este evento?')) return
    const event = timeline[idx]
    if (event.id) {
      await adminFetch(`${API}/api/admin/timeline/${event.id}`, { method: 'DELETE' })
    }
    setTimeline(timeline.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="p-8"><p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p></div>

  return (
    <div className="p-8">
      <Link to="/admin/consoles" className="text-text-muted text-sm mb-4 inline-block hover:text-white transition-colors">← Volver a consolas</Link>

      <div className="mb-6">
        <div className="retro-bar inline-flex rounded-lg mb-2">
          <span>{isNew ? '+ NUEVA CONSOLA' : '✏ EDITAR CONSOLA'}</span>
        </div>
        <h1 className="font-display text-4xl text-white">
          {isNew ? 'Crear Consola' : form.name || 'Editar Consola'}
        </h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(230,0,18,0.1)', border: '1px solid rgba(230,0,18,0.3)', color: '#ff4444', fontSize: 14 }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 14 }}>{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        {/* Sidebar de secciones */}
        <aside className="glass-panel p-3 h-fit sticky top-24">
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const disabled = !savedId && (s.id === 'gallery' || s.id === 'timeline' || s.id === 'featured')
              return (
                <button
                  key={s.id}
                  onClick={() => !disabled && setActiveSection(s.id)}
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    activeSection === s.id
                      ? 'bg-accent-red/15 text-white border border-accent-red/30'
                      : 'text-text-muted hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="flex-1">{s.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-sm py-2.5 disabled:opacity-50">
              {saving ? 'Guardando...' : isNew ? 'Crear Consola' : '💾 Guardar Cambios'}
            </button>
            {!isNew && (
              <Link
                to={`/console/${form.slug}`}
                target="_blank"
                className="btn-secondary w-full text-xs py-2 mt-2 justify-center text-center block"
              >
                👁 Vista previa
              </Link>
            )}
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="space-y-6">

          {/* ─── BASIC INFO ─── */}
          {activeSection === 'basic' && (
            <section className="glass-panel p-6">
              <h2 className="font-display text-2xl text-white mb-4">📋 Información Básica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombre *" full>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-glass" required />
                </Field>
                <Field label="Slug (URL) *">
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input-glass font-mono" placeholder="snes" required />
                </Field>
                <Field label="Generación">
                  <input type="number" value={form.generation} onChange={e => setForm({ ...form, generation: e.target.value })} className="input-glass" placeholder="4" />
                </Field>
                <Field label="Fabricante">
                  <input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="input-glass" placeholder="Nintendo" />
                </Field>
                <Field label="Año de lanzamiento">
                  <input type="number" value={form.release_year} onChange={e => setForm({ ...form, release_year: e.target.value })} className="input-glass" placeholder="1990" />
                </Field>
                <Field label="Año de descontinuación">
                  <input type="number" value={form.discontinued_year} onChange={e => setForm({ ...form, discontinued_year: e.target.value })} className="input-glass" placeholder="2003" />
                </Field>
              </div>

              <div className="mt-6">
                <label className="block text-xs text-text-muted font-semibold mb-2 uppercase">Tematización Visual</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-dim mb-1">Color principal</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-12 h-9 rounded cursor-pointer border-0" />
                      <input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="input-glass flex-1 font-mono text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-dim mb-1">Color secundario</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} className="w-12 h-9 rounded cursor-pointer border-0" />
                      <input value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} className="input-glass flex-1 font-mono text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── HERO ─── */}
          {activeSection === 'hero' && (
            <section className="glass-panel p-6">
              <h2 className="font-display text-2xl text-white mb-4">🎬 Hero Section</h2>
              <p className="text-text-muted text-sm mb-4">El primer impacto visual al entrar a la página de la consola.</p>

              <div className="space-y-4 mb-6">
                <Field label="Título principal del hero">
                  <input value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} className="input-glass" placeholder="(opcional, por defecto se usa el nombre)" />
                  <p className="text-text-dim text-xs mt-1">Texto gigante que aparece atrás de la imagen, estilo "LOGAN"</p>
                </Field>
                <Field label="Subtítulo">
                  <input value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} className="input-glass" placeholder="LA REVOLUCIÓN DEL 16-BIT" />
                </Field>
              </div>

              <ImageField
                label="Imagen Banner (fondo)"
                hint="Foto/arte de fondo cinemático. Recomendado 1920×1080."
                preview={heroBannerPreview}
                current={currentHeroBanner}
                onChange={handleImageChange(setHeroBannerFile, setHeroBannerPreview)}
              />
              <ImageField
                label="Logo de la Consola"
                hint="Logo oficial. PNG con fondo transparente. ~600px ancho."
                preview={heroLogoPreview}
                current={currentHeroLogo}
                onChange={handleImageChange(setHeroLogoFile, setHeroLogoPreview, 4)}
                aspectRatio="3/1"
              />
              <ImageField
                label="Imagen del Producto"
                hint="Foto de la consola física flotante en el hero. PNG transparente recomendado."
                preview={heroConsoleImgPreview}
                current={currentHeroConsoleImg}
                onChange={handleImageChange(setHeroConsoleImgFile, setHeroConsoleImgPreview)}
              />
            </section>
          )}

          {/* ─── CONTENT ─── */}
          {activeSection === 'content' && (
            <section className="glass-panel p-6 space-y-6">
              <h2 className="font-display text-2xl text-white">📝 Contenido</h2>

              <Field label="Descripción corta" full>
                <input maxLength={500} value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className="input-glass" placeholder="Una frase que capture la esencia de la consola..." />
              </Field>

              <Field label="Historia completa (Markdown)" full>
                <textarea value={form.full_history} onChange={e => setForm({ ...form, full_history: e.target.value })} className="input-glass py-2 font-mono text-sm" rows={10} placeholder="La SNES fue lanzada por Nintendo en 1990 en Japón..." />
              </Field>

              <DynamicArrayField
                label="Características clave"
                items={keyFeatures}
                onChange={setKeyFeatures}
                placeholder="Ej: Procesador de 16-bit"
                hint="Lista de bullet points que aparecen como pills"
                maxItems={8}
              />
            </section>
          )}

          {/* ─── SPECS ─── */}
          {activeSection === 'specs' && (
            <section className="glass-panel p-6">
              <h2 className="font-display text-2xl text-white mb-4">⚙️ Especificaciones Técnicas</h2>
              <p className="text-text-muted text-sm mb-4">Cards técnicas que aparecen en la página individual.</p>

              <div className="space-y-2">
                {techSpecs.map((spec, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <input
                      value={spec.label}
                      onChange={e => setTechSpecs(techSpecs.map((s, idx) => idx === i ? { ...s, label: e.target.value } : s))}
                      placeholder="CPU"
                      className="input-glass flex-1 text-sm"
                    />
                    <input
                      value={spec.value}
                      onChange={e => setTechSpecs(techSpecs.map((s, idx) => idx === i ? { ...s, value: e.target.value } : s))}
                      placeholder="Ricoh 5A22 @ 3.58 MHz"
                      className="input-glass flex-[2] text-sm"
                    />
                    <button type="button" onClick={() => setTechSpecs(techSpecs.filter((_, idx) => idx !== i))}
                      className="btn-secondary text-xs px-2 py-1" style={{ color: '#ff4444' }}>✕</button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setTechSpecs([...techSpecs, { label: '', value: '' }])}
                className="btn-secondary text-sm mt-3">+ Añadir especificación</button>

              <div className="mt-8">
                <DynamicArrayField
                  label="Trivia / Datos curiosos"
                  items={trivia}
                  onChange={setTrivia}
                  placeholder="¿Sabías que..."
                  hint="Datos curiosos que aparecen en sección 'Curiosidades'"
                  maxItems={10}
                  textarea
                />
              </div>
            </section>
          )}

          {/* ─── GALLERY ─── */}
          {activeSection === 'gallery' && (
            <section className="glass-panel p-6">
              <h2 className="font-display text-2xl text-white mb-4">📸 Galería Multimedia</h2>
              {!savedId && <p className="text-accent-gold text-sm mb-4">💡 Guarda la consola primero para subir imágenes a la galería.</p>}

              {savedId && (
                <>
                  {existingGallery.length > 0 && (
                    <div className="mb-4">
                      <p className="text-text-dim text-xs mb-2">Imágenes actuales ({existingGallery.length}):</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {existingGallery.map((img, i) => (
                          <div key={i} className="relative group aspect-[4/5] rounded overflow-hidden">
                            <img src={`${API}/uploads/${img.path}`} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={async () => {
                              if (!confirm('¿Eliminar esta imagen?')) return
                              await adminFetch(`${API}/api/admin/platforms/${savedId}/gallery/${i}`, { method: 'DELETE' })
                              setExistingGallery(existingGallery.filter((_, idx) => idx !== i))
                            }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {galleryPreviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-text-dim text-xs mb-2">Pendientes de subir ({galleryPreviews.length}):</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {galleryPreviews.map((src, i) => (
                          <div key={i} className="relative group aspect-[4/5] rounded overflow-hidden">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => {
                              setGalleryFiles(galleryFiles.filter((_, idx) => idx !== i))
                              setGalleryPreviews(galleryPreviews.filter((_, idx) => idx !== i))
                            }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryFiles} className="input-glass cursor-pointer" style={{ padding: '8px 12px' }} />
                  <p className="text-text-dim text-xs mt-2">JPG, PNG o WebP · Máx 8MB cada una</p>
                </>
              )}
            </section>
          )}

          {/* ─── TIMELINE ─── */}
          {activeSection === 'timeline' && (
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-white">📅 Timeline</h2>
                {savedId && <button onClick={addTimelineEvent} className="btn-primary text-sm">+ Añadir evento</button>}
              </div>
              {!savedId && <p className="text-accent-gold text-sm">💡 Guarda la consola primero para crear timeline.</p>}

              {savedId && (
                <div className="space-y-3">
                  {timeline.length === 0 ? (
                    <p className="text-text-muted text-sm italic">Sin eventos aún. Añade hitos importantes en la historia de la consola.</p>
                  ) : timeline.map((event, i) => (
                    <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-[100px,80px,1fr,80px] gap-2 items-start">
                        <input type="number" value={event.event_year} onChange={e => updateTimelineEvent(i, { event_year: Number(e.target.value) })} className="input-glass text-sm" placeholder="1991" />
                        <input value={event.icon || ''} onChange={e => updateTimelineEvent(i, { icon: e.target.value })} className="input-glass text-sm text-center" placeholder="🎮" />
                        <input value={event.title} onChange={e => updateTimelineEvent(i, { title: e.target.value })} className="input-glass text-sm" placeholder="Lanzamiento en EUA" />
                        <button onClick={() => deleteTimelineEvent(i)} className="btn-secondary text-xs px-2 py-1" style={{ color: '#ff4444' }}>🗑</button>
                      </div>
                      <textarea
                        value={event.description || ''}
                        onChange={e => updateTimelineEvent(i, { description: e.target.value })}
                        className="input-glass mt-2 py-2 text-sm"
                        rows={2}
                        placeholder="Descripción del evento (opcional)"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ─── FEATURED GAMES ─── */}
          {activeSection === 'featured' && (
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-white">⭐ Juegos Destacados</h2>
                {savedId && featuredGames.length > 0 && <button onClick={saveFeaturedGames} className="btn-primary text-sm">💾 Guardar selección</button>}
              </div>
              {!savedId && <p className="text-accent-gold text-sm">💡 Guarda la consola primero.</p>}

              {savedId && (
                <>
                  <p className="text-text-muted text-sm mb-4">
                    Selecciona los juegos que aparecerán como "destacados" en la página de la consola.
                    No se generan automáticamente — los curas tú.
                  </p>

                  {/* Seleccionados */}
                  {featuredGames.length > 0 && (
                    <div className="mb-4">
                      <p className="text-text-dim text-xs mb-2">Destacados ({featuredGames.length}):</p>
                      <div className="space-y-2">
                        {featuredGames.map((g, i) => (
                          <div key={g.game_id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="font-pixel text-accent-gold w-8" style={{ fontSize: 12 }}>{i + 1}</span>
                            {g.cover_image && <img src={`${API}/uploads/${g.cover_image}`} className="w-10 h-14 object-cover rounded" alt="" />}
                            <div className="flex-1">
                              <p className="text-white text-sm font-semibold">{g.title}</p>
                              <input
                                value={g.caption || ''}
                                onChange={e => setFeaturedGames(featuredGames.map((f, idx) => idx === i ? { ...f, caption: e.target.value } : f))}
                                className="input-glass mt-1 text-xs"
                                placeholder="Caption (opcional)"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => i > 0 && setFeaturedGames([...featuredGames.slice(0, i-1), featuredGames[i], featuredGames[i-1], ...featuredGames.slice(i+1)])} disabled={i === 0} className="btn-secondary text-xs px-2 py-0.5 disabled:opacity-30">↑</button>
                              <button onClick={() => i < featuredGames.length-1 && setFeaturedGames([...featuredGames.slice(0, i), featuredGames[i+1], featuredGames[i], ...featuredGames.slice(i+2)])} disabled={i === featuredGames.length-1} className="btn-secondary text-xs px-2 py-0.5 disabled:opacity-30">↓</button>
                            </div>
                            <button onClick={() => setFeaturedGames(featuredGames.filter((_, idx) => idx !== i))} className="btn-secondary text-xs px-2 py-1" style={{ color: '#ff4444' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selector */}
                  <div>
                    <p className="text-text-dim text-xs mb-2">Añadir desde el catálogo:</p>
                    <select
                      onChange={e => {
                        const gid = parseInt(e.target.value)
                        if (!gid || featuredGames.find(f => f.game_id === gid)) return
                        const game = allGames.find(g => g.id === gid)
                        if (!game) return
                        setFeaturedGames([...featuredGames, {
                          game_id: game.id, title: game.title, slug: game.slug,
                          cover_image: game.cover_image, position: featuredGames.length, caption: null,
                        }])
                        e.target.value = ''
                      }}
                      className="input-glass"
                    >
                      <option value="">— Selecciona un juego —</option>
                      {allGames
                        .filter(g => !featuredGames.find(f => f.game_id === g.id))
                        .map(g => <option key={g.id} value={g.id}>{g.title} ({g.platform})</option>)
                      }
                    </select>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ─── SEO ─── */}
          {activeSection === 'seo' && (
            <section className="glass-panel p-6 space-y-4">
              <h2 className="font-display text-2xl text-white mb-2">🔍 SEO</h2>
              <p className="text-text-muted text-sm">Optimización para buscadores. Si lo dejas vacío se usa el nombre y descripción cortos.</p>

              <Field label="Meta Title (50-60 chars)" full>
                <input maxLength={70} value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} className="input-glass" />
                <p className="text-text-dim text-xs mt-1">{form.meta_title.length}/70</p>
              </Field>
              <Field label="Meta Description (150-160 chars)" full>
                <textarea maxLength={160} value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} className="input-glass py-2 text-sm" rows={3} />
                <p className="text-text-dim text-xs mt-1">{form.meta_description.length}/160</p>
              </Field>
              <Field label="Keywords (separadas por comas)" full>
                <input value={form.meta_keywords} onChange={e => setForm({ ...form, meta_keywords: e.target.value })} className="input-glass" placeholder="snes, super nintendo, retro, 16-bit" />
              </Field>
            </section>
          )}

          {/* ─── PUBLISH ─── */}
          {activeSection === 'publish' && (
            <section className="glass-panel p-6">
              <h2 className="font-display text-2xl text-white mb-4">🚀 Publicación</h2>

              <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors hover:bg-white/3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-semibold">Publicar consola</p>
                  <p className="text-text-muted text-xs">Si está activado, la consola será visible en el sitio público.</p>
                </div>
              </label>

              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-accent-gold text-sm font-semibold mb-1">💡 Antes de publicar, verifica:</p>
                <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
                  <li>Hero banner subido (la imagen de fondo es la más importante)</li>
                  <li>Al menos descripción corta llenada</li>
                  <li>Color de acento configurado</li>
                  <li>Idealmente: especificaciones, juegos destacados y galería</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ─────────────────────────────────

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function ImageField({ label, hint, preview, current, onChange, aspectRatio = '16/9' }: {
  label: string; hint: string;
  preview: string | null; current: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aspectRatio?: string;
}) {
  return (
    <div className="mb-5">
      <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="w-64 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--bg-elevated)', aspectRatio }}>
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" />
          : current ? <img src={current.startsWith('http') ? current : `${API}/uploads/${current}`} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="font-pixel text-text-dim" style={{ fontSize: 8 }}>SIN IMAGEN</span></div>}
        </div>
        <div className="flex-1">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="input-glass cursor-pointer" style={{ padding: '8px 12px' }} />
          <p className="text-text-dim text-xs mt-2">{hint}</p>
        </div>
      </div>
    </div>
  )
}

function DynamicArrayField({ label, items, onChange, placeholder, hint, maxItems, textarea }: {
  label: string; items: string[]; onChange: (items: string[]) => void;
  placeholder: string; hint?: string; maxItems?: number; textarea?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">{label}</label>
        {(!maxItems || items.length < maxItems) && (
          <button type="button" onClick={() => onChange([...items, ''])} className="btn-secondary text-xs px-3 py-1">+ Añadir</button>
        )}
      </div>
      {hint && <p className="text-text-dim text-xs mb-2">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            {textarea ? (
              <textarea value={item} onChange={e => onChange(items.map((x, idx) => idx === i ? e.target.value : x))} placeholder={placeholder} className="input-glass flex-1 py-2 text-sm" rows={2} />
            ) : (
              <input value={item} onChange={e => onChange(items.map((x, idx) => idx === i ? e.target.value : x))} placeholder={placeholder} className="input-glass flex-1 text-sm" />
            )}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="btn-secondary text-xs px-2 py-1" style={{ color: '#ff4444' }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-text-dim text-xs italic">Sin items aún.</p>}
      </div>
    </div>
  )
}
