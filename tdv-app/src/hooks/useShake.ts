import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';

// Detecta una "sacudida" del teléfono con el acelerómetro.
// - La magnitud en reposo es ~1 g (gravedad); al agitar sube mucho por encima.
// - `cooldownMs` evita que una sola sacudida dispare varias veces.
// Reutilizable: p. ej. más adelante para borrar un formulario al agitar.
export function useShake(onShake: () => void, enabled = true, opts: { threshold?: number; cooldownMs?: number } = {}) {
  const { threshold = 1.9, cooldownMs = 1500 } = opts;
  const cb = useRef(onShake);
  cb.current = onShake;

  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (g > threshold && now - last > cooldownMs) {
        last = now;
        cb.current();
      }
    });
    return () => sub.remove();
  }, [enabled, threshold, cooldownMs]);
}
