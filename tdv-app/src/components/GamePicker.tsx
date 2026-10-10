import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchGames } from '../api/games';
import { coverUrl } from './GameCard';
import { EmptyState } from './states';
import { colors, radius } from '../theme';
import type { RankedGame } from '../types';

// Ventana para buscar un juego y elegirlo (se usa en el Top 5 y en "juego favorito").
export function GamePicker({ visible, title = 'Elige un juego', excludeIds = [], onClose, onPick }: {
  visible: boolean; title?: string; excludeIds?: number[]; onClose: () => void; onPick: (g: RankedGame) => void;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<RankedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const req = useRef(0);

  useEffect(() => {
    if (!visible) { setQ(''); return; }
    const id = ++req.current;
    setLoading(true); setError(false);
    const t = setTimeout(() => {
      fetchGames({ q: q.trim(), limit: 30, sort: q.trim() ? 'emilio_score' : 'emilio_score', order: 'desc' })
        .then(r => { if (id === req.current) setRows(r.data); })
        .catch(() => { if (id === req.current) setError(true); })
        .finally(() => { if (id === req.current) setLoading(false); });
    }, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [visible, q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={{ color: colors.gold, fontWeight: '800', fontSize: 15 }}>Cerrar</Text></Pressable>
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder="Buscar juego…" placeholderTextColor={colors.dim} style={s.search} maxLength={80} autoCapitalize="none" autoFocus={false} />
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.red} style={{ marginTop: 30 }} /> : (
          <FlatList
            data={rows.filter(r => !excludeIds.includes(r.id))}
            keyExtractor={g => String(g.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
            ListEmptyComponent={<EmptyState emoji={error ? '📡' : '🔍'} title={error ? 'No se pudo buscar' : 'Sin resultados'} message={error ? 'Revisa tu conexión con el servidor.' : 'Prueba con otro nombre.'} tone={colors.cyan} />}
            renderItem={({ item }) => {
              const img = coverUrl(item.cover_image);
              return (
                <Pressable onPress={() => onPick(item)} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
                  {img ? <Image source={{ uri: img }} style={s.thumb} /> : <View style={[s.thumb, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 20 }}>🎮</Text></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }} numberOfLines={2}>{item.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{item.platform}{item.release_year ? ` · ${item.release_year}` : ''}</Text>
                  </View>
                  <Text style={{ color: colors.gold, fontSize: 22 }}>＋</Text>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  search: { height: 46, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, fontSize: 15, margin: 16, marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10 },
  thumb: { width: 46, height: 62, borderRadius: 8, backgroundColor: colors.elevated },
});
