import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import {
  AVATARS, PROFILE_THEMES, THEME_CATEGORIES,
  getAvatar, getTheme,
  type AvatarConfig, type ProfileTheme,
} from '../config/avatars-config'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ─── Tipos ────────────────────────────────────────────────────
interface Top5Item {
  position: number; game_id: number; title: string; slug: string
  cover_image: string | null; release_year: number | null; platform: string
}
interface Profile {
  id: number; username: string; email: string; role: string
  avatar_id: string | null; banner_id: string | null; is_verified: boolean
  fav_console: string | null; fav_game_id: number | null; fav_game_title: string | null
  fav_console_data: { name: string; slug: string } | null
  fav_game_data: { id: number; title: string; cover_image: string | null } | null
  stats: { vote_count: number; quiz_attempts: number; quiz_passed: number }
  quiz_history: { score: number; total: number; passed: boolean; attempted_at: string }[]
  top5: Top5Item[]
}
interface GameResult {
  id: number; title: string; slug: string
  cover_image: string | null; release_year: number | null; platform: string
}

// ─── Helpers ──────────────────────────────────────────────────
const resolveImg = (p: string | null) =>
  !p ? null : p.startsWith('http') ? p : `${API}/uploads/${p}`

// Fallback visual cuando el PNG del avatar no carga aún
const AVATAR_FALLBACK_EMOJIS: Record<string, string> = {
  mario: '🍄', link: '🗡️', yoshi: '🦕', 'donkey-kong': '🦍',
  samus: '🚀', pikachu: '⚡', fox: '🦊', kirby: '🌸',
  luigi: '👻', toad: '🍄', bowser: '🐢', peach: '👑',
}

function AvatarImg({
  av, size = 64, className = '',
}: { av: AvatarConfig; size?: number; className?: string }) {
  const [err, setErr] = useState(false)
  return err ? (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.52, background: av.bg,
    }} className={className}>
      {AVATAR_FALLBACK_EMOJIS[av.id] ?? '🎮'}
    </div>
  ) : (
    <img
      src={av.src}
      alt={av.label}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: 'cover' }}
      className={className}
    />
  )
}

// ─── Toast ────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([])
  const add = useCallback((msg: string, ok = true) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])
  return { toasts, add }
}

