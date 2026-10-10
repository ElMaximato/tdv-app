import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../api/client';
import { fetchProduct, Product } from '../api/shop';
import { useCart } from '../cart/CartContext';
import { ProductImage, QtyStepper } from '../components/shop';
import { Button, Center } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';
import { formatMoney, MAX_QTY_PER_ITEM } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export default function ProductScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const load = () => {
    setError(null);
    fetchProduct(slug)
      .then(p => {
        setProduct(p);
        const first = p.variants.find(v => v.stock > 0) ?? p.variants[0];
        setVariantId(first ? first.id : null);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el producto'));
  };
  useEffect(load, [slug]);

  if (error) return <Center><Text style={{ color: '#ff6b6b', marginBottom: 14, textAlign: 'center' }}>{error}</Text><Button title="Reintentar" onPress={load} /></Center>;
  if (!product) return <Center><ActivityIndicator color={colors.red} /></Center>;

  const variant = product.variants.find(v => v.id === variantId) ?? null;
  const maxQty = variant ? Math.min(variant.stock, MAX_QTY_PER_ITEM) : 0;
  const onlyOne = product.variants.length === 1;

  function addToCart() {
    if (!variant) return;
    add({
      variantId: variant.id, productSlug: product!.slug, productName: product!.name, variantLabel: variant.label,
      unitPriceCents: variant.price_cents, image: product!.image, maxQty: variant.stock,
    }, qty);
    setAdded(true);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <ProductImage image={product.image} category={product.category} style={{ width: '100%', height: 300 }} />
      <View style={{ padding: 18 }}>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.price}>{formatMoney(variant ? variant.price_cents : product.price_cents)}</Text>
        {product.description ? <Text style={s.desc}>{product.description}</Text> : null}

        {!onlyOne ? (
          <>
            <Text style={s.label}>TALLA</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {product.variants.map(v => {
                const out = v.stock <= 0, active = v.id === variantId;
                return (
                  <Pressable key={v.id} disabled={out} onPress={() => { setVariantId(v.id); setQty(1); setAdded(false); }}
                    style={[s.chip, active && { backgroundColor: colors.red, borderColor: colors.red }, out && { opacity: 0.35 }]}>
                    <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{v.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {variant && variant.stock > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
              <Text style={s.label}>CANTIDAD</Text>
              <QtyStepper value={qty} max={maxQty} onChange={n => { setQty(n); setAdded(false); }} />
            </View>
            {variant.stock <= 5 ? <Text style={{ color: colors.gold, marginTop: 10 }}>¡Solo quedan {variant.stock}!</Text> : null}
            <Button title={`Agregar al carrito · ${formatMoney(variant.price_cents * qty)}`} onPress={addToCart} style={{ marginTop: 22 }} />
            {added ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ color: colors.green, marginBottom: 10, textAlign: 'center' }}>✓ Agregado al carrito</Text>
                <Button title="Ver carrito" variant="ghost" onPress={() => navigation.navigate('Cart')} />
              </View>
            ) : null}
          </>
        ) : (
          <Text style={{ color: colors.red, fontFamily: fonts.pixel, fontSize: 10, marginTop: 24 }}>AGOTADO</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  name: { color: colors.text, fontSize: 24, fontWeight: '800' },
  price: { color: colors.gold, fontFamily: fonts.pixel, fontSize: 14, marginTop: 10 },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  label: { color: colors.muted, fontFamily: fonts.pixel, fontSize: 9, marginTop: 24, marginBottom: 12 },
  chip: { minWidth: 56, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
});
