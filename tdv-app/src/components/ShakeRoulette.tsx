import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { coverUrl, ScoreBadge } from './GameCard';
import { Button, PixelTitle } from './ui';
import { colors, fonts, radius } from '../theme';
import { RankedGame, toNum } from '../types';

// Animación del shake: la tarjeta tiembla, los juegos giran como ruleta
// (cada vez más lento) y se detiene en un juego sorpresa.
type Props = {
  visible: boolean;
  games: RankedGame[];
  winner: RankedGame | null;
  onClose: () => void;
  onOpen: (g: RankedGame) => void;
  onAgain: () => void;
};

export function ShakeRoulette({ visible, games, winner, onClose, onOpen, onAgain }: Props) {
  const [shown, setShown] = useState<RankedGame | null>(null);
  const [done, setDone] = useState(false);
  const scale = useRef(new Animated.Value(0.6)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || !winner) return;
    setDone(false);
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();

    // temblor mientras gira
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();

    // ruleta: el intervalo crece hasta frenar en el ganador
    let step = 0;
    const total = 22;
    const tick = () => {
      step++;
      if (step >= total) {
        loop.stop();
        wobble.setValue(0);
        setShown(winner);
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        pop.setValue(0.85);
        Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        return;
      }
      setShown(games[Math.floor(Math.random() * games.length)] ?? winner);
      Haptics.selectionAsync().catch(() => {});
      timer.current = setTimeout(tick, 60 + step * step * 0.6);
    };
    tick();

    return () => { loop.stop(); if (timer.current) clearTimeout(timer.current); };
    // se reinicia cada vez que cambia el ganador (nueva sacudida)
  }, [visible, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const rotate = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const g = shown;
  const img = g ? coverUrl(g.cover_image) : null;
  const score = g ? toNum(g.composite_score) ?? toNum(g.emilio_score) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={done ? onClose : undefined}>
        <Animated.View style={[s.card, { transform: [{ scale }, { rotate }] }, done && { borderColor: colors.gold }]}>
          <PixelTitle size={11} color={done ? colors.gold : colors.muted}>{done ? '¡TU JUEGO SORPRESA!' : 'GIRANDO…'}</PixelTitle>
          <Animated.View style={{ transform: [{ scale: pop }], alignItems: 'center', marginTop: 20 }}>
            {img ? <Image source={{ uri: img }} style={s.cover} /> : <View style={[s.cover, s.noCover]}><Text style={{ fontSize: 44 }}>🎮</Text></View>}
            <Text style={s.title} numberOfLines={2}>{g?.title ?? ''}</Text>
            <Text style={s.meta} numberOfLines={1}>{g ? `${g.platform}${g.release_year ? ` · ${g.release_year}` : ''}` : ''}</Text>
            <View style={{ marginTop: 14, opacity: done ? 1 : 0.5 }}><ScoreBadge score={score} size={64} /></View>
          </Animated.View>
          {done && g ? (
            <View style={{ alignSelf: 'stretch', marginTop: 22, gap: 10 }}>
              <Button title="Ver juego" onPress={() => onOpen(g)} />
              <Button title="Otra vez 🎲" variant="ghost" onPress={onAgain} />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,5,12,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 2, borderColor: colors.border, padding: 24, alignItems: 'center' },
  cover: { width: 130, height: 172, borderRadius: 12, backgroundColor: colors.elevated },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
