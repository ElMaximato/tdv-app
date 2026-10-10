import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Address, cancelOrder, createOrder, fetchAddresses, Order } from '../api/shop';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { cardStyle, Row } from '../components/shop';
import { ExpiryText } from '../components/Countdown';
import { EmptyState } from '../components/states';
import { Button, Center, ErrorText } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { UserCancelled } from '../payments/biometrics';
import { payExistingOrder } from '../payments/payFlow';
import { colors } from '../theme';
import { formatMoney, shippingFor } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items, subtotalCents, clear } = useCart();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Si la persona cierra la hoja de pago, el pedido ya existe: se reutiliza en el siguiente intento.
  const [pending, setPending] = useState<{ order: Order; addressId: number } | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      const list = await fetchAddresses();
      setAddresses(list);
      setAddressId(prev => (prev && list.some(a => a.id === prev) ? prev : list[0]?.id ?? null));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar tus direcciones'); setAddresses([]); }
  }, []);

  // Se recarga al volver de "Agregar dirección".
  useEffect(() => {
    if (!user) return;
    loadAddresses();
    return navigation.addListener('focus', loadAddresses);
  }, [navigation, loadAddresses, user]);

  if (!user) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState emoji="🔒" title="Inicia sesión para pagar" message="Así guardamos tus pedidos y direcciones." actionLabel="Iniciar sesión" onAction={() => navigation.navigate('Login')} /></View>;
  if (items.length === 0 && !pending) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState emoji="🛒" title="Tu carrito está vacío" message="Agrega algo de la tienda para continuar." actionLabel="Ir a la tienda" onAction={() => navigation.popToTop()} tone={colors.gold} /></View>;
  if (!addresses) return <Center><ActivityIndicator color={colors.red} /></Center>;

  const shipping = shippingFor(subtotalCents);
  const total = pending ? pending.order.total_cents : subtotalCents + shipping;

  async function pay() {
    if (!addressId) { setError('Elige o agrega una dirección de envío'); return; }
    setError(null); setBusy(true);
    try {
      let order = pending?.order ?? null;
      // Si cambió la dirección después de crear el pedido, se cancela el anterior y se crea uno nuevo.
      if (pending && pending.addressId !== addressId) {
        await cancelOrder(pending.order.id).catch(() => {});
        order = null; setPending(null);
      }
      if (!order) {
        order = await createOrder(items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })), addressId);
        setPending({ order, addressId });
      }
      const result = await payExistingOrder(order.id);
      if (result === 'canceled') { setError(`Pago cancelado. Tu pedido ${order.public_code} sigue pendiente; puedes intentarlo de nuevo.`); return; }
      clear();
      navigation.replace('OrderDetail', { id: order.id, justPaid: true });
    } catch (err) {
      if (err instanceof UserCancelled) return;
      setError(err instanceof Error ? err.message : 'No se pudo completar el pago');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {pending ? (
          <View style={[cardStyle, { borderColor: colors.gold, marginBottom: 14 }]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Pedido {pending.order.public_code}</Text>
            <ExpiryText seconds={pending.order.expires_in_seconds} style={{ marginTop: 4 }} prefix="⏳ Tu pedido se cancela en " />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>ENVIAR A</Text>
          {addresses.length > 0 ? <Pressable onPress={() => navigation.navigate('Addresses')} hitSlop={8}><Text style={{ color: colors.gold, fontSize: 13, fontWeight: '700' }}>Administrar</Text></Pressable> : null}
        </View>
        {addresses.map(a => {
          const sel = a.id === addressId;
          return (
            <Pressable key={a.id} onPress={() => setAddressId(a.id)} style={[cardStyle, { marginBottom: 10 }, sel && { borderColor: colors.red }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{sel ? '● ' : '○ '}{a.full_name}{a.is_default ? '  ★' : ''}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
              <Text style={{ color: colors.muted }}>{a.city}, {a.state} · CP {a.postal_code}</Text>
            </Pressable>
          );
        })}
        <Button title={addresses.length ? '+ Agregar otra dirección' : '+ Agregar dirección'} variant="ghost" onPress={() => navigation.navigate('AddressForm', {})} style={{ marginBottom: 20 }} />

        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>RESUMEN</Text>
        <View style={cardStyle}>
          {(pending ? pending.order.items.map(i => ({ key: String(i.id), name: i.product_name, label: i.variant_label, qty: i.quantity, cents: i.unit_price_cents * i.quantity }))
            : items.map(i => ({ key: String(i.variantId), name: i.productName, label: i.variantLabel, qty: i.quantity, cents: i.unitPriceCents * i.quantity }))
          ).map(l => (
            <Row key={l.key} label={`${l.qty} × ${l.name}${l.label && l.label !== 'Única' ? ` (${l.label})` : ''}`} value={formatMoney(l.cents)} />
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row label="Envío" value={(pending ? pending.order.shipping_cents : shipping) === 0 ? 'Gratis' : formatMoney(pending ? pending.order.shipping_cents : shipping)} />
          <Row label="Total" value={formatMoney(total)} bold />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          Al pagar te pediremos tu huella, rostro o PIN. Para probar usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier CVC.
        </Text>
        <View style={{ height: 14 }} />
        <ErrorText message={error} />
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <Button title={`Pagar ${formatMoney(total)}`} onPress={pay} loading={busy} disabled={!addressId} />
      </View>
    </View>
  );
}
