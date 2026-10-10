import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor' | 'member'
  avatar: string | null
  avatar_id: string | null   // ← ID del avatar predefinido (mario, link, etc.)
  is_verified: boolean | number
}

interface RegisterResult {
  ok: boolean
  error?: string
  email?: string
  needsVerification?: boolean
}

interface LoginResult {
  ok: boolean
  error?: string
  needsVerification?: boolean
  email?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  isLoggedIn: boolean
  login:       (email: string, password: string) => Promise<LoginResult>
  register:    (username: string, email: string, password: string) => Promise<RegisterResult>
  logout:      () => void
  refreshUser: () => Promise<void>   // ← NUEVO: recarga el usuario desde /api/auth/me
  authFetch:   (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Carga inicial — verifica la cookie
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── refreshUser: recarga el usuario desde la API ──────────
  // Llamar después de cambiar avatar_id para que el Navbar se actualice
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data?.user) setUser(data.user)
      }
    } catch { /* silencioso */ }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needs_verification) {
          return { ok: false, error: data.error, needsVerification: true, email: data.email }
        }
        return { ok: false, error: data.error || 'Error al iniciar sesión' }
      }
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'No se pudo conectar al servidor' }
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string): Promise<RegisterResult> => {
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error al registrar' }
      return { ok: true, email: data.email, needsVerification: true }
    } catch {
      return { ok: false, error: 'No se pudo conectar al servidor' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
  }, [])

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {})
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    return fetch(url, { ...options, credentials: 'include', headers })
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading, isLoggedIn: !!user,
      login, register, logout, refreshUser, authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}