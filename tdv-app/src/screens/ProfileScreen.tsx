import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchUnreadCount } from '../api/notifications';
import { fetchProfile, type Profile } from '../api/profile';
import { useAuth } from '../auth/AuthContext';
import { coverUrl } from '../components/GameCard';
import Avatar from '../components/Avatar';
import { Button, PixelTitle } from '../components/ui';
import { useFavorites } from '../favorites/FavoritesContext';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, fonts, radius } from '../theme';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParamList, 'Perfil'>, NativeStackScreenProps<RootStackParamList>>;

const memberSince = (iso: string | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { count: favCount } = useFavorites();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    fetchProfile().then(setProfile).catch(() => {});
    fetchUnreadCount().then(r => setUnread(r.unread_count)).catch(() => {});
    setRefreshing(false);
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }} edges={['top']}>
        <PixelTitle size={13} color={colors.red}>PERFIL</PixelTitle>
        <View style={{ marginTop: 40 }}>
          <Text style={{ color: colors.muted, fontSize: 16, marginBottom: 20 }}>Inicia sesión para votar, comprar en la tienda y recibir notificaciones.</Text>
          <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
          <Button title="Crear cuenta" variant="ghost" onPress={() => navigation.navigate('Register')} style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  const p = profile;
  const top5 = p?.top5 ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}>
        <PixelTitle size={13} color={colors.red}>PERFIL</PixelTitle>

        {/* Tarjeta principal */}
        <View style={s.hero}>
          <View style={s.avatar}><Avatar id={p?.avatar_id ?? user.avatar_id} size={82} /></View>
          <Text style={s.name}>{user.username}</Text>
          {user.role !== 'member' ? <Text style={s.role}>{user.role === 'admin' ? 'ADMIN' : 'EDITOR'}</Text> : null}
          <Text style={s.since}>{user.email}{p?.created_at ? ` · desde ${memberSince(p.created_at)}` : ''}</Text>
          <Text style={[s.bio, !p?.bio && { color: colors.dim, fontStyle: 'italic' }]}>{p?.bio || 'Aún no escribes tu bio. ¡Cuéntanos qué juegas!'}</Text>
          <Button title="✏️ Editar perfil" variant="ghost" onPress={() => navigation.navigate('EditProfile')} style={{ marginTop: 14, alignSelf: 'stretch' }} />
        </View>

        {/* Números */}
        <View style={s.stats}>
          <Stat n={p?.stats.vote_count ?? 0} label="CALIFICACIONES" />
          <View style={s.sep} />
          <Stat n={favCount} label="FAVORITOS" />
          <View style={s.sep} />
          <Stat n={top5.length} label="EN MI TOP 5" />
        </View>

        {/* Mi Top 5 */}
        <View style={s.sectionHead}>
          <Text style={s.h}>MI TOP 5</Text>
          <Pressable onPress={() => navigation.navigate('Top5')} hitSlop={8}><Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>{top5.length ? 'Editar' : 'Armar'}</Text></Pressable>
        </View>
        {top5.length === 0 ? (
          <Pressable onPress={() => navigation.navigate('Top5')} style={s.top5Empty}>
            <Text style={{ fontSize: 30 }}>🏆</Text>
            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>Elige tus 5 juegos favoritos de todos los tiempos.</Text>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {top5.map(g => {
              const img = coverUrl(g.cover_image);
              return (
                <Pressable key={g.game_id} onPress={() => navigation.navigate('GameDetail', { slug: g.slug, title: g.title })} style={s.top5Card}>
                  {img ? <Image source={{ uri: img }} style={s.top5Img} resizeMode="cover" /> : <View style={[s.top5Img, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 30 }}>🎮</Text></View>}
                  <View style={s.pos}><Text style={{ color: colors.gold, fontFamily: fonts.pixel, fontSize: 9 }}>{g.position}</Text></View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 6 }} numberOfLines={2}>{g.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Favoritos de siempre */}
        {(p?.fav_console_data || p?.fav_game_data) ? (
          <View style={[s.card, { marginTop: 18 }]}>
            {p?.fav_console_data ? <Line label="CONSOLA FAVORITA" value={`🎮  ${p.fav_console_data.name}`} /> : null}
            {p?.fav_game_data ? <Line label="JUEGO FAVORITO" value={`⭐  ${p.fav_game_data.title}`} onPress={() => navigation.navigate('GameDetail', { slug: p.fav_game_data!.slug, title: p.fav_game_data!.title })} /> : null}
          </View>
        ) : null}

        {/* Atajos */}
        <View style={{ marginTop: 18, gap: 10 }}>
          <Menu icon="❤️" title="Mis favoritos" sub={favCount ? `${favCount} ${favCount === 1 ? 'juego' : 'juegos'}` : 'Juegos que quieres jugar'} onPress={() => navigation.navigate('Favorites')} />
          <Menu icon="📦" title="Mis pedidos" sub="Estado y código de seguimiento" onPress={() => navigation.navigate('Orders')} />
          <Menu icon="📍" title="Mis direcciones" sub="Editar y elegir la principal" onPress={() => navigation.navigate('Addresses')} />
          <Menu icon="🔔" title="Avisos" sub={unread > 0 ? `${unread} ${unread === 1 ? 'nuevo' : 'nuevos'}` : 'Notificaciones'} badge={unread} onPress={() => navigation.navigate('Notifications')} />
        </View>
        <Button title="Cerrar sesión" variant="ghost" onPress={logout} style={{ marginTop: 22 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: colors.gold, fontFamily: fonts.pixel, fontSize: 18 }}>{n}</Text>
      <Text style={{ color: colors.dim, fontFamily: fonts.pixel, fontSize: 6, marginTop: 8, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
function Line({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ paddingVertical: 6 }}>
      <Text style={{ color: colors.dim, fontFamily: fonts.pixel, fontSize: 6 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 6 }}>{value}</Text>
    </Pressable>
  );
}
function Menu({ icon, title, sub, badge, onPress }: { icon: string; title: string; sub: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.menu, pressed && { opacity: 0.85 }]}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>
      </View>
      {badge ? <View style={s.badge}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{badge}</Text></View> : null}
      <Text style={{ color: colors.dim, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', marginTop: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', backgroundColor: colors.elevated, borderWidth: 3, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 12 },
  role: { color: colors.red, fontFamily: fonts.pixel, fontSize: 7, marginTop: 6, borderWidth: 1, borderColor: colors.red, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  since: { color: colors.muted, fontSize: 12, marginTop: 6, textAlign: 'center' },
  bio: { color: colors.text, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 18, marginTop: 14 },
  sep: { width: 1, height: 30, backgroundColor: colors.border },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  h: { color: colors.red, fontFamily: fonts.pixel, fontSize: 10 },
  top5Empty: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dim, borderStyle: 'dashed', padding: 22, alignItems: 'center' },
  top5Card: { width: 104 },
  top5Img: { width: 104, height: 140, borderRadius: radius.md, backgroundColor: colors.elevated },
  pos: { position: 'absolute', top: 6, left: 6, minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, backgroundColor: 'rgba(5,5,12,0.8)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 },
  menu: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
