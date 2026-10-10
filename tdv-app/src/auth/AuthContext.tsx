import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, ApiError, setAuthToken, setUnauthorizedHandler } from '../api/client';
import { registerForPush, unregisterPush } from '../push/push';
import type { User } from '../types';

const TOKEN_KEY = 'tdv_token';

type AuthState = {
  user: User | null;
  loading: boolean;                       // true mientras se revisa si ya había una sesión guardada
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }, []);

  // Al abrir la app: si hay un token guardado (cifrado en el teléfono), se valida con /auth/me.
  useEffect(() => {
    setUnauthorizedHandler(() => { clearSession(); });
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          const { user: me } = await api<{ user: User }>('/auth/me', { auth: true });
          setUser(me);
        }
      } catch (err) {
        // Sin internet no se cierra la sesión; solo si el servidor dice que el token ya no sirve.
        if (err instanceof ApiError && err.status === 401) await clearSession();
      } finally { setLoading(false); }
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Cada vez que hay una sesión activa, este celular se registra para recibir push.
  useEffect(() => { if (user) registerForPush(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
    setAuthToken(res.token);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setUser(res.user);
  }, []);

  // El registro deja la cuenta activa y con la sesión iniciada (sin código por correo).
  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api<{ user: User; token: string }>('/auth/register', { method: 'POST', body: { username: username.trim(), email: email.trim(), password } });
    setAuthToken(res.token);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => { await unregisterPush(); await clearSession(); }, [clearSession]);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
