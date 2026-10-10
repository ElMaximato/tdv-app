import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { PixelRunners } from './PixelCharacters'
import { getAvatar } from '../config/avatars-config'

const FALLBACK_EMOJIS: Record<string, string> = {
  mario: '🍄', link: '🗡️', yoshi: '🦕', 'donkey-kong': '🦍',
  samus: '🚀', pikachu: '⚡', fox: '🦊', kirby: '🌸',
  luigi: '👻', toad: '🍄', bowser: '🐢', peach: '👑',
}

const FEATURED_CONSOLES = [
  { name: 'SNES',     slug: 'snes', color: '#a855f7' },
  { name: 'N64',      slug: 'n64',  color: '#16a34a' },
  { name: 'PS1',      slug: 'ps1',  color: '#3b82f6' },
  { name: 'PS2',      slug: 'ps2',  color: '#1e40af' },
  { name: 'GameCube', slug: 'ngc',  color: '#7c3aed' },
  { name: 'Wii',      slug: 'wii',  color: '#8b8b8b' },
  { name: 'GBA',      slug: 'gba',  color: '#6366f1' },
]

const GENRES = [
  { name: 'RPG / JRPG',    slug: 'jrpg'          },
  { name: 'Plataformas',   slug: 'plataformas'    },
  { name: 'Aventura',      slug: 'aventura'       },
  { name: 'Acción',        slug: 'accion'         },
  { name: 'Survival Horror', slug: 'survival-horror' },
  { name: 'Lucha',         slug: 'lucha'          },
  { name: 'Puzzle',        slug: 'puzzle'         },
]

type DropdownKey = 'consolas' | 'generos' | 'user' | null

// ─── Avatar con fallback ──────────────────────────────────────
function NavAvatar({ avatarId, bg }: { avatarId: string | null | undefined; bg: string }) {
  const av  = getAvatar(avatarId)
  const [err, setErr] = useState(false)

  if (!err) {
    return (
      <img
        src={av.src}
        alt={av.label}
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loading="lazy"
      />
    )
  }

  // Fallback: emoji centrado
  return (
    <span style={{ fontSize: 18, lineHeight: 1 }}>
      {FALLBACK_EMOJIS[av.id] ?? '🎮'}
    </span>
  )
}

