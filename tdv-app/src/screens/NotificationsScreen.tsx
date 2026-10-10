import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { AppNotification, fetchNotifications, markAllRead, markRead } from '../api/notifications';
import { EmptyState, FullError } from '../components/states';
import { Button } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';
import { formatDate } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const ICON: Record<string, string> = { order_status: '📦', order: '📦', payment: '💳', shipping: '🚚', game: '🎮', general: '🔔' };

function parseData(d: AppNotification['data']): Record<string, any> {
  if (!d) return {};
  if (typeof d === 'object') return d;
  try { return JSON.parse(d); } catch { return {}; }
}

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetchNotifications();
      setItems(r.items); setUnread(r.unread_count); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar tus avisos'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function open(n: AppNotification) {
    if (!n.read_at) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      setUnread(u => Math.max(0, u - 1));
      markRead(n.id).catch(() => {});
    }
    const d = parseData(n.data);
    const orderId = Number(d.orderId ?? d.order_id);
    if (orderId) navigation.navigate('OrderDetail', { id: orderId });
  }

  async function readAll() {
    setItems(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    setUnread(0);
    markAllRead().catch(() => {});
  }

  if (loading) return <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />;
  if (error && items.length === 0) return <FullError message={error} onRetry={load} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={items}
      keyExtractor={n => String(n.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={unread > 0 ? <Button title={`Marcar ${unread} como leídos`} variant="ghost" onPress={readAll} style={{ marginBottom: 14 }} /> : null}
      ListEmptyComponent={<EmptyState emoji="🔔" title="Todo en calma" message="Aquí verás el estado de tus pedidos y las novedades del canal." tone={colors.cyan} />}
      renderItem={({ item }) => {
        const isNew = !item.read_at;
        return (
          <Pressable onPress={() => open(item)} style={({ pressed }) => [{ flexDirection: 'row', gap: 12, backgroundColor: isNew ? colors.elevated : colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isNew ? colors.gold : colors.border }, pressed && { opacity: 0.85 }]}>
            <Text style={{ fontSize: 24 }}>{ICON[item.type] ?? ICON.general}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: isNew ? '800' : '600', fontSize: 15 }}>{item.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 3, fontSize: 14 }}>{item.body}</Text>
              <Text style={{ color: colors.dim, marginTop: 6, fontSize: 12 }}>{formatDate(item.created_at)}</Text>
            </View>
            {isNew ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red, marginTop: 4 }} /> : null}
          </Pressable>
        );
      }}
    />
  );
}
