import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchTop5, saveTop5, type Top5Item } from '../api/profile';
import { coverUrl } from '../components/GameCard';
import { GamePicker } from '../components/GamePicker';
import { FullError } from '../components/states';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts, radius } from '../theme';
import type { RankedGame } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Top5'>;

const MEDAL = ['🥇', '🥈', '🥉', '4', '5'];

// Mi Top 5: 5 lugares. Se guarda solo cada vez que cambias algo.
export default function Top5Screen({ navigation }: Props) {
  const [items, setItems] = useState<Top5Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await fetchTop5()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar tu Top 5'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function persist(next: Top5Item[], previous: Top5Item[]) {
    const renum = next.map((it, i) => ({ ...it, position: i + 1 }));
    setItems(renum); setSaving(true);
    try { await saveTop5(renum.map(i => i.game_id)); }
    catch (err) { setItems(previous); Alert.alert('No se pudo guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo'); }
    finally { setSaving(false); }
  }

  if (error && !items) return <FullError message={error} onRetry={load} />;
  if (!items) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;

  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]];
    persist(next, items);
  };
  const remove = (i: number) => persist(items.filter((_, k) => k !== i), items);
  const add = (g: RankedGame) => {
    setPicker(false);
    if (items.length >= 5 || items.some(x => x.game_id === g.id)) return;
    persist([...items, { position: items.length + 1, game_id: g.id, title: g.title, slug: g.slug, cover_image: g.cover_image, release_year: g.release_year, platform: g.platform }], items);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 }}>Tus cinco juegos favoritos de todos los tiempos, en orden. Usa las flechas para cambiar el lugar.</Text>

      {[0, 1, 2, 3, 4].map(i => {
        const it = items[i];
        if (!it) {
          return (
            <Pressable key={i} onPress={() => setPicker(true)} disabled={i !== items.length} style={[s.slot, s.empty, i !== items.length && { opacity: 0.4 }]}>
              <Text style={s.medal}>{MEDAL[i]}</Text>
              <Text style={{ color: colors.muted, fontWeight: '700', flex: 1 }}>{i === items.length ? '＋ Agregar juego' : 'Lugar libre'}</Text>
            </Pressable>
          );
        }
        const img = coverUrl(it.cover_image);
        return (
          <View key={it.game_id} style={[s.slot, i === 0 && { borderColor: colors.gold }]}>
            <Text style={s.medal}>{MEDAL[i]}</Text>
            <Pressable onPress={() => navigation.navigate('GameDetail', { slug: it.slug, title: it.title })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              {img ? <Image source={{ uri: img }} style={s.thumb} /> : <View style={[s.thumb, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 22 }}>🎮</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }} numberOfLines={2}>{it.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{it.platform}{it.release_year ? ` · ${it.release_year}` : ''}</Text>
              </View>
            </Pressable>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Pressable onPress={() => move(i, -1)} disabled={i === 0} hitSlop={6} style={[s.btn, i === 0 && { opacity: 0.25 }]}><Text style={s.btnTxt}>▲</Text></Pressable>
              <Pressable onPress={() => move(i, 1)} disabled={i === items.length - 1} hitSlop={6} style={[s.btn, i === items.length - 1 && { opacity: 0.25 }]}><Text style={s.btnTxt}>▼</Text></Pressable>
            </View>
            <Pressable onPress={() => remove(i)} hitSlop={8} style={s.x}><Text style={{ color: colors.red, fontSize: 16, fontWeight: '800' }}>✕</Text></Pressable>
          </View>
        );
      })}
      <Text style={{ color: colors.dim, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{saving ? 'Guardando…' : 'Se guarda automáticamente'}</Text>

      <GamePicker visible={picker} title="Agregar a tu Top 5" excludeIds={items.map(i => i.game_id)} onClose={() => setPicker(false)} onPick={add} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10, minHeight: 84 },
  empty: { borderStyle: 'dashed', borderColor: colors.dim },
  medal: { width: 30, textAlign: 'center', fontSize: 22, color: colors.gold, fontFamily: fonts.pixel },
  thumb: { width: 48, height: 64, borderRadius: 8, backgroundColor: colors.elevated },
  btn: { width: 30, height: 28, borderRadius: 8, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: colors.text, fontSize: 11 },
  x: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
});
