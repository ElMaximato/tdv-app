import React, { useEffect, useRef, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

import { colors } from '../theme';

// Cuenta regresiva hasta que un pedido sin pagar expira. El servidor manda los segundos que faltan
// (así no depende de la hora del celular) y aquí solo se va descontando cada segundo.
export function useCountdown(seconds: number | null | undefined, onDone?: () => void) {
  const deadline = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;
  const [left, setLeft] = useState<number | null>(seconds == null ? null : Math.max(0, seconds));

  useEffect(() => {
    if (seconds == null) { setLeft(null); return; }
    deadline.current = Date.now() + Math.max(0, seconds) * 1000;
    setLeft(Math.max(0, seconds));
    let fired = false;
    const t = setInterval(() => {
      const r = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setLeft(r);
      if (r === 0 && !fired) { fired = true; clearInterval(t); done.current?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);
  return left;
}

export const formatClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function ExpiryText({ seconds, onExpire, style, prefix = '⏳ Expira en ' }: { seconds: number | null | undefined; onExpire?: () => void; style?: TextStyle; prefix?: string }) {
  const left = useCountdown(seconds, onExpire);
  if (left == null) return null;
  const urgent = left <= 300;
  return <Text style={[{ color: urgent ? colors.red : colors.gold, fontWeight: '700', fontSize: 13 }, style]}>{left === 0 ? 'Venciendo…' : `${prefix}${formatClock(left)}`}</Text>;
}
