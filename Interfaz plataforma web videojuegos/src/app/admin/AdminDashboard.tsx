import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface DashboardData {
  gameStats: { total: number; published: number; drafts: number }
  userStats: { total: number; verified: number; admins: number; editors: number }
  voteStats: { total: number; avg_score: number }
  quizStats: { total: number; passed: number }
  reviewStats: { total: number; gems: number; essentials: number }
  recentAudit: Array<{ id: number; action: string; username: string; details: string; created_at: string }>
}

export function AdminDashboard() {
  const { adminFetch } = useAdminAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch(`${API}/api/admin/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="retro-bar inline-flex rounded-lg mb-2">
          <span>📊 DASHBOARD</span>
        </div>
        <h1 className="font-display text-4xl text-white">PANEL DE CONTROL</h1>
        <p className="text-text-muted text-sm">Estadísticas generales del sitio</p>
      </div>

      {loading ? (
        <p className="font-pixel text-accent-gold animate-blink" style={{ fontSize: 9 }}>CARGANDO...</p>
      ) : data ? (
        <>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/admin/games/new" className="btn-primary text-sm">+ Nuevo Juego</Link>
            <Link to="/admin/games" className="btn-secondary text-sm">Ver todos</Link>
            <Link to="/admin/quiz" className="btn-secondary text-sm">Gestionar Quiz</Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="JUEGOS"
              value={data.gameStats.total}
              sub={`${data.gameStats.published} publicados · ${data.gameStats.drafts} borradores`}
              color="var(--accent-red)"
            />
            <StatCard
              label="USUARIOS"
              value={data.userStats.total}
              sub={`${data.userStats.verified} verificados`}
              color="var(--accent-blue)"
            />
            <StatCard
              label="VOTOS"
              value={data.voteStats.total || 0}
              sub={`Promedio: ${data.voteStats.avg_score || '—'}`}
              color="var(--accent-green)"
            />
            <StatCard
              label="QUIZ"
              value={data.quizStats.total || 0}
              sub={`${data.quizStats.passed || 0} aprobados`}
              color="var(--accent-gold)"
            />
            <StatCard
              label="RESEÑAS"
              value={data.reviewStats.total || 0}
              sub={`${data.reviewStats.gems || 0} joyas · ${data.reviewStats.essentials || 0} esenciales`}
              color="var(--accent-cyan)"
            />
          </div>

          {/* Admin breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6">
              <h3 className="font-display text-2xl text-white mb-4">EQUIPO</h3>
              <div className="space-y-3">
                <Row label="Super-admins" value={data.userStats.admins} color="var(--accent-red)" />
                <Row label="Editores" value={data.userStats.editors} color="var(--accent-gold)" />
                <Row label="Miembros regulares" value={data.userStats.total - data.userStats.admins - data.userStats.editors} color="var(--accent-blue)" />
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display text-2xl text-white mb-4">ACTIVIDAD RECIENTE</h3>
              {data.recentAudit.length === 0 ? (
                <p className="text-text-muted text-sm">Sin actividad registrada</p>
              ) : (
                <div className="space-y-2">
                  {data.recentAudit.slice(0, 6).map(log => (
                    <div key={log.id} className="flex items-start gap-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-accent-gold mt-0.5" style={{ fontSize: 10 }}>▸</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium">
                          <span className="text-accent-blue">{log.username || 'sistema'}</span>
                          {' · '}
                          <span className="font-pixel" style={{ fontSize: 8 }}>{log.action}</span>
                        </p>
                        {log.details && <p className="text-text-dim text-xs truncate">{log.details}</p>}
                        <p className="text-text-dim text-[10px]">{new Date(log.created_at).toLocaleString('es-MX')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub: string; color: string }) {
  return (
    <div className="glass-card p-5">
      <div className="font-pixel text-text-dim mb-2" style={{ fontSize: 7 }}>{label}</div>
      <div className="font-display text-5xl leading-none" style={{ color }}>{value}</div>
      <p className="text-text-dim text-xs mt-2">{sub}</p>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-text-muted text-sm">{label}</span>
      <span className="font-display text-2xl" style={{ color }}>{value}</span>
    </div>
  )
}
