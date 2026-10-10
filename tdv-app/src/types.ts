export type User = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'member';
  avatar: string | null;
  avatar_id: string | null;
  is_verified: number | boolean;
};

// MySQL devuelve los DECIMAL como texto ("85.0"), por eso los números pueden venir como string.
export type Num = number | string | null;

export type RankedGame = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  cover_image: string | null;
  developer: string | null;
  platform: string;
  platform_slug: string;
  emilio_score: Num;
  summary: string | null;
  is_gem: number;
  is_essential: number;
  emilio_rank: number | null;
  community_avg: Num;
  vote_count: number;
  composite_score: Num;
  is_favorite?: boolean;
};

export type GamesPage = {
  data: RankedGame[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type Platform = { id: number; name: string; slug: string; accent_color: string };

export type GameDetail = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  developer: string | null;
  publisher: string | null;
  cover_image: string | null;
  description: string | null;
  platform_name: string;
  platform_slug: string;
  score_gameplay: Num;
  score_story: Num;
  score_graphics: Num;
  score_soundtrack: Num;
  score_longevity: Num;
  score_overall: Num;
  summary: string | null;
  review_body: string | null;
  personal_note: string | null;
  played_year: number | null;
  hours_played: number | null;
  is_gem: number;
  is_essential: number;
  emilio_rank: number | null;
  community_avg: Num;
  vote_count: number;
  genres: { name: string; slug: string }[];
  my_vote: number | null;
  is_favorite: boolean;
};

export const toNum = (v: Num | undefined): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
