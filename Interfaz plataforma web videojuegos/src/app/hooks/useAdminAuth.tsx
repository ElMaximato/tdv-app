import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor'
}

interface AdminAuthState {
  admin: AdminUser | null
  loading: boolean
  isAdmin: boolean
  login:      (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout:     () => void
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const AdminAuthContext = createContext<AdminAuthState | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Verifica si hay una sesión admin activa via cookie HttpOnly.
  useEffect(() => {
    fetch(`${API}/api/admin/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setAdmin(data.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Error al iniciar sesión' }
      setAdmin(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'No se pudo conectar al servidor' }
    }
  }, [])

  const logout = useCallback(() => {
    setAdmin(null)
    fetch(`${API}/api/admin/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
  }, [])

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {})
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    const res = await fetch(url, { ...options, credentials: 'include', headers })
    if (res.status === 401) setAdmin(null)
    return res
  }, [])

  const isAdmin = !!admin

  return (
    <AdminAuthContext.Provider value={{ admin, loading, isAdmin, login, logout, adminFetch }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider')
  return ctx
}
