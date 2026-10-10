import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { cancelOrder, fetchOrder, Order } from '../api/shop';
import { cardStyle, Row } from '../components/shop';
import { ExpiryText } from '../components/Countdown';
import { FullError } from '../components/states';
import { Button, Center, ErrorText } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { UserCancelled } from '../payments/biometrics';
import { payExistingOrder } from '../payments/payFlow';
import { colors, fonts } from '../theme';
import { formatDate, formatMoney, ORDER_STATUS } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen({ route }: Props) {
  const { id, justPaid } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setOrder(await fetchOrder(id)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido'); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function payNow() {
    setBusy(true); setError(null);
    try {
      const r = await payExistingOrder(id);
      if (r === 'canceled') setError('Pago cancelado. El pedido sigue pendiente.');
      await load();
    } catch (err) {
      if (!(err instanceof UserCancelled)) setError(err instanceof Error ? err.message : 'No se pudo completar el pago');
      await load();
    } finally { setBusy(false); }
  }

  function askCancel() {
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          setBusy(true); setError(null);
          try { await cancelOrder(id); await load(); }
          catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cancelar'); await load(); }
          finally { setBusy(false); }
        },
      },
    ]);
  }

  if (!order && error) return <FullError message={error} onRetry={load} />;
  if (!order) return <Center><ActivityIndicator color={colors.red} /></Center>;

  const st = ORDER_STATUS[order.status] ?? { label: order.status, color: colors.muted };
  const paid = ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {justPaid && paid ? (
        <View style={[cardStyle, { borderColor: colors.green, alignItems: 'center' }]}>
          <Text style={{ fontSize: 40 }}>🎉</Text>
          <Text style={{ color: colors.green, fontSize: 18, fontWeight: '800', marginTop: 6 }}>¡Pago recibido!</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6 }}>Te avisaremos cuando tu pedido cambie de estado.</Text>
        </View>
      ) : null}

      <View style={cardStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Pedido {order.public_code}</Text>
          <Text style={{ color: st.color, fontFamily: fonts.pixel, fontSize: 9 }}>{st.label.toUpperCase()}</Text>
        </View>
        <Text style={{ color: colors.muted, marginTop: 6 }}>{formatDate(order.created_at)}</Text>
        {order.tracking_number ? <Text style={{ color: colors.cyan, marginTop: 8 }}>Guía de envío: {order.tracking_number}</Text> : null}
      </View>

      <View style={cardStyle}>
        {order.items.map(i => (
          <Row key={i.id} label={`${i.quantity} × ${i.product_name}${i.variant_label && i.variant_label !== 'Única' ? ` (${i.variant_label})` : ''}`} value={formatMoney(i.unit_price_cents * i.quantity)} />
        ))}
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
        <Row label="Subtotal" value={formatMoney(order.subtotal_cents)} />
        <Row label="Envío" value={order.shipping_cents === 0 ? 'Gratis' : formatMoney(order.shipping_cents)} />
        <Row label="Total" value={formatMoney(order.total_cents)} bold />
      </View>

      <View style={cardStyle}>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>ENVÍO A</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{order.ship_full_name}</Text>
        <Text style={{ color: colors.muted, marginTop: 2 }}>{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ''}</Text>
        <Text style={{ color: colors.muted }}>{order.ship_city}, {order.ship_state} · CP {order.ship_postal_code}</Text>
      </View>

      <ErrorText message={error} />
      {order.status === 'pending_payment' ? (
        <>
          <View style={[cardStyle, { borderColor: colors.gold, alignItems: 'center' }]}>
            <ExpiryText seconds={order.expires_in_seconds} onExpire={load} style={{ fontSize: 17 }} prefix="⏳ Este pedido se cancela en " />
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>Págalo antes de que termine el tiempo para no perder tus productos.</Text>
          </View>
          <Button title={`Pagar ${formatMoney(order.total_cents)}`} onPress={payNow} loading={busy} />
          <Button title="Cancelar pedido" variant="ghost" onPress={askCancel} disabled={busy} style={{ marginTop: 12 }} />
        </>
      ) : null}
    </ScrollView>
  );
}
