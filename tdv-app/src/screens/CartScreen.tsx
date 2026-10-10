import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { cardStyle, ProductImage, QtyStepper, Row } from '../components/shop';
import { EmptyState } from '../components/states';
import { Button } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { formatMoney, FREE_SHIPPING_FROM_CENTS, shippingFor } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items, subtotalCents, setQuantity, remove } = useCart();
  const shipping = shippingFor(subtotalCents);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <EmptyState emoji="🛒" title="Tu carrito está vacío" message="Explora la merch de Emilio y agrega tus favoritos." actionLabel="Ir a la tienda" onAction={() => navigation.popToTop()} tone={colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.variantId)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[cardStyle, { flexDirection: 'row', gap: 12, padding: 12 }]}>
            <ProductImage image={item.image} style={{ width: 72, height: 72, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }} numberOfLines={2}>{item.productName}</Text>
              {item.variantLabel !== 'Única' ? <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Talla {item.variantLabel}</Text> : null}
              <Text style={{ color: colors.gold, marginTop: 4, fontWeight: '700' }}>{formatMoney(item.unitPriceCents * item.quantity)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <QtyStepper value={item.quantity} max={Math.min(item.maxQty, 10)} onChange={n => setQuantity(item.variantId, n)} />
                <Pressable onPress={() => remove(item.variantId)} hitSlop={10}><Text style={{ color: '#ff6b6b', fontWeight: '600' }}>Quitar</Text></Pressable>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={cardStyle}>
            <Row label="Subtotal" value={formatMoney(subtotalCents)} />
            <Row label="Envío" value={shipping === 0 ? 'Gratis' : formatMoney(shipping)} color={shipping === 0 ? colors.green : undefined} />
            {shipping > 0 ? <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>Envío gratis desde {formatMoney(FREE_SHIPPING_FROM_CENTS)}</Text> : null}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
            <Row label="Total" value={formatMoney(subtotalCents + shipping)} bold />
          </View>
        }
      />
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        {user ? (
          <Button title="Continuar al pago" onPress={() => navigation.navigate('Checkout')} />
        ) : (
          <>
            <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 10 }}>Inicia sesión para pagar.</Text>
            <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
          </>
        )}
      </View>
    </View>
  );
}
