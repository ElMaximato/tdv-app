import { useEffect, useState } from 'react'

// ============================================================
//  PixelRunners — Yoshis corriendo por el navbar
//  El GIF vive en /public/yoshi-running.gif y se referencia
//  como "/yoshi-running.gif" (URL absoluta, sin import).
// ============================================================

interface Runner {
  id:    number
  x:     number
  y:     number
  speed: number
  size:  number
}

const YOSHI_COUNT = 3

const CONFIGS = [
  { size: 42, speed: 1.2, y: 8  },
  { size: 38, speed: 1.5, y: 12 },
  { size: 46, speed: 0.9, y: 6  },
  { size: 40, speed: 1.3, y: 10 },
]

function createRunner(i: number): Runner {
  const cfg = CONFIGS[i % CONFIGS.length]
  return {
    id:    i,
    x:     -(cfg.size + 150 + i * 500),
    y:     cfg.y,
    speed: cfg.speed,
    size:  cfg.size,
  }
}

export function PixelRunners() {
  const [runners, setRunners] = useState<Runner[]>(() =>
    Array.from({ length: YOSHI_COUNT }, (_, i) => createRunner(i))
  )

  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    function animate(time: number) {
      const dt = Math.min(time - lastTime, 50)
      lastTime = time

      setRunners(prev => prev.map(r => {
        let x = r.x + r.speed * (dt / 16)
        if (x > window.innerWidth + 60) {
          x = -r.size - 100 - Math.random() * 600
        }
        return { ...r, x }
      }))

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position:      'absolute',
        inset:         0,
        overflow:      'hidden',
        pointerEvents: 'none',
        zIndex:        0,
      }}
    >
      {runners.map(r => (
        <img
          key={r.id}
          src="/yoshi-running.gif"
          alt=""
          draggable={false}
          style={{
            position:       'absolute',
            left:           0,
            top:            r.y,
            width:          r.size,
            height:         'auto',
            transform:      `translateX(${r.x}px)`,
            imageRendering: 'pixelated',
            willChange:     'transform',
            userSelect:     'none',
          }}
        />
      ))}
    </div>
  )
}