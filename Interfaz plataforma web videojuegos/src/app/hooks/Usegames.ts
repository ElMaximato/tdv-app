import { useState, useEffect, useCallback } from 'react'

export interface Game {
  id: number
  title: string
  slug: string
  platform: string
  platform_slug: string
  release_year: number
  cover_image: string | null
  emilio_score: number | null
  community_avg: number | null
  composite_score: number | null
  vote_count: number
  summary: string | null
  is_gem: number | boolean
  is_essential: number | boolean
  emilio_rank: number | null
  gamerankings_score: number | null
}

export interface GamesMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface GamesFilters {
  platform?: string
  genre?: string
  year_from?: number
  year_to?: number
  gem?: boolean
  essential?: boolean
  q?: string
  sort?: 'composite_score' | 'emilio_score' | 'community_avg' | 'release_year'
  page?: number
  limit?: number
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function useGames(filters: GamesFilters = {}) {
  const [games, setGames]     = useState<Game[]>([])
  const [meta, setMeta]       = useState<GamesMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.platform)  params.set('platform',  filters.platform)
      if (filters.genre)     params.set('genre',      filters.genre)
      if (filters.year_from) params.set('year_from',  String(filters.year_from))
      if (filters.year_to)   params.set('year_to',    String(filters.year_to))
      if (filters.gem)       params.set('gem',        'true')
      if (filters.essential) params.set('essential',  'true')
      if (filters.q)         params.set('q',          filters.q)
      if (filters.sort)      params.set('sort',       filters.sort)
      if (filters.page)      params.set('page',       String(filters.page))
      if (filters.limit)     params.set('limit',      String(filters.limit))

      const res = await fetch(`${API}/api/games?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      setGames(json.data)
      setMeta(json.meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetchGames() }, [fetchGames])

  return { games, meta, loading, error, refetch: fetchGames }
}