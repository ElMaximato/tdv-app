import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { coverUrl } from './GameCard';
import { colors, fonts, radius, scoreColor } from '../theme';
import { RankedGame, toNum } from '../types';

// Tarjeta de cuadrícula (2 por fila): portada grande, nombre, y las DOS notas separadas (Emilio / Gente).
export function GameTile({ game, width, rank, favorite, onPress, onToggleFavorite }: {
  game: RankedGame; width: number; rank?: number; favorite: boolean; onPress: () => void; onToggleFavorite: () => void;
}) {
  const img = coverUrl(game.cover_image);
  const emilio = toNum(game.emilio_score);
  const gente = toNum(game.community_avg);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, { width }, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}>
      <View>
        {img ? <Image source={{ uri: img }} style={[s.cover, { height: width * 1.3 }]} resizeMode="cover" />
             : <View style={[s.cover, s.noCover, { height: width * 1.3 }]}><Text style={{ fontSize: 40 }}>🎮</Text></View>}
        {rank ? <View style={s.rank}><Text style={s.rankTxt}>{rank}</Text></View> : null}
        <Pressable onPress={onToggleFavorite} style={s.heart} hitSlop={8}>
          <Text style={{ fontSize: 17 }}>{favorite ? '❤️' : '🤍'}</Text>
        </Pressable>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.title} numberOfLines={2}>{game.title}</Text>
        <Text style={s.meta} numberOfLines={1}>{game.platform}{game.release_year ? ` · ${game.release_year}` : ''}</Text>
        <View style={s.scores}>
          <Score label="EMILIO" value={emilio} />
          <View style={s.sep} />
          <Score label="GENTE" value={gente} />
        </View>
      </View>
    </Pressable>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: scoreColor(value), fontFamily: fonts.pixel, fontSize: 13 }}>{value == null ? '--' : Math.round(value)}</Text>
      <Text style={{ color: colors.dim, fontFamily: fonts.pixel, fontSize: 6, marginTop: 5 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12 },
  cover: { width: '100%', backgroundColor: colors.elevated },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  rank: { position: 'absolute', top: 8, left: 8, minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: 'rgba(5,5,12,0.78)', alignItems: 'center', justifyContent: 'center' },
  rankTxt: { color: colors.gold, fontFamily: fonts.pixel, fontSize: 9 },
  heart: { position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(5,5,12,0.62)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 14, fontWeight: '800', minHeight: 36 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  scores: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  sep: { width: 1, height: 22, backgroundColor: colors.border },
});
