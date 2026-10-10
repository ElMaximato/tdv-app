import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { fetchOrders, OrderSummary } from '../api/shop';
import { useAuth } from '../auth/AuthContext';
import { cardStyle } from '../components/shop';
import { ExpiryText } from '../components/Countdown';
import { EmptyState, FullError } from '../components/states';
import { Center } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';
import { formatDate, formatMoney, ORDER_STATUS } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

export default function OrdersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try { setOrders(await fetchOrders()); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar tus pedidos'); setOrders([]); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    return navigation.addListener('focus', load);      // se actualiza al volver de un pedido
  }, [navigation, load, user]);

  if (!user) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState emoji="🔒" title="Inicia sesión" message="Para ver tus pedidos primero entra a tu cuenta." actionLabel="Iniciar sesión" onAction={() => navigation.navigate('Login')} /></View>;
  if (!orders) return <Center><ActivityIndicator color={colors.red} /></Center>;
  if (error && orders.length === 0) return <FullError message={error} onRetry={load} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={orders}
      keyExtractor={o => String(o.id)}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<EmptyState emoji="📦" title="Aún no tienes pedidos" message="Cuando compres algo de la tienda lo verás aquí, con su estado y su código de seguimiento." actionLabel="Ver la tienda" onAction={() => navigation.popToTop()} tone={colors.gold} />}
      renderItem={({ item }) => {
        const st = ORDER_STATUS[item.status] ?? { label: item.status, color: colors.muted };
        return (
          <Pressable style={({ pressed }) => [cardStyle, { marginBottom: 10 }, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Pedido {item.public_code}</Text>
              <Text style={{ color: st.color, fontFamily: fonts.pixel, fontSize: 8 }}>{st.label.toUpperCase()}</Text>
            </View>
            <Text style={{ color: colors.muted, marginTop: 6 }}>{formatDate(item.created_at)} · {Number(item.item_count)} {Number(item.item_count) === 1 ? 'pieza' : 'piezas'}</Text>
            <Text style={{ color: colors.gold, fontWeight: '700', marginTop: 6 }}>{formatMoney(item.total_cents)}</Text>
            {item.status === 'pending_payment' ? <ExpiryText seconds={item.expires_in_seconds} onExpire={load} style={{ marginTop: 8 }} /> : null}
          </Pressable>
        );
      }}
    />
  );
}