// ─── Navbar principal ─────────────────────────────────────────
export function Navbar() {
  const { user, isLoggedIn, logout } = useAuth()
  const [open,    setOpen]    = useState<DropdownKey>(null)
  const [searchQ, setSearchQ] = useState('')
  const navigate  = useNavigate()
  const location  = useLocation()
  const navRef    = useRef<HTMLElement>(null)

  const av = getAvatar(user?.avatar_id)

  // Ocultar en rutas admin
  if (location.pathname.startsWith('/admin')) return null

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerrar dropdown al cambiar de ruta
  useEffect(() => { setOpen(null) }, [location.pathname])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/rankings?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchQ('')
      setOpen(null)
    }
  }

  function handleLogout() {
    logout()
    setOpen(null)
    navigate('/')
  }

  return (
    <header ref={navRef} className="sticky top-0 z-50">
      <div
        className="border-b relative"
        style={{
          background: 'rgba(15,15,26,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Personajes pixel-art corriendo detrás */}
        <PixelRunners />

        {/* Contenido del navbar */}
        <div
          className="max-w-[1200px] mx-auto px-4 flex items-center h-14 gap-2"
          style={{ position: 'relative', zIndex: 10 }}
        >

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-6 group">
            <div className="retro-bar px-2.5 py-1.5 rounded-lg group-hover:animate-glow transition-all">
              <span style={{ fontSize: 9 }}>TDV</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-pixel text-white leading-none" style={{ fontSize: 7 }}>TIEMPO DE</div>
              <div className="font-pixel text-accent-gold leading-none mt-0.5" style={{ fontSize: 7 }}>VIDEOJUEGOS</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1">

            {/* Consolas con dropdown */}
            <div className="relative">
              <div className="flex items-center">
                <Link
                  to="/consolas"
                  className="btn-ghost text-sm font-semibold"
                  onMouseEnter={() => setOpen('consolas')}
                >
                  Consolas
                </Link>
                <button
                  onClick={() => setOpen(open === 'consolas' ? null : 'consolas')}
                  className="btn-ghost text-sm px-2"
                  style={{ marginLeft: -8 }}
                >
                  ▾
                </button>
              </div>
              {open === 'consolas' && (
                <Dropdown>
                  <Link
                    to="/consolas"
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-accent-red/10 hover:bg-accent-red/20 transition-colors font-semibold"
                  >
                    🕹 Ver todas las consolas
                  </Link>
                  <div className="my-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  {FEATURED_CONSOLES.map(c => (
                    <Link
                      key={c.slug}
                      to={`/console/${c.slug}`}
                      onClick={() => setOpen(null)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      {c.name}
                    </Link>
                  ))}
                </Dropdown>
              )}
            </div>

            {/* Géneros con dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setOpen(open === 'generos' ? null : 'generos')}
                className={`btn-ghost text-sm font-semibold ${open === 'generos' ? 'text-white bg-white/5' : ''}`}
              >
                Géneros ▾
              </button>
              {open === 'generos' && (
                <Dropdown>
                  {GENRES.map(g => (
                    <DropLink key={g.slug} to={`/rankings?genre=${g.slug}`} onClick={() => setOpen(null)}>
                      {g.name}
                    </DropLink>
                  ))}
                </Dropdown>
              )}
            </div>

            <Link to="/quiz"  className="btn-ghost text-sm font-semibold hidden lg:flex">Quiz</Link>
            <Link to="/sagas" className="btn-ghost text-sm font-semibold hidden lg:flex">Sagas</Link>

            {/* 95+ en dorado */}
            <Link
              to="/95"
              className="btn-ghost text-sm font-semibold hidden lg:flex items-center gap-1.5"
              style={{ color: '#fbbf24' }}
            >
              <span style={{ fontSize: 10 }}>★</span>
              95+
            </Link>
            <Link to="/tierlist" className="btn-ghost text-sm font-semibold hidden lg:flex">
            Tierlist
          </Link>
          </nav>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-0 mr-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="input-glass h-8 w-36 lg:w-44 text-xs rounded-r-none"
            />
            <button
              type="submit"
              className="h-8 px-3 rounded-r-xl text-xs font-bold text-white"
              style={{ background: 'var(--accent-red)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none' }}
            >
              IR
            </button>
          </form>

          {/* Usuario */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setOpen(open === 'user' ? null : 'user')}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:bg-white/5"
              >
                {/* Avatar con fallback */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 flex items-center justify-center"
                  style={{ background: av.bg }}
                >
                  <NavAvatar avatarId={user?.avatar_id} bg={av.bg} />
                </div>
                <span className="font-medium text-sm text-white hidden md:block">
                  {user?.username}
                </span>
              </button>

              {open === 'user' && (
                <Dropdown right>
                  {/* Info usuario */}
                  <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 flex items-center justify-center"
                        style={{ background: av.bg }}
                      >
                        <NavAvatar avatarId={user?.avatar_id} bg={av.bg} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-none">{user?.username}</p>
                        <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                    {user?.is_verified
                      ? <span className="badge-green text-[10px] inline-flex">✓ Verificado</span>
                      : <span className="badge-red text-[10px] inline-flex">✗ No verificado</span>
                    }
                  </div>

                  <DropLink to="/profile" onClick={() => setOpen(null)}>👤 Mi Perfil</DropLink>
                  <DropLink to="/quiz"    onClick={() => setOpen(null)}>🧩 Quiz Gamer</DropLink>
                  <div className="my-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    🚪 Cerrar sesión
                  </button>
                </Dropdown>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/login"    className="btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-xs px-4 py-2">Registro</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────
function Dropdown({ children, wide, right }: { children: React.ReactNode; wide?: boolean; right?: boolean }) {
  return (
    <div
      className={`absolute top-full mt-1 z-50 ${right ? 'right-0' : 'left-0'} ${wide ? 'w-[340px]' : 'min-w-[200px]'}`}
      style={{
        background: 'rgba(20,20,35,0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 6,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}
    >
      {children}
    </div>
  )
}

function DropLink({ to, onClick, children }: { to: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 rounded-lg text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  )
}