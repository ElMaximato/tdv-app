import { useEffect, useRef, useState } from 'react'

// Frases de Navi al hacer click
const NAVI_PHRASES = [
  'HEY!',
  'LISTEN!',
  'HEY! LISTEN!',
  'WATCH OUT!',
  'HEY! LOOK!',
  '...',
  'LOOK!',
]

// SVG de Navi: hada con alas y aura
const NaviSVG = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    {/* Aura exterior */}
    <circle cx="16" cy="16" r="14" fill={color} opacity="0.15" />
    <circle cx="16" cy="16" r="10" fill={color} opacity="0.2" />
    {/* Alas */}
    <ellipse cx="10" cy="14" rx="7" ry="3.5" fill="white" opacity="0.7" transform="rotate(-20 10 14)" />
    <ellipse cx="22" cy="14" rx="7" ry="3.5" fill="white" opacity="0.7" transform="rotate(20 22 14)" />
    <ellipse cx="10" cy="18" rx="5" ry="2.5" fill="white" opacity="0.5" transform="rotate(15 10 18)" />
    <ellipse cx="22" cy="18" rx="5" ry="2.5" fill="white" opacity="0.5" transform="rotate(-15 22 18)" />
    {/* Cuerpo central */}
    <circle cx="16" cy="15" r="4" fill={color} />
    <circle cx="16" cy="15" r="2.5" fill="white" opacity="0.9" />
    {/* Brillo */}
    <circle cx="15" cy="14" r="1" fill="white" opacity="0.8" />
  </svg>
)

interface NaviState {
  x: number
  y: number
  vx: number
  vy: number
  phrase: string | null
  phraseTimer: number
  phase: 'flying' | 'paused' | 'hiding'
  opacity: number
  scale: number
  color: string
  wingAngle: number
}

const COLORS = ['#00cfff', '#7fffff', '#00ffff', '#40e0ff']

export function NaviSprite() {
  const [navi, setNavi]     = useState<NaviState>({
    x: 200, y: 300,
    vx: 1.2, vy: 0.8,
    phrase: null, phraseTimer: 0,
    phase: 'flying',
    opacity: 1, scale: 1,
    color: COLORS[0],
    wingAngle: 0,
  })
  const [clicked, setClicked] = useState(false)
  const animRef = useRef<number>(0)
  const stateRef = useRef(navi)
  stateRef.current = navi

  useEffect(() => {
    let frame = 0

    function tick() {
      frame++
      const s = stateRef.current
      const W = window.innerWidth
      const H = window.innerHeight

      let { x, y, vx, vy, phase, opacity, scale, phraseTimer, phrase, wingAngle } = s

      // Aleteo
      wingAngle = Math.sin(frame * 0.15) * 12

      if (phase === 'flying') {
        // Movimiento suave con un poco de sinusoide
        x += vx + Math.sin(frame * 0.02) * 0.4
        y += vy + Math.cos(frame * 0.025) * 0.3

        // Rebotar en bordes (dejar margen del navbar ~80px arriba)
        if (x < 20 || x > W - 52)  vx *= -1
        if (y < 90 || y > H - 52)  vy *= -1
        x = Math.max(20, Math.min(W - 52, x))
        y = Math.max(90, Math.min(H - 52, y))

        // Cada ~8 segundos, pausar brevemente
        if (frame % 480 === 0) {
          phase = 'paused'
          phrase = NAVI_PHRASES[Math.floor(Math.random() * NAVI_PHRASES.length)]
          phraseTimer = 120
        }

        // Cada ~20 segundos, desaparecer y reaparecer en otro lugar
        if (frame % 1200 === 0) {
          phase = 'hiding'
          opacity = 1
        }

      } else if (phase === 'paused') {
        phraseTimer--
        // Flotar suavemente en pausa
        y += Math.sin(frame * 0.05) * 0.3
        if (phraseTimer <= 0) {
          phrase = null
          phase = 'flying'
          // Cambiar dirección al retomar
          vx = (Math.random() - 0.5) * 2.5
          vy = (Math.random() - 0.5) * 2.5
          if (Math.abs(vx) < 0.5) vx = 0.8
          if (Math.abs(vy) < 0.5) vy = 0.8
        }

      } else if (phase === 'hiding') {
        opacity -= 0.03
        scale   -= 0.02
        if (opacity <= 0) {
          // Reaparecer en lugar aleatorio
          x       = 80 + Math.random() * (W - 160)
          y       = 100 + Math.random() * (H - 200)
          opacity = 0
          scale   = 0.2
          phase   = 'appearing'
        }

      } else if (phase === 'appearing') {
        opacity += 0.04
        scale   += 0.04
        if (opacity >= 1) {
          opacity = 1
          scale   = 1
          phase   = 'flying'
          vx = (Math.random() - 0.5) * 2.5
          vy = (Math.random() - 0.5) * 2.5
          if (Math.abs(vx) < 0.5) vx = 0.8
          if (Math.abs(vy) < 0.5) vy = 0.8
        }
      }

      setNavi({ x, y, vx, vy, phrase, phraseTimer, phase, opacity, scale, color: s.color, wingAngle })
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  function handleClick() {
    setClicked(true)
    setNavi(s => ({
      ...s,
      phrase: NAVI_PHRASES[Math.floor(Math.random() * NAVI_PHRASES.length)],
      phraseTimer: 100,
      phase: 'paused',
    }))
    setTimeout(() => setClicked(false), 300)
  }

  const glowColor = navi.color

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: navi.x,
        top:  navi.y,
        zIndex: 9999,
        opacity: navi.opacity,
        transform: `scale(${navi.scale}) rotate(${navi.wingAngle * 0.3}deg)`,
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none',
        transition: 'transform 0.05s',
        filter: `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor}80)`,
      }}
    >
      {/* Burbuja de diálogo */}
      {navi.phrase && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#001a2e',
            border: `2px solid ${glowColor}`,
            borderRadius: 4,
            padding: '3px 7px',
            whiteSpace: 'nowrap',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: glowColor,
            textShadow: `0 0 8px ${glowColor}`,
            boxShadow: `0 0 12px ${glowColor}40`,
            animation: 'naviPop 0.15s ease-out',
          }}
        >
          {navi.phrase}
          {/* Triángulo apuntando hacia abajo */}
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `6px solid ${glowColor}`,
          }} />
        </div>
      )}

      {/* Navi SVG */}
      <NaviSVG color={glowColor} />

      {/* Estela de partículas */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 6, height: 6,
        borderRadius: '50%',
        background: glowColor,
        opacity: 0.6,
        transform: `translate(${-navi.vx * 8}px, ${-navi.vy * 8}px) scale(0.6)`,
        filter: `blur(2px)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 4, height: 4,
        borderRadius: '50%',
        background: glowColor,
        opacity: 0.3,
        transform: `translate(${-navi.vx * 16}px, ${-navi.vy * 16}px) scale(0.4)`,
        filter: `blur(3px)`,
        pointerEvents: 'none',
      }} />
    </div>
  )
}
