import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Button } from './ui';
import { colors, fonts } from '../theme';

// Estados vacíos y de error con una "ilustración" hecha de emoji, anillos y estrellitas pixel.
// La figura flota suavemente para que la pantalla se sienta viva, no rota.
function Illustration({ emoji, tone }: { emoji: string; tone: string }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);
  const y = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <View style={s.illu}>
      <View style={[s.ring, { width: 150, height: 150, borderRadius: 75, borderColor: tone, opacity: 0.18 }]} />
      <View style={[s.ring, { width: 112, height: 112, borderRadius: 56, borderColor: tone, opacity: 0.35 }]} />
      <Animated.View style={[s.core, { backgroundColor: colors.card, borderColor: tone, transform: [{ translateY: y }] }]}>
        <Text style={{ fontSize: 42 }}>{emoji}</Text>
      </Animated.View>
      <Text style={[s.spark, { top: 6, left: 18, color: tone }]}>✦</Text>
      <Text style={[s.spark, { top: 30, right: 10, color: colors.gold, fontSize: 10 }]}>✦</Text>
      <Text style={[s.spark, { bottom: 14, left: 4, color: colors.cyan, fontSize: 9 }]}>■</Text>
    </View>
  );
}

type EmptyProps = { emoji: string; title: string; message?: string; actionLabel?: string; onAction?: () => void; tone?: string };

export function EmptyState({ emoji, title, message, actionLabel, onAction, tone = colors.red }: EmptyProps) {
  return (
    <View style={s.wrap}>
      <Illustration emoji={emoji} tone={tone} />
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: 22, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

// Error amable: explica qué pasó en palabras simples y deja reintentar con un toque.
export function ErrorState({ message, onRetry, title = '¡Ups! Algo salió mal' }: { message?: string | null; onRetry?: () => void; title?: string }) {
  const offline = !!message && /conect|wi-?fi|servidor/i.test(message);
  return (
    <EmptyState
      emoji={offline ? '📡' : '🕹️'}
      title={offline ? 'Sin conexión con el servidor' : title}
      message={message ?? 'Inténtalo de nuevo en un momento.'}
      actionLabel={onRetry ? 'Reintentar' : undefined}
      onAction={onRetry}
      tone={colors.gold}
    />
  );
}

// Pantalla completa centrada (para usarla como contenido único de una pantalla).
export function FullState(props: EmptyProps) {
  return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState {...props} /></View>;
}
export function FullError(props: { message?: string | null; onRetry?: () => void }) {
  return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ErrorState {...props} /></View>;
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 32 },
  illu: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  ring: { position: 'absolute', borderWidth: 2 },
  core: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute', fontSize: 14, fontFamily: fonts.pixel },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  msg: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
});
