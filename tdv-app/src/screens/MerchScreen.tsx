import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { fetchProducts, Product } from '../api/shop';
import { useCart } from '../cart/CartContext';
import { ProductImage } from '../components/shop';
import { EmptyState, ErrorState } from '../components/states';
import { PixelTitle } from '../components/ui';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, fonts, radius } from '../theme';
import { formatMoney } from '../utils/money';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParamList, 'Merch'>, NativeStackScreenProps<RootStackParamList>>;

export default function MerchScreen({ navigation }: Props) {
  const { count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setProducts(await fetchProducts()); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo cargar la tienda'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={s.header}>
        <PixelTitle size={13} color={colors.red}>TIENDA</PixelTitle>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={s.pill} onPress={() => navigation.navigate('Orders')}><Text style={s.pillTxt}>📦 Pedidos</Text></Pressable>
          <Pressable style={s.pill} onPress={() => navigation.navigate('Cart')}>
            <Text style={s.pillTxt}>🛒 Carrito</Text>
            {count > 0 ? <View style={s.badge}><Text style={s.badgeTxt}>{count}</Text></View> : null}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState emoji="🛍️" title="La tienda se está surtiendo" message="Todavía no hay productos disponibles. Vuelve pronto: la merch de Emilio está en camino." tone={colors.gold} />}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('Product', { slug: item.slug, name: item.name })}>
              <ProductImage image={item.image} category={item.category} style={s.img} />
              <View style={{ padding: 12 }}>
                <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                <Text style={s.price}>{formatMoney(item.price_cents)}</Text>
                {!item.in_stock ? <Text style={s.soldOut}>AGOTADO</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  pillTxt: { color: colors.text, fontSize: 13, fontWeight: '600' },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  img: { width: '100%', height: 140 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', minHeight: 36 },
  price: { color: colors.gold, fontFamily: fonts.pixel, fontSize: 10, marginTop: 6 },
  soldOut: { color: colors.red, fontFamily: fonts.pixel, fontSize: 8, marginTop: 6 },
});
