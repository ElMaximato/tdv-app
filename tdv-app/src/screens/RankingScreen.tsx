import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { fetchGames, fetchGenres, fetchPlatforms, type Genre } from '../api/games';
import { Dropdown, type Option } from '../components/Dropdown';
import { GameTile } from '../components/GameTile';
import { ShakeRoulette } from '../components/ShakeRoulette';
import { EmptyState, ErrorState } from '../components/states';
import { PixelTitle } from '../components/ui';
import { useFavorites } from '../favorites/FavoritesContext';
import { useAuth } from '../auth/AuthContext';
import { useShake } from '../hooks/useShake';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, radius } from '../theme';
import type { Platform, RankedGame } from '../types';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParamList, 'Ranking'>, NativeStackScreenProps<RootStackParamList>>;

const PAGE_SIZE = 20;
const GAP = 12;
const PAD = 16;

// Orden del ranking. La nota de la gente es APARTE de la de Emilio.
const SORTS: (Option & { sort: string; order: 'asc' | 'desc'; ranked: boolean })[] = [
  { value: 'emilio', label: 'Nota de Emilio', sort: 'emilio_score', order: 'desc', ranked: true },
  { value: 'gente', label: 'Nota de la gente', sort: 'community_avg', order: 'desc', ranked: true },
  { value: 'nuevos', label: 'Año (más nuevos)', sort: 'release_year', order: 'desc', ranked: false },
  { value: 'antiguos', label: 'Año (más antiguos)', sort: 'release_year', order: 'asc', ranked: false },
  { value: 'az', label: 'Nombre (A-Z)', sort: 'title', order: 'asc', ranked: false },
];

export default function RankingScreen({ navigation }: Props) {
  const { user } = useAuth();
  const fav = useFavorites();
  const { width } = useWindowDimensions();
  const tileW = Math.floor((width - PAD * 2 - GAP) / 2);

  const [games, setGames] = useState<RankedGame[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [sortKey, setSortKey] = useState('emilio');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roulette, setRoulette] = useState<{ open: boolean; winner: RankedGame | null }>({ open: false, winner: null });
  const focused = useIsFocused();
  const reqId = useRef(0);

  const sortCfg = SORTS.find(o => o.value === sortKey) ?? SORTS[0];

  useEffect(() => {
    fetchPlatforms().then(setPlatforms).catch(() => {});
    fetchGenres().then(setGenres).catch(() => {});
  }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(query.trim()), 400); return () => clearTimeout(t); }, [query]);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    const id = ++reqId.current;
    setError(null);
    if (nextPage === 1 && !replace) setLoading(true);
    try {
      const res = await fetchGames({ page: nextPage, limit: PAGE_SIZE, platform, genre, q: search, sort: sortCfg.sort, order: sortCfg.order });
      if (id !== reqId.current) return;
      setGames(prev => (nextPage === 1 ? res.data : [...prev, ...res.data]));
      setPage(nextPage); setPages(res.meta.pages); setTotal(res.meta.total);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el ranking');
    } finally {
      if (id === reqId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [platform, genre, search, sortCfg.sort, sortCfg.order]);

  useEffect(() => { setLoading(true); load(1, false); }, [load]);
  const onEnd = () => { if (!loading && !refreshing && page < pages) load(page + 1, false); };

  const surprise = useCallback(() => {
    if (games.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setRoulette({ open: true, winner: games[Math.floor(Math.random() * games.length)] });
  }, [games]);
  useShake(surprise, focused && !roulette.open);

  async function onHeart(g: RankedGame) {
    const ok = await fav.toggle(g.id);
    if (!ok) navigation.navigate('Login');
  }

  const filtersOn = platform !== '' || genre !== '' || sortKey !== 'emilio' || search !== '';
  const clearAll = () => { setPlatform(''); setGenre(''); setSortKey('emilio'); setQuery(''); };

  const platformOpts = useMemo<Option[]>(() => [{ value: '', label: 'Todas' }, ...platforms.map(p => ({ value: p.slug, label: p.name }))], [platforms]);
  const genreOpts = useMemo<Option[]>(() => [{ value: '', label: 'Todos' }, ...genres.map(g => ({ value: g.slug, label: g.name }))], [genres]);

  const header = (
    <View style={{ paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PixelTitle size={13} color={colors.red}>RANKING</PixelTitle>
        <Pressable onPress={surprise} style={s.dice} hitSlop={8}><Text style={{ fontSize: 18 }}>🎲</Text></Pressable>
      </View>
      <Text style={{ color: colors.dim, fontSize: 12, marginTop: 6 }}>Agita tu celular para un juego sorpresa</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Buscar juego…" placeholderTextColor={colors.dim} style={s.search} maxLength={80} autoCapitalize="none" clearButtonMode="while-editing" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Dropdown label="ORDENAR" value={sortKey} options={SORTS} onChange={setSortKey} />
        <Dropdown label="CONSOLA" value={platform} options={platformOpts} onChange={setPlatform} />
        <Dropdown label="GÉNERO" value={genre} options={genreOpts} onChange={setGenre} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, minHeight: 20 }}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{loading ? ' ' : `${total} ${total === 1 ? 'juego' : 'juegos'}`}</Text>
        {filtersOn ? <Pressable onPress={clearAll} hitSlop={8}><Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>Limpiar filtros ✕</Text></Pressable> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {error && games.length === 0 ? (
        <View style={{ paddingHorizontal: PAD }}>{header}<ErrorState message={error} onRetry={() => load(1, false)} /></View>
      ) : (
        <FlatList
          data={games}
          numColumns={2}
          keyExtractor={g => String(g.id)}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 28 }}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => (
            <GameTile
              game={item}
              width={tileW}
              rank={sortCfg.ranked ? index + 1 : undefined}
              favorite={fav.isFavorite(item.id)}
              onToggleFavorite={() => onHeart(item)}
              onPress={() => navigation.navigate('GameDetail', { slug: item.slug, title: item.title })}
            />
          )}
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(1, true); }} />}
          ListEmptyComponent={loading ? <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} /> : (
            <EmptyState
              emoji="🔍"
              title="No encontramos juegos"
              message={sortKey === 'gente' ? 'Todavía nadie ha calificado juegos con estos filtros. ¡Sé el primero en votar!' : 'Prueba con otra búsqueda o quita algunos filtros.'}
              actionLabel={filtersOn ? 'Limpiar filtros' : undefined}
              onAction={filtersOn ? clearAll : undefined}
              tone={colors.cyan}
            />
          )}
          ListFooterComponent={page < pages && games.length > 0 ? <ActivityIndicator color={colors.muted} style={{ marginVertical: 16 }} /> : undefined}
        />
      )}
      <ShakeRoulette
        visible={roulette.open}
        games={games}
        winner={roulette.winner}
        onClose={() => setRoulette(r => ({ ...r, open: false }))}
        onAgain={() => setRoulette({ open: true, winner: games[Math.floor(Math.random() * games.length)] })}
        onOpen={g => { setRoulette(r => ({ ...r, open: false })); navigation.navigate('GameDetail', { slug: g.slug, title: g.title }); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  dice: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  search: { height: 46, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, fontSize: 15, marginVertical: 12 },
});
