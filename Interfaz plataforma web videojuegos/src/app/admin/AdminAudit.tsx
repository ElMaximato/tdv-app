import { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  admin_login_success: { bg: 'rgba(0,200,83,0.15)',  color: '#00c853' },
  admin_login_fail:    { bg: 'rgba(230,0,18,0.15)',  color: '#e60012' },
  admin_login_denied:  { bg: 'rgba(230,0,18,0.15)',  color: '#e60012' },
  game_create:         { bg: 'rgba(42,91,232,0.15)', color: '#2a5be8' },
  game_update:         { bg: 'rgba(255,204,0,0.15)', color: '#ffcc00' },
  game_delete:         { bg: 'rgba(230,0,18,0.15)',  color: '#e60012' },
  game_publish:        { bg: 'rgba(0,200,83,0.15)',  color: '#00c853' },
  game_unpublish:      { bg: 'rgba(255,204,0,0.15)', color: '#ffcc00' },
  user_role_change:    { bg: 'rgba(230,0,18,0.15)',  color: '#e60012' },
}

export function AdminAudit() {
  const { adminFetch } = useAdminAuth()
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch(`${API}/api/admin/audit?limit=100`)
      .then(r => r.json())
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6">

      <div className="retro-section-bar">
        <span>🔒 AUDIT LOG</span>
        <span className="ml-auto font-pixel text-gold" style={{ fontSize: 7 }}>
          ÚLTIMAS 100 ACCIONES
        </span>
      </div>

      <div
        style={{
          background: '#1a1d2e',
          border: '2px solid #3a3f5c',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="p-10 text-center">
            <p className="font-pixel animate-blink" style={{ fontSize: 9, color: '#ffcc00' }}>
              CARGANDO...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-body text-sm" style={{ color: '#7a8099' }}>
              Sin registros de auditoría.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#13152a', borderBottom: '2px solid #3a3f5c' }}>
                  {['FECHA', 'USUARIO', 'ACCIÓN', 'IP', 'DETALLES'].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-2 font-pixel"
                      style={{ fontSize: 7, color: '#7a8099', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const ac = ACTION_COLORS[log.action]
                  return (
                    <tr
                      key={log.id ?? i}
                      style={{
                        borderBottom: '1px solid #2a2d40',
                        background: i % 2 === 0 ? 'transparent' : '#13152a',
                      }}
                    >
                      <td className="px-4 py-2 font-body text-xs whitespace-nowrap" style={{ color: '#7a8099' }}>
                        {new Date(log.created_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-4 py-2 font-body text-sm" style={{ color: '#e8e0d0' }}>
                        {log.username ?? <span style={{ color: '#3a3f5c', fontStyle: 'italic' }}>anónimo</span>}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="font-pixel uppercase"
                          style={{
                            fontSize: 6,
                            padding: '2px 6px',
                            border: `1px solid ${ac?.color ?? '#3a3f5c'}`,
                            background: ac?.bg ?? 'transparent',
                            color: ac?.color ?? '#7a8099',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-body text-xs" style={{ color: '#3a3f5c', fontFamily: 'monospace' }}>
                        {log.ip_address ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-body text-xs" style={{ color: '#7a8099', maxWidth: 260 }}>
                        {log.details ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}