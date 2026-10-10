import { Link } from 'react-router'

export function QuizPromo() {
  return (
    <section style={{ padding: '0 24px 64px', background: '#06060e' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Strip de accesos rápidos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10, marginBottom: 48,
        }}>
          {[
            { to: '/consolas',  icon: '🕹️', label: 'CONSOLAS',  sub: 'Historia y mejores juegos', color: '#4FC3F7' },
            { to: '/sagas',     icon: '📚', label: 'SAGAS',     sub: 'Orden ideal para jugarlas', color: '#a78bfa' },
            { to: '/95',        icon: '★',  label: '95+',       sub: 'Obras maestras absolutas',  color: '#fbbf24' },
            { to: '/rankings',  icon: '▶',  label: 'RANKING',   sub: 'Todos los juegos puntuados', color: '#e60012' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '18px 20px', borderRadius: 12,
                background: 'rgba(14,14,24,0.9)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = `${item.color}40`
                  el.style.background = `${item.color}08`
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(255,255,255,0.06)'
                  el.style.background = 'rgba(14,14,24,0.9)'
                  el.style.transform = 'none'
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: item.color, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.4 }}>{item.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Banner del Quiz */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 16,
          background: 'rgba(14,14,24,0.95)',
          border: '1px solid rgba(251,191,36,0.2)',
          padding: '40px 44px',
        }}>
          {/* Glow decorativo */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: '30%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,0,18,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>

            {/* Texto */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                color: '#fbbf24', letterSpacing: 2,
                padding: '4px 12px', background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, marginBottom: 16,
              }}>🧩 VERIFICACIÓN GAMER</div>

              <h2 style={{ fontFamily: '"VT323", monospace', fontSize: 48, color: '#fff', margin: '0 0 12px', lineHeight: 1 }}>
                DEMUESTRA QUE <span style={{ color: '#fbbf24' }}>SABES</span>
              </h2>

              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 480, margin: '0 0 24px' }}>
                Solo los gamers verificados pueden votar en el ranking. Pasa el quiz con 70% de aciertos
                y tu criterio contará junto al de Emilio.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                {['10 preguntas', 'Dificultad media', '~5 minutos'].map(tag => (
                  <span key={tag} style={{
                    fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                    color: '#4b5563', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '4px 10px', borderRadius: 4,
                  }}>{tag}</span>
                ))}
              </div>

              <Link to="/quiz" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                color: '#fff', background: '#fbbf24',
                border: 'none', borderRadius: 8,
                padding: '12px 24px', textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(251,191,36,0.3)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(251,191,36,0.45)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(251,191,36,0.3)' }}
              >
                <span style={{ color: '#000' }}>INICIAR QUIZ →</span>
              </Link>
            </div>

            {/* Tarjeta de pregunta demo */}
            <div style={{
              width: 260, flexShrink: 0,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: 20,
            }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#fbbf24', marginBottom: 14 }}>
                PREGUNTA 1 / 10
              </div>
              <p style={{ fontFamily: '"VT323", monospace', fontSize: 20, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
                ¿En qué año se lanzó el primer Metal Gear Solid?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['1996', '1998', '2000', '2001'].map((opt, i) => (
                  <div key={opt} style={{
                    padding: '7px 12px', borderRadius: 8,
                    background: i === 1 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 1 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: i === 1 ? '#fbbf24' : '#374151' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ fontSize: 13, color: i === 1 ? '#fbbf24' : '#4b5563' }}>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}