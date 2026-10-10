import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { UPLOADS_URL } from '../config';
import { colors, fonts, radius, scoreColor } from '../theme';
import { RankedGame, toNum } from '../types';

// Acepta "covers/x.jpg", "/covers/x.jpg", "/uploads/covers/x.jpg" o una URL completa.
export const coverUrl = (c: string | null) => {
  if (!c) return null;
  if (/^https?:\/\//i.test(c)) return c;
  return UPLOADS_URL + c.replace(/^\/+/, '').replace(/^uploads\//, '');
};

export function ScoreBadge({ score, size = 52 }: { score: number | null; size?: number }) {
  const c = scoreColor(score);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: c, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: c, fontFamily: fonts.pixel, fontSize: size * 0.28 }}>{score == null ? '--' : Math.round(score)}</Text>
    </View>
  );
}

export function GameCard({ game, rank, onPress }: { game: RankedGame; rank: number; onPress: () => void }) {
  const img = coverUrl(game.cover_image);
  const score = toNum(game.composite_score) ?? toNum(game.emilio_score);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <Text style={s.rank}>{rank}</Text>
      {img ? <Image source={{ uri: img }} style={s.cover} /> : <View style={[s.cover, s.noCover]}><Text style={{ fontSize: 22 }}>🎮</Text></View>}
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={2}>{game.title}</Text>
        <Text style={s.meta} numberOfLines={1}>{game.platform}{game.release_year ? ` · ${game.release_year}` : ''}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {game.is_essential ? <Text style={[s.tag, { color: colors.gold }]}>ESENCIAL</Text> : null}
          {game.is_gem ? <Text style={[s.tag, { color: colors.cyan }]}>JOYA</Text> : null}
        </View>
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  rank: { width: 26, textAlign: 'center', color: colors.dim, fontFamily: fonts.pixel, fontSize: 10 },
  cover: { width: 56, height: 74, borderRadius: 8, backgroundColor: colors.elevated },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  tag: { fontFamily: fonts.pixel, fontSize: 7 },
});
