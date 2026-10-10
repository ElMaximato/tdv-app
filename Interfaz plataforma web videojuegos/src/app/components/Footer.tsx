import { Link } from 'react-router'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="retro-bar rounded-lg px-2 py-1"><span style={{ fontSize: 8 }}>TDV</span></div>
              <div className="font-pixel text-text-dim" style={{ fontSize: 6 }}>TIEMPO DE<br/>VIDEOJUEGOS</div>
            </div>
            <p className="text-text-dim text-xs leading-relaxed">Rankings con criterio real.</p>
          </div>
          <div>
            <h4 className="font-pixel text-text-muted mb-3 uppercase" style={{ fontSize: 7 }}>Explorar</h4>
            <div className="space-y-2">
              <Link to="/rankings" className="block text-text-dim text-sm hover:text-white transition-colors">Rankings</Link>
              <Link to="/rankings?gem=true" className="block text-text-dim text-sm hover:text-white transition-colors">Joyas Ocultas</Link>
              <Link to="/quiz" className="block text-text-dim text-sm hover:text-white transition-colors">Quiz Gamer</Link>
            </div>
          </div>
          <div>
            <h4 className="font-pixel text-text-muted mb-3 uppercase" style={{ fontSize: 7 }}>Consolas</h4>
            <div className="space-y-2">
              {['snes','n64','ps1','ps2','ngc'].map(s => (
                <Link key={s} to={`/console/${s}`} className="block text-text-dim text-sm hover:text-white transition-colors uppercase">{s}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-pixel text-text-muted mb-3 uppercase" style={{ fontSize: 7 }}>Cuenta</h4>
            <div className="space-y-2">
              <Link to="/profile" className="block text-text-dim text-sm hover:text-white transition-colors">Mi Perfil</Link>
              <Link to="/login" className="block text-text-dim text-sm hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="block text-text-dim text-sm hover:text-white transition-colors">Registro</Link>
            </div>
          </div>
        </div>
        <div className="pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="font-pixel text-text-dim" style={{ fontSize: 6 }}>© 2026 TIEMPO DE VIDEOJUEGOS</p>
          <p className="font-pixel text-text-dim animate-blink" style={{ fontSize: 6 }}>PRESS START TO CONTINUE</p>
        </div>
      </div>
    </footer>
  )
}