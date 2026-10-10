import { api } from './client';
import type { GameDetail, GamesPage, Platform, RankedGame } from '../types';

export type GamesQuery = { page?: number; limit?: number; platform?: string; genre?: string; q?: string; sort?: string; order?: 'asc' | 'desc' };
export type Genre = { id: number; name: string; slug: string };
export type VoteResult = { ok: true; score: number | null; community_avg: number | null; vote_count: number };

// Se manda el token (auth: true) para que el servidor sepa quién eres; en la lista pública no es obligatorio.
export function fetchGames(q: GamesQuery = {}) {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
  return api<GamesPage>(`/games?${p.toString()}`);
}
export const fetchGame = (slug: string) => api<GameDetail>(`/games/${encodeURIComponent(slug)}`);
export const fetchPlatforms = () => api<Platform[]>('/platforms');
export const fetchGenres = () => api<Genre[]>('/genres');

// Nota de la comunidad (aparte de la de Emilio)
export const voteGame = (id: number, score: number) => api<VoteResult>(`/games/${id}/vote`, { method: 'POST', body: { score }, auth: true });
export const removeVote = (id: number) => api<VoteResult>(`/games/${id}/vote`, { method: 'DELETE', auth: true });

// Favoritos ("quiero jugarlo")
export const fetchFavorites = () => api<RankedGame[]>('/favorites', { auth: true });
export const addFavorite = (id: number) => api(`/games/${id}/favorite`, { method: 'POST', body: {}, auth: true });
export const removeFavorite = (id: number) => api(`/games/${id}/favorite`, { method: 'DELETE', auth: true });
