import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { addFavorite, fetchFavorites, removeFavorite } from '../api/games';
import { useAuth } from '../auth/AuthContext';

// Lista de juegos favoritos compartida por toda la app: el corazón se ve igual en el ranking,
// el detalle y el perfil, y cambia al instante (se avisa al servidor en segundo plano).
type Ctx = {
  ids: Set<number>;
  isFavorite: (id: number) => boolean;
  /** Devuelve false si no hay sesión (la pantalla debe mandar a iniciar sesión). */
  toggle: (id: number) => Promise<boolean>;
  count: number;
};
const FavCtx = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    fetchFavorites().then(list => setIds(new Set(list.map(g => g.id)))).catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async (id: number) => {
    if (!user) return false;
    const was = idsRef.current.has(id);
    setIds(prev => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });      // al instante
    try { await (was ? removeFavorite(id) : addFavorite(id)); }
    catch { setIds(prev => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; }); }   // si falla, se deshace
    return true;
  }, [user]);

  const value = useMemo(() => ({ ids, isFavorite: (id: number) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>;
}

export function useFavorites(): Ctx {
  const c = useContext(FavCtx);
  if (!c) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return c;
}
