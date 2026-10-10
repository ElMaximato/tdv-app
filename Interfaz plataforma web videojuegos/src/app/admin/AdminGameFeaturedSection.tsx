import { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface PressQuote {
  text:   string
  source: string
  rating?: number
}

interface Screenshot {
  path:    string
  caption: string
}

interface FeatureHighlight {
  title:       string
  description: string
}

interface Props {
  gameId:  number | null
  enabled: boolean
  onSaved: () => void
}

/**
 * Sección del admin para configurar la "Featured Page" de un juego.
 * Se renderiza dentro de AdminGameForm solo si el toggle está activado.
 */
export function AdminGameFeaturedSection({ gameId, enabled, onSaved }: Props) {
  const { adminFetch } = useAdminAuth()

  // Campos de texto
  const [tagline, setTagline] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [trailerUrl, setTrailerUrl] = useState('')
  const [accentColor, setAccentColor] = useState('#e60012')

  // Archivos
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [currentHero, setCurrentHero] = useState<string | null>(null)

  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([])
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([])
  const [existingScreenshots, setExistingScreenshots] = useState<Screenshot[]>([])

  // Arrays dinámicos
  const [quotes, setQuotes] = useState<PressQuote[]>([])
  const [highlights, setHighlights] = useState<FeatureHighlight[]>([])

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ─── Cargar datos existentes cuando el juego ya existe ───
  useEffect(() => {
    if (!gameId || !enabled) return
    adminFetch(`${API}/api/admin/games/${gameId}/featured`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setTagline(data.tagline || '')
        setLongDescription(data.long_description || '')
        setTrailerUrl(data.trailer_url || '')
        setAccentColor(data.accent_color || '#e60012')
        setCurrentHero(data.hero_image || null)
        setQuotes(data.press_quotes || [])
        setHighlights(data.feature_highlights || [])
        setExistingScreenshots(data.screenshots || [])
      })
      .catch(() => {})
  }, [gameId, enabled])

  // ─── Handlers ────────────────────────────────────────────
  function handleHeroChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setMsg({ type: 'err', text: 'Hero debe pesar menos de 8MB' }); return }
    setHeroFile(file)
    setHeroPreview(URL.createObjectURL(file))
  }

  function handleScreenshotsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setScreenshotFiles(prev => [...prev, ...files])
    setScreenshotPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function removeNewScreenshot(i: number) {
    setScreenshotFiles(prev => prev.filter((_, idx) => idx !== i))
    setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function removeExistingScreenshot(i: number) {
    setExistingScreenshots(prev => prev.filter((_, idx) => idx !== i))
  }

  // ─── Guardar ─────────────────────────────────────────────
  async function handleSave() {
    if (!gameId) { setMsg({ type: 'err', text: 'Guarda el juego primero antes de configurar featured' }); return }
    if (!heroFile && !currentHero) { setMsg({ type: 'err', text: 'Se requiere imagen de fondo (hero)' }); return }

    setSaving(true); setMsg(null)
    try {
      const fd = new FormData()
      if (heroFile) fd.append('hero_image', heroFile)
      if (currentHero) fd.append('existing_hero', currentHero)
      screenshotFiles.forEach(f => fd.append('screenshots', f))
      fd.append('existing_screenshots', JSON.stringify(existingScreenshots))

      if (trailerUrl) fd.append('trailer_url', trailerUrl)
      if (tagline) fd.append('tagline', tagline)
      if (longDescription) fd.append('long_description', longDescription)
      fd.append('accent_color', accentColor)
      fd.append('press_quotes', JSON.stringify(quotes))
      fd.append('feature_highlights', JSON.stringify(highlights))

      const res = await adminFetch(`${API}/api/admin/games/${gameId}/featured`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      setMsg({ type: 'ok', text: '¡Featured page guardada!' })
      setHeroFile(null)
      setScreenshotFiles([])
      setScreenshotPreviews([])
      if (data.hero_image) setCurrentHero(data.hero_image)
      onSaved()
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setSaving(false)
    }
  }

  if (!enabled) return null

  return (
    <section className="glass-panel p-6" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-white">🎬 FEATURED PAGE</h2>
          <p className="text-text-muted text-xs mt-1">
            Página cinemática especial para este juego. Se mostrará en lugar de la vista estándar.
          </p>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(230,0,18,0.1)',
            border: msg.type === 'ok' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(230,0,18,0.3)',
            color: msg.type === 'ok' ? '#22c55e' : '#ff4444',
          }}>
          {msg.text}
        </div>
      )}

      {/* Hero image */}
      <div className="mb-5">
        <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">
          Imagen de fondo (Hero) * — Recomendado 1920×1080
        </label>
        <div className="flex gap-4">
          <div className="w-80 aspect-video rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--bg-elevated)' }}>
            {heroPreview ? (
              <img src={heroPreview} alt="Hero preview" className="w-full h-full object-cover" />
            ) : currentHero ? (
              <img src={currentHero.startsWith('http') ? currentHero : `${API}/uploads/${currentHero}`} alt="Hero actual" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-pixel text-text-dim" style={{ fontSize: 8 }}>SIN IMAGEN</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleHeroChange}
              className="input-glass cursor-pointer"
              style={{ padding: '8px 12px' }}
            />
            <p className="text-text-dim text-xs mt-2">
              JPG, PNG o WebP · Máx 8MB · Se muestra a pantalla completa con overlay oscuro para que el título sea legible
            </p>
          </div>
        </div>
      </div>

      {/* Tagline + Accent color + Trailer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">
            Tagline (frase bajo el título)
          </label>
          <input
            maxLength={300}
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            className="input-glass"
            placeholder="La aventura que definió una generación..."
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">
            Color de acento
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="w-12 h-9 rounded cursor-pointer border-0"
            />
            <input
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="input-glass flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">
          URL del trailer (YouTube)
        </label>
        <input
          value={trailerUrl}
          onChange={e => setTrailerUrl(e.target.value)}
          className="input-glass"
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      {/* Descripción larga */}
      <div className="mb-5">
        <label className="block text-xs text-text-muted font-semibold mb-1.5 uppercase tracking-wide">
          Descripción larga (Markdown) — Texto promocional
        </label>
        <textarea
          value={longDescription}
          onChange={e => setLongDescription(e.target.value)}
          className="input-glass py-2 font-mono text-sm"
          rows={5}
          placeholder="El viaje de Link a través del tiempo que redefinió las aventuras en 3D..."
        />
      </div>

      {/* Press quotes */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
            Citas de prensa (máx 4)
          </label>
          {quotes.length < 4 && (
            <button
              type="button"
              onClick={() => setQuotes([...quotes, { text: '', source: '' }])}
              className="btn-secondary text-xs px-3 py-1"
            >+ Añadir cita</button>
          )}
        </div>
        <div className="space-y-2">
          {quotes.map((q, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex-1 space-y-2">
                <textarea
                  value={q.text}
                  onChange={e => setQuotes(quotes.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))}
                  placeholder='"La mejor aventura jamás creada"'
                  className="input-glass py-2 text-sm italic"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={q.source}
                    onChange={e => setQuotes(quotes.map((x, idx) => idx === i ? { ...x, source: e.target.value } : x))}
                    placeholder="IGN"
                    className="input-glass text-sm"
                  />
                  <input
                    type="number" min="0" max="10" step="0.5"
                    value={q.rating ?? ''}
                    onChange={e => setQuotes(quotes.map((x, idx) => idx === i ? { ...x, rating: e.target.value ? Number(e.target.value) : undefined } : x))}
                    placeholder="Rating (opcional)"
                    className="input-glass text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuotes(quotes.filter((_, idx) => idx !== i))}
                className="btn-secondary text-xs px-2 py-1"
                style={{ color: '#ff4444' }}
              >✕</button>
            </div>
          ))}
          {quotes.length === 0 && (
            <p className="text-text-dim text-xs italic">Sin citas. Añade reseñas de prensa famosa para darle peso.</p>
          )}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wide">
            Aspectos destacados (máx 4) — Como las cards de Battlefield
          </label>
          {highlights.length < 4 && (
            <button
              type="button"
              onClick={() => setHighlights([...highlights, { title: '', description: '' }])}
              className="btn-secondary text-xs px-3 py-1"
            >+ Añadir</button>
          )}
        </div>
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex-1 space-y-2">
                <input
                  value={h.title}
                  onChange={e => setHighlights(highlights.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                  placeholder="Ej: VIAJE EN EL TIEMPO"
                  className="input-glass text-sm font-semibold"
                />
                <textarea
                  value={h.description}
                  onChange={e => setHighlights(highlights.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                  placeholder="Alterna entre el joven Link y el Link adulto para resolver puzzles en dos épocas..."
                  className="input-glass py-2 text-sm"
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))}
                className="btn-secondary text-xs px-2 py-1"
                style={{ color: '#ff4444' }}
              >✕</button>
            </div>
          ))}
          {highlights.length === 0 && (
            <p className="text-text-dim text-xs italic">Sin destacados aún. Añade 3-4 aspectos clave del juego.</p>
          )}
        </div>
      </div>

      {/* Screenshots */}
      <div className="mb-5">
        <label className="block text-xs text-text-muted font-semibold mb-3 uppercase tracking-wide">
          Galería de Screenshots (hasta 10 adicionales)
        </label>

        {/* Existentes */}
        {existingScreenshots.length > 0 && (
          <div className="mb-3">
            <p className="text-text-dim text-xs mb-2">Actuales ({existingScreenshots.length}):</p>
            <div className="grid grid-cols-4 gap-2">
              {existingScreenshots.map((s, i) => (
                <div key={i} className="relative group aspect-video rounded overflow-hidden">
                  <img src={s.path.startsWith('http') ? s.path : `${API}/uploads/${s.path}`} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingScreenshot(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nuevas (pending upload) */}
        {screenshotPreviews.length > 0 && (
          <div className="mb-3">
            <p className="text-text-dim text-xs mb-2">Pendientes de subir ({screenshotPreviews.length}):</p>
            <div className="grid grid-cols-4 gap-2">
              {screenshotPreviews.map((src, i) => (
                <div key={i} className="relative group aspect-video rounded overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewScreenshot(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleScreenshotsChange}
          className="input-glass cursor-pointer"
          style={{ padding: '8px 12px' }}
        />
      </div>

      {/* Save button */}
      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
          style={{ background: accentColor, borderColor: accentColor }}
        >
          {saving ? 'Guardando...' : '💾 Guardar Featured Page'}
        </button>
        <p className="text-text-dim text-xs self-center">
          * Se guarda por separado del juego. Guarda el juego primero si es nuevo.
        </p>
      </div>
    </section>
  )
}