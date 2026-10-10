import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, useWindowDimensions, View } from 'react-native';

import { fetchFavorites } from '../api/games';
import { useAuth } from '../auth/AuthContext';
import { GameTile } from '../components/GameTile';
import { EmptyState, FullError } from '../components/states';
import { useFavorites } from '../favorites/FavoritesContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { RankedGame } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;
const GAP = 12, PAD = 16;

export default function FavoritesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const fav = useFavorites();
  const { width } = useWindowDimensions();
  const tileW = Math.floor((width - PAD * 2 - GAP) / 2);
  const [games, setGames] = useState<RankedGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setGames(await fetchFavorites()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar tus favoritos'); }
    finally { setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { if (user) load(); }, [load, user]));

  if (!user) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState emoji="🔒" title="Inicia sesión" message="Guarda los juegos que quieres jugar y encuéntralos aquí." actionLabel="Iniciar sesión" onAction={() => navigation.navigate('Login')} /></View>;
  if (error && !games) return <FullError message={error} onRetry={load} />;
  if (!games) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={games}
      numColumns={2}
      keyExtractor={g => String(g.id)}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 32, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<EmptyState emoji="💔" title="Aún no tienes favoritos" message="Toca el corazón de cualquier juego del ranking para guardarlo en tu lista de «quiero jugarlo»." actionLabel="Explorar el ranking" onAction={() => navigation.popToTop()} />}
      renderItem={({ item }) => (
        <GameTile
          game={item}
          width={tileW}
          favorite={fav.isFavorite(item.id)}
          onToggleFavorite={() => { fav.toggle(item.id); setGames(prev => prev && prev.filter(g => g.id !== item.id)); }}
          onPress={() => navigation.navigate('GameDetail', { slug: item.slug, title: item.title })}
        />
      )}
    />
  );
}
