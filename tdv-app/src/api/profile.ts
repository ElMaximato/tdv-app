import { api } from './client';

export type Top5Item = { position: number; game_id: number; title: string; slug: string; cover_image: string | null; release_year: number | null; platform: string };
export type Profile = {
  id: number; username: string; email: string; role: 'admin' | 'editor' | 'member';
  avatar_id: string | null; bio: string | null; created_at: string;
  fav_console: string | null; fav_game_id: number | null; fav_game_title: string | null;
  stats: { vote_count: number };
  top5: Top5Item[];
  fav_console_data: { name: string; slug: string; accent_color?: string } | null;
  fav_game_data: { id: number; title: string; slug: string; cover_image: string | null } | null;
};

export const fetchProfile = () => api<Profile>('/user/profile', { auth: true });
export const updateAvatar = (avatar_id: string) => api('/user/avatar', { method: 'PATCH', body: { avatar_id }, auth: true });
export const updateBio = (bio: string) => api('/user/bio', { method: 'PATCH', body: { bio }, auth: true });
export const updateFavConsole = (slug: string) => api('/user/fav-console', { method: 'PATCH', body: { slug }, auth: true });
export const updateFavGame = (game_id: number) => api('/user/fav-game', { method: 'PATCH', body: { game_id }, auth: true });
export const fetchTop5 = () => api<Top5Item[]>('/user/top5', { auth: true });
export const saveTop5 = (game_ids: number[]) => api('/user/top5', { method: 'PUT', body: { game_ids }, auth: true });

// Avatares: el servidor guarda el nombre; la app lo dibuja como emoji (no hace falta subir imágenes).
export const AVATARS: { id: string; emoji: string; label: string }[] = [
  { id: 'mario', emoji: '🍄', label: 'Mario' }, { id: 'luigi', emoji: '🧢', label: 'Luigi' },
  { id: 'peach', emoji: '👑', label: 'Peach' }, { id: 'toad', emoji: '🌰', label: 'Toad' },
  { id: 'yoshi', emoji: '🦖', label: 'Yoshi' }, { id: 'bowser', emoji: '🐢', label: 'Bowser' },
  { id: 'link', emoji: '🗡️', label: 'Link' }, { id: 'samus', emoji: '🚀', label: 'Samus' },
  { id: 'pikachu', emoji: '⚡', label: 'Pikachu' }, { id: 'kirby', emoji: '🌸', label: 'Kirby' },
  { id: 'fox', emoji: '🦊', label: 'Fox' }, { id: 'donkey-kong', emoji: '🦍', label: 'Donkey Kong' },
];
export const avatarEmoji = (id: string | null | undefined) => AVATARS.find(a => a.id === id)?.emoji ?? '🎮';