// ══════════════════════════════════════════════════════════════
//  PROFILEPAGE
// ══════════════════════════════════════════════════════════════
export function ProfilePage() {
  const { isLoggedIn, authFetch, logout, refreshUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toasts, add: toast } = useToast()

  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [localAvId,   setLocalAvId]   = useState<string | null>(null)
  const [localTheme,  setLocalTheme]  = useState<string | null>(null)
  const [localTop,    setLocalTop]    = useState<Top5Item[]>([])

  const [modal,        setModal]       = useState<'avatar'|'theme'|'console'|'favgame'|null>(null)
  const [top5Editing,  setTop5Editing] = useState(false)
  const [gameSearch,   setGameSearch]  = useState('')
  const [gameResults,  setGameResults] = useState<GameResult[]>([])
  const [searching,    setSearching]   = useState(false)
  const [cSearch,      setCSearch]     = useState('')
  const [platforms,    setPlatforms]   = useState<{ id: number; name: string; slug: string }[]>([])
  const [dragging,     setDragging]    = useState<number | null>(null)
  const [dragOver,     setDragOver]    = useState<number | null>(null)
  const sRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { navigate('/login'); return }
    authFetch(`${API}/api/user/profile`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: Profile) => {
        setProfile(d)
        setLocalAvId(d.avatar_id)
        setLocalTheme(d.banner_id)   // reutilizamos banner_id para el tema
        setLocalTop(d.top5 ?? [])
      })
      .catch(() => toast('Error al cargar perfil', false))
      .finally(() => setLoading(false))
    fetch(`${API}/api/platforms`).then(r => r.json()).then(setPlatforms).catch(() => {})
  }, [isLoggedIn, authLoading])

  // ── Búsqueda juegos debounce ──────────────────────────────
  useEffect(() => {
    if (!gameSearch.trim() || gameSearch.length < 2) { setGameResults([]); return }
    if (sRef.current) clearTimeout(sRef.current)
    sRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const d = await (await fetch(
          `${API}/api/games?q=${encodeURIComponent(gameSearch)}&limit=8`
        )).json()
        setGameResults(d.data ?? [])
      } catch { setGameResults([]) }
      finally { setSearching(false) }
    }, 350)
  }, [gameSearch])

  // ── Guardar avatar ────────────────────────────────────────
  async function saveAvatar(id: string) {
    setLocalAvId(id); setModal(null)
    try {
      await authFetch(`${API}/api/user/avatar`, {
        method: 'PATCH', body: JSON.stringify({ avatar_id: id }),
      })
      setProfile(p => p ? { ...p, avatar_id: id } : p)
      // ← Clave: refrescar el user en useAuth para sincronizar el Navbar
      await refreshUser()
      toast(`Avatar: ${getAvatar(id).label} ✓`)
    } catch { toast('Error al guardar avatar', false) }
  }

  // ── Guardar tema ──────────────────────────────────────────
  async function saveTheme(id: string) {
    setLocalTheme(id); setModal(null)
    try {
      await authFetch(`${API}/api/user/banner`, {
        method: 'PATCH', body: JSON.stringify({ banner_id: id }),
      })
      setProfile(p => p ? { ...p, banner_id: id } : p)
      toast('Tema actualizado ✓')
    } catch { toast('Error al guardar tema', false) }
  }

  // ── Guardar consola ───────────────────────────────────────
  async function saveConsole(slug: string, name: string) {
    setModal(null)
    try {
      await authFetch(`${API}/api/user/fav-console`, {
        method: 'PATCH', body: JSON.stringify({ slug }),
      })
      setProfile(p => p ? { ...p, fav_console: slug, fav_console_data: { name, slug } } : p)
      toast(`${name} ✓`)
    } catch { toast('Error al guardar consola', false) }
  }

  // ── Guardar juego favorito ────────────────────────────────
  async function saveFavGame(g: GameResult) {
    setModal(null); setGameSearch('')
    try {
      await authFetch(`${API}/api/user/fav-game`, {
        method: 'PATCH', body: JSON.stringify({ game_id: g.id }),
      })
      setProfile(p => p ? { ...p, fav_game_id: g.id, fav_game_title: g.title, fav_game_data: g } : p)
      toast(`${g.title} ✓`)
    } catch { toast('Error al guardar juego favorito', false) }
  }

  // ── Top 5 ─────────────────────────────────────────────────
  function removeTop5(id: number) {
    setLocalTop(localTop.filter(g => g.game_id !== id).map((g, i) => ({ ...g, position: i + 1 })))
  }
  function addToTop5(g: GameResult) {
    if (localTop.length >= 5) { toast('Ya tienes 5 juegos', false); return }
    if (localTop.some(t => t.game_id === g.id)) { toast('Ya está en tu Top 5', false); return }
    setLocalTop([...localTop, {
      position: localTop.length + 1, game_id: g.id, title: g.title,
      slug: g.slug, cover_image: g.cover_image, release_year: g.release_year, platform: g.platform,
    }])
    setGameSearch(''); setGameResults([])
  }
  async function saveTop5() {
    try {
      await authFetch(`${API}/api/user/top5`, {
        method: 'PUT', body: JSON.stringify({ game_ids: localTop.map(g => g.game_id) }),
      })
      setProfile(p => p ? { ...p, top5: localTop } : p)
      setTop5Editing(false); toast('Top 5 guardado ✓')
    } catch { toast('Error al guardar Top 5', false) }
  }
  function onDragStart(pos: number) { setDragging(pos) }
  function onDragOver(e: React.DragEvent, pos: number) { e.preventDefault(); setDragOver(pos) }
  function onDrop(pos: number) {
    if (dragging === null || dragging === pos) { setDragging(null); setDragOver(null); return }
    const n = [...localTop]
    const fi = n.findIndex(g => g.position === dragging)
    const ti = n.findIndex(g => g.position === pos)
    if (fi === -1 || ti === -1) { setDragging(null); setDragOver(null); return }
    const [m] = n.splice(fi, 1); n.splice(ti, 0, m)
    setLocalTop(n.map((g, i) => ({ ...g, position: i + 1 })))
    setDragging(null); setDragOver(null)
  }

  // ── Guards ────────────────────────────────────────────────
  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
      <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 9, color: '#e60012' }}>CARGANDO...</span>
    </div>
  )
  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#050508' }}>
      <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 9, color: '#e60012' }}>ERROR AL CARGAR PERFIL</span>
      <Link to="/" className="btn-secondary">← Inicio</Link>
    </div>
  )

  const av    = getAvatar(localAvId)
  const theme = getTheme(localTheme)
  const fp    = platforms.filter(p => p.name.toLowerCase().includes(cSearch.toLowerCase()))

  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#050508', minHeight: '100vh', color: '#e8e8f0' }}>

      {/* ── Toasts ── */}
      <div style={{ position: 'fixed', top: 80, right: 16, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: t.ok ? 'rgba(34,197,94,0.95)' : 'rgba(230,0,18,0.95)',
            color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'slideR 0.2s ease-out',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          HERO BANNER — fondo del tema seleccionado
          ══════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 400, overflow: 'hidden' }}>

        {/* Fondo del tema */}
        <div style={{ position: 'absolute', inset: 0, background: theme.heroBg, transition: 'background 0.6s ease' }} />

        {/* Patrón decorativo del tema */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: theme.pattern,
          backgroundSize: '24px 24px',
          transition: 'all 0.6s ease',
        }} />

        {/* Líneas de escaneo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.06) 0px,rgba(0,0,0,0.06) 1px,transparent 1px,transparent 4px)',
          pointerEvents: 'none',
        }} />

        {/* Glow de acento del tema detrás del avatar */}
        <div style={{
          position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle,${theme.accent}25 0%,transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
          transition: 'background 0.6s ease',
        }} />

        {/* Avatar hero — imagen PNG grande flotando */}
        <div
          onClick={() => setModal('avatar')}
          title="Cambiar avatar"
          style={{
            position: 'absolute', right: '5%', bottom: 0,
            width: 260, height: 260,
            cursor: 'pointer',
            filter: `drop-shadow(0 0 40px ${av.color}60)`,
            animation: 'heroFloat 4s ease-in-out infinite',
          }}
        >
          <AvatarImg av={av} size={260} />
        </div>

        {/* Info izquierda */}
        <div style={{ position: 'absolute', left: 32, bottom: 36, maxWidth: 480 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: '"Press Start 2P",monospace', fontSize: 7,
            color: theme.accent, letterSpacing: 3,
            padding: '3px 10px',
            background: `${theme.accent}15`,
            border: `1px solid ${theme.accent}40`,
            borderRadius: 4, marginBottom: 10,
            transition: 'all 0.4s',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} />
            {profile.role.toUpperCase()} · {profile.is_verified ? '✓ VERIFICADO' : '○ SIN VERIFICAR'}
          </div>

          <h1 style={{
            fontFamily: '"VT323",monospace',
            fontSize: 'clamp(44px,7vw,80px)',
            color: '#fff', lineHeight: 1,
            textShadow: `0 0 50px ${av.color}80`,
            margin: '0 0 6px',
          }}>
            {profile.username.toUpperCase()}
          </h1>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 18px' }}>
            {av.desc}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => { logout(); navigate('/') }} style={{
              fontFamily: '"Press Start 2P",monospace', fontSize: 7,
              color: 'rgba(255,255,255,0.45)', background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              padding: '5px 11px', cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}>🚪 SALIR</button>
          </div>
        </div>

        {/* Degradado inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
          background: 'linear-gradient(to bottom,transparent,#050508)',
        }} />

        {/* Botones esquina superior izquierda — delgados y semi-transparentes */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', gap: 6, zIndex: 20,
        }}>
          <button onClick={() => setModal('avatar')} style={{
            fontFamily: '"Press Start 2P",monospace', fontSize: 6,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 6, padding: '5px 11px',
            cursor: 'pointer', backdropFilter: 'blur(12px)',
            transition: 'all 0.2s', letterSpacing: 1,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
          >👤 AVATAR</button>

          <button onClick={() => setModal('theme')} style={{
            fontFamily: '"Press Start 2P",monospace', fontSize: 6,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${theme.accent}40`,
            borderRadius: 6, padding: '5px 11px',
            cursor: 'pointer', backdropFilter: 'blur(12px)',
            transition: 'all 0.2s', letterSpacing: 1,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${theme.accent}20`; (e.currentTarget as HTMLElement).style.borderColor = `${theme.accent}70` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = `${theme.accent}40` }}
          >🎨 TEMA</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CUERPO — 2 columnas: Top5 | Sidebar
          ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Espacio visual entre hero y contenido */}
        <div style={{ height: 48 }} />

        {/* Grid 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── COLUMNA IZQUIERDA: TOP 5 ── */}
          <div>
        {/* ══════════════════════════════════════════════════════
            TOP 5
            ══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: '"VT323",monospace', fontSize: 34, color: '#fff', margin: 0 }}>
              MI <span style={{ color: theme.accent }}>TOP 5</span> PERSONAL
            </h2>
            {top5Editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveTop5} style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, background: '#e60012', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>💾 GUARDAR</button>
                <button onClick={() => { setLocalTop(profile.top5); setTop5Editing(false) }} style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>CANCELAR</button>
              </div>
            ) : (
              <button onClick={() => setTop5Editing(true)} style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>✏ EDITAR</button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {localTop.map(game => (
              <div key={game.game_id}
                draggable={top5Editing}
                onDragStart={() => onDragStart(game.position)}
                onDragOver={e => onDragOver(e, game.position)}
                onDrop={() => onDrop(game.position)}
                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', borderRadius: 14,
                  background: dragOver === game.position ? `${theme.accent}12` : 'rgba(18,18,30,0.9)',
                  border: `1px solid ${dragging === game.position ? theme.accent : 'rgba(255,255,255,0.06)'}`,
                  cursor: top5Editing ? 'grab' : 'default',
                  opacity: dragging === game.position ? 0.5 : 1,
                  backdropFilter: 'blur(20px)', transition: 'all 0.12s',
                }}
              >
                <span style={{ fontFamily: '"VT323",monospace', fontSize: 36, color: game.position <= 3 ? '#fbbf24' : '#1f2937', minWidth: 30, textAlign: 'center' }}>
                  {game.position}
                </span>
                <div style={{ width: 44, height: 54, borderRadius: 8, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                  {game.cover_image
                    ? <img src={resolveImg(game.cover_image)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 18 }}>?</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/game/${game.slug}`}
                    style={{ fontFamily: '"VT323",monospace', fontSize: 22, color: '#e8e8f0', display: 'block', lineHeight: 1.1, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.accent }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#e8e8f0' }}
                  >
                    {game.title.toUpperCase()}
                  </Link>
                  <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#374151' }}>
                    {game.platform}{game.release_year ? ` · ${game.release_year}` : ''}
                  </span>
                </div>
                {top5Editing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 16, color: '#374151', cursor: 'grab', userSelect: 'none' }}>⠿</span>
                    <button onClick={() => removeTop5(game.game_id)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(230,0,18,0.15)', color: '#e60012', cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                )}
              </div>
            ))}

            {/* Slots vacíos */}
            {Array.from({ length: 5 - localTop.length }).map((_, i) => (
              <div key={`e${i}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.07)', background: 'transparent' }}>
                <span style={{ fontFamily: '"VT323",monospace', fontSize: 36, color: '#1f2937', minWidth: 30, textAlign: 'center' }}>{localTop.length + i + 1}</span>
                <div style={{ width: 44, height: 54, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }} />
                <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, color: '#1f2937' }}>— SLOT VACÍO</span>
              </div>
            ))}
          </div>

          {/* Buscador para agregar al top 5 */}
          {top5Editing && localTop.length < 5 && (
            <div style={{ marginTop: 10, background: 'rgba(18,18,30,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, backdropFilter: 'blur(20px)' }}>
              <CardTag>AGREGAR AL TOP 5</CardTag>
              <div style={{ position: 'relative', marginTop: 10 }}>
                <input value={gameSearch} onChange={e => setGameSearch(e.target.value)} placeholder="Buscar juego..."
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {searching && <SpinIcon />}
              </div>
              {gameResults.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {gameResults.map(g => (
                    <button key={g.id} onClick={() => addToTop5(g)} disabled={localTop.some(t => t.game_id === g.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', opacity: localTop.some(t => t.game_id === g.id) ? 0.4 : 1, transition: 'background 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ width: 28, height: 36, borderRadius: 5, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
                        {g.cover_image && <img src={resolveImg(g.cover_image)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <div style={{ color: '#e8e8f0', fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                        <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#4b5563' }}>{g.platform}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: '#e60012', fontSize: 16 }}>+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          </div>{/* fin col izquierda */}

          {/* ── COLUMNA DERECHA: SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Consola favorita */}
            <ProfileCard onClick={() => setModal('console')}>
              <CardTag>CONSOLA FAVORITA</CardTag>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>🕹️</div>
                <div>
                  <div style={{ fontFamily: '"VT323",monospace', fontSize: 24, color: '#fff', lineHeight: 1.1 }}>
                    {profile.fav_console_data?.name ?? profile.fav_console ?? 'Sin definir'}
                  </div>
                  <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#e60012', marginTop: 5 }}>
                    {profile.fav_console ? '✏ CAMBIAR' : '+ AGREGAR'}
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Juego favorito */}
            <ProfileCard onClick={() => setModal('favgame')}>
              <CardTag>JUEGO FAVORITO</CardTag>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                {profile.fav_game_data?.cover_image ? (
                  <img src={resolveImg(profile.fav_game_data.cover_image)!} alt="" style={{ width: 52, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }} />
                ) : (
                  <div style={{ fontSize: 36, flexShrink: 0 }}>🎮</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: '"VT323",monospace', fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
                    {profile.fav_game_data?.title ?? profile.fav_game_title ?? 'Sin definir'}
                  </div>
                  <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#e60012', marginTop: 5 }}>
                    {profile.fav_game_id ? '✏ CAMBIAR' : '+ AGREGAR'}
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Tema activo */}
            <ProfileCard onClick={() => setModal('theme')} accent={theme.accent}>
              <CardTag>TEMA DE PERFIL</CardTag>
              <div style={{ height: 52, borderRadius: 10, marginTop: 12, marginBottom: 10, background: theme.heroBg, border: `1px solid ${theme.accent}30`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: theme.pattern, backgroundSize: '14px 14px' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: '"VT323",monospace', fontSize: 20, color: '#fff' }}>{theme.label}</div>
                <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: theme.accent }}>✏ CAMBIAR</div>
              </div>
            </ProfileCard>

            {/* Historial Quiz compacto */}
            {profile.quiz_history.length > 0 && (
              <ProfileCard>
                <CardTag>HISTORIAL QUIZ</CardTag>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
                  {profile.quiz_history.slice(0, 4).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: a.passed ? '#22c55e' : '#e60012', minWidth: 44 }}>{a.passed ? '✓' : '✗'}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{a.score}/{a.total}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#374151' }}>{new Date(a.attempted_at).toLocaleDateString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              </ProfileCard>
            )}
          </div>{/* fin col derecha */}

        </div>{/* fin grid 2col */}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — SELECCIÓN DE AVATAR
          ══════════════════════════════════════════════════════ */}
      {modal === 'avatar' && (
        <GModal title="SELECCIONA TU PERSONAJE" onClose={() => setModal(null)} wide>
          <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#4b5563', marginBottom: 16 }}>
            COLOCA LAS IMÁGENES EN: backend/uploads/avatars/&lt;id&gt;.png
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {AVATARS.map(a => (
              <button key={a.id} onClick={() => saveAvatar(a.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: 12, borderRadius: 14,
                background: localAvId === a.id ? `${a.color}18` : 'rgba(255,255,255,0.03)',
                border: `2px solid ${localAvId === a.id ? a.color : 'rgba(255,255,255,0.07)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: localAvId === a.id ? `0 0 20px ${a.color}30` : 'none',
              }}>
                {/* Marco del avatar con imagen */}
                <div style={{ width: 80, height: 80, borderRadius: 14, overflow: 'hidden', border: `2px solid ${localAvId === a.id ? a.color : 'rgba(255,255,255,0.1)'}`, background: a.bg, position: 'relative' }}>
                  <AvatarImg av={a} size={80} />
                  {localAvId === a.id && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>✓</div>
                  )}
                </div>
                <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: localAvId === a.id ? a.color : '#6b7280', lineHeight: 1.4, textAlign: 'center' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </GModal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — SELECCIÓN DE TEMA
          ══════════════════════════════════════════════════════ */}
      {modal === 'theme' && (
        <GModal title="TEMA DE PERFIL" onClose={() => setModal(null)} wide>
          <p style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#4b5563', marginBottom: 16 }}>
            EL TEMA CAMBIA EL FONDO Y LOS COLORES DE TU PERFIL
          </p>
          <div style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {THEME_CATEGORIES.map(cat => (
              <div key={cat}>
                <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 7, color: '#555570', letterSpacing: 2, marginBottom: 10 }}>
                  {cat.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {PROFILE_THEMES.filter(t => t.category === cat).map(t => (
                    <button key={t.id} onClick={() => saveTheme(t.id)} style={{
                      position: 'relative', height: 80, borderRadius: 12, overflow: 'hidden',
                      background: t.heroBg,
                      border: `2px solid ${localTheme === t.id ? t.accent : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: localTheme === t.id ? `0 0 20px ${t.accent}40` : 'none',
                    }}>
                      {/* Patrón del tema */}
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: t.pattern, backgroundSize: '14px 14px' }} />

                      {/* Indicador de acento */}
                      <div style={{ position: 'absolute', bottom: 6, left: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />
                        <span style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#fff' }}>{t.label}</span>
                      </div>

                      {/* Check si está seleccionado */}
                      {localTheme === t.id && (
                        <div style={{ position: 'absolute', top: 5, right: 7, width: 18, height: 18, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GModal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — CONSOLA FAVORITA
          ══════════════════════════════════════════════════════ */}
      {modal === 'console' && (
        <GModal title="CONSOLA FAVORITA" onClose={() => setModal(null)}>
          <input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="Buscar consola..." autoFocus
            style={{ width: '100%', padding: '9px 13px', borderRadius: 9, marginBottom: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
            {fp.map(p => (
              <button key={p.slug} onClick={() => saveConsole(p.slug, p.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `1px solid ${profile.fav_console === p.slug ? '#e60012' : 'rgba(255,255,255,0.07)'}`, background: profile.fav_console === p.slug ? 'rgba(230,0,18,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 16 }}>🕹️</span>
                <span style={{ color: '#e8e8f0', fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                {profile.fav_console === p.slug && <span style={{ marginLeft: 'auto', color: '#e60012', fontSize: 11 }}>✓</span>}
              </button>
            ))}
          </div>
        </GModal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — JUEGO FAVORITO
          ══════════════════════════════════════════════════════ */}
      {modal === 'favgame' && (
        <GModal title="JUEGO FAVORITO" onClose={() => { setModal(null); setGameSearch(''); setGameResults([]) }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input value={gameSearch} onChange={e => setGameSearch(e.target.value)} placeholder="Buscar juego en la BD..." autoFocus
              style={{ width: '100%', padding: '9px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {searching && <SpinIcon />}
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {gameResults.map(g => (
              <button key={g.id} onClick={() => saveFavGame(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e60012' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <div style={{ width: 34, height: 42, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
                  {g.cover_image && <img src={resolveImg(g.cover_image)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ color: '#e8e8f0', fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                  <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#4b5563' }}>{g.platform}</div>
                </div>
              </button>
            ))}
            {gameSearch.length >= 2 && !searching && !gameResults.length && (
              <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: '"Press Start 2P",monospace', fontSize: 7, color: '#374151' }}>SIN RESULTADOS</div>
            )}
          </div>
        </GModal>
      )}

      <style>{`
        @keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes slideR    { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin      { to{transform:translateY(-50%) rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ─── Micro-componentes ────────────────────────────────────────
function ProfileCard({ children, onClick, accent }: { children: React.ReactNode; onClick?: () => void; accent?: string }) {
  return (
    <div onClick={onClick} style={{
      background: 'rgba(18,18,30,0.9)',
      border: `1px solid ${accent ? `${accent}25` : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, padding: '18px 14px',
      cursor: onClick ? 'pointer' : 'default',
      backdropFilter: 'blur(20px)', transition: 'all 0.15s',
      boxShadow: accent ? `0 0 24px ${accent}10` : 'none',
    }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = accent ? `${accent}50` : 'rgba(255,255,255,0.14)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = accent ? `${accent}25` : 'rgba(255,255,255,0.06)' }}
    >{children}</div>
  )
}
function CardTag({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#374151', letterSpacing: 2 }}>{children}</div>
}
function SpinIcon() {
  return <div style={{ position: 'absolute', right: 12, top: '50%', width: 13, height: 13, border: '2px solid #e60012', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', transform: 'translateY(-50%)' }} />
}
function GModal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: wide ? 660 : 520, maxHeight: '88vh', overflowY: 'auto', background: 'rgba(12,12,20,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: '"VT323",monospace', fontSize: 28, color: '#fff', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}