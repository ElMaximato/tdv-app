import { Link } from 'react-router'
import type { Game } from '../hooks/Usegames'
import { getScoreStyle } from '../utils/scoreColors'

interface Props {
  game: Game
  rank?: number
}

export function GameCard({ game, rank }: Props) {
  const isTop3     = rank != null && rank <= 3
  const rawScore   = game.emilio_score != null ? Number(game.emilio_score) : null
  const scoreStyle = rawScore != null ? getScoreStyle(rawScore) : null

  return (
    <Link to={`/game/${game.slug}`} className="block group">
      <article
        className="flex flex-col h-full transition-transform duration-200 group-hover:-translate-y-1"
        style={{
          background: '#1a1d2e',
          border: `2px solid ${scoreStyle ? scoreStyle.border : '#3a3f5c'}`,
          boxShadow: scoreStyle
            ? `0 0 0 1px ${scoreStyle.border}, 0 4px 16px ${scoreStyle.bg}, 3px 3px 0 #000`
            : '3px 3px 0 #000, 0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── Header: plataforma + rank ── */}
        <div
          className="flex justify-between items-center px-2 py-1 border-b"
          style={{
            background: 'linear-gradient(90deg, #122d6e 0%, #1a1d2e 100%)',
            borderColor: scoreStyle ? scoreStyle.border : '#3a3f5c',
          }}
        >
          <span className="font-pixel text-white uppercase" style={{ fontSize: 7 }}>
            {game.platform}
          </span>
          {rank != null && (
            <span
              className="font-pixel"
              style={{
                fontSize: 8,
                color: isTop3 ? '#ffcc00' : '#7a8099',
              }}
            >
              #{String(rank).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* ── Portada ── */}
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: '3/4', background: '#060810' }}
        >
          {game.cover_image ? (
            <img
              src={
                game.cover_image.startsWith('http')
                  ? game.cover_image
                  : `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/uploads/${game.cover_image}`
              }
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-pixel text-muted" style={{ fontSize: 8 }}>NO SIGNAL</span>
            </div>
          )}

          {/* Badges sobre imagen */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {game.is_gem === 1 && (
              <span className="badge-gem" style={{ background: '#ffcc00' }}>💎 GEM</span>
            )}
            {game.is_essential === 1 && (
              <span className="badge-gem" style={{ background: '#e60012', color: '#fff', borderColor: '#000' }}>
                ★ ESS
              </span>
            )}
          </div>

          {/* Score flotante — esquina inferior derecha */}
          {rawScore != null && scoreStyle && (
            <div
              className="absolute bottom-0 right-0 px-2 py-1"
              style={{
                background: 'rgba(0,0,0,0.88)',
                borderTop:  `2px solid ${scoreStyle.color}`,
                borderLeft: `2px solid ${scoreStyle.color}`,
              }}
            >
              <span
                className="font-pixel"
                style={{
                  fontSize: rawScore === 100 ? 12 : 14,
                  color: scoreStyle.color,
                  textShadow: scoreStyle.glow,
                  letterSpacing: rawScore >= 100 ? 0 : 1,
                }}
              >
                {rawScore}
              </span>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col p-2 flex-1" style={{ background: '#1a1d2e' }}>
          <h3
            className="font-display uppercase leading-tight mb-1 line-clamp-2"
            style={{ fontSize: 18, color: '#e8e0d0' }}
          >
            {game.title}
          </h3>

          {game.release_year && (
            <span className="font-body text-xs mb-2" style={{ color: '#7a8099' }}>
              {game.release_year}
            </span>
          )}

          {/* Barras de score */}
          {(rawScore != null || game.community_avg != null) && (
            <div
              className="mt-auto pt-2 space-y-1"
              style={{ borderTop: '1px solid #2a2d40' }}
            >
              {rawScore != null && scoreStyle && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body font-bold" style={{ fontSize: 9, color: '#7a8099' }}>
                      EMILIO
                    </span>
                    <span className="font-pixel" style={{ fontSize: 8, color: scoreStyle.color, textShadow: scoreStyle.glow }}>
                      {rawScore}
                    </span>
                  </div>
                  <div className="score-bar">
                    <div
                      style={{
                        width: `${rawScore}%`,
                        height: '100%',
                        background: scoreStyle.color,
                        boxShadow: `0 0 6px ${scoreStyle.color}80`,
                      }}
                    />
                  </div>
                </div>
              )}
              {game.community_avg != null && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body font-bold" style={{ fontSize: 9, color: '#7a8099' }}>
                      COMUNIDAD
                    </span>
                    <span className="font-pixel" style={{ fontSize: 8, color: '#4FC3F7' }}>
                      {game.community_avg}
                    </span>
                  </div>
                  <div className="score-bar">
                    <div
                      style={{
                        width: `${(Number(game.community_avg) / 10) * 100}%`,
                        height: '100%',
                        background: '#4FC3F7',
                        boxShadow: '0 0 4px #4FC3F760',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
