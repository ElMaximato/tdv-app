import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, scoreColor } from '../theme';

// Control de calificación 0-100 hecho solo con JS (no necesita paquetes nativos):
// arrastra la barra, toca para saltar, o ajusta de 1 en 1 con − y +.
export function ScoreSlider({ value, onChange, onDragState }: { value: number; onChange: (n: number) => void; onDragState?: (dragging: boolean) => void }) {
  const [width, setWidth] = useState(1);
  const w = useRef(1);
  const startX = useRef(0);
  const cb = useRef({ onChange, onDragState });
  cb.current = { onChange, onDragState };

  const setFromX = (x: number) => cb.current.onChange(Math.max(0, Math.min(100, Math.round((x / w.current) * 100))));
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { startX.current = e.nativeEvent.locationX; cb.current.onDragState?.(true); setFromX(startX.current); },
    onPanResponderMove: (_e, g) => setFromX(startX.current + g.dx),
    onPanResponderRelease: () => cb.current.onDragState?.(false),
    onPanResponderTerminate: () => cb.current.onDragState?.(false),
  })).current;

  const c = scoreColor(value);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View>
      <View style={s.top}>
        <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={s.step} hitSlop={8}><Text style={s.stepTxt}>−</Text></Pressable>
        <Text style={[s.big, { color: c }]}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(100, value + 1))} style={s.step} hitSlop={8}><Text style={s.stepTxt}>+</Text></Pressable>
      </View>
      <View style={s.touch} {...pan.panHandlers} onLayout={e => { w.current = e.nativeEvent.layout.width || 1; setWidth(w.current); }}>
        <View style={s.track} pointerEvents="none"><View style={[s.fill, { width: `${pct}%`, backgroundColor: c }]} /></View>
        <View pointerEvents="none" style={[s.thumb, { left: (pct / 100) * width - 13, borderColor: c }]} />
      </View>
      <View style={s.chips}>
        {[60, 70, 80, 90, 100].map(n => (
          <Pressable key={n} onPress={() => onChange(n)} style={[s.chip, value === n && { borderColor: c, backgroundColor: colors.elevated }]}>
            <Text style={{ color: value === n ? c : colors.muted, fontWeight: '700', fontSize: 13 }}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginBottom: 6 },
  big: { fontSize: 54, fontWeight: '900', minWidth: 100, textAlign: 'center' },
  step: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: -2 },
  touch: { height: 44, justifyContent: 'center', marginHorizontal: 13 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.elevated, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  thumb: { position: 'absolute', top: 9, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', borderWidth: 4 },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
});
