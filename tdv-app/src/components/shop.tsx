import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { UPLOADS_URL } from '../config';
import { colors, radius } from '../theme';

export const productImage = (img: string | null) => {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  return UPLOADS_URL + img.replace(/^\/+/, '').replace(/^uploads\//, '');
};

export const categoryEmoji = (cat: string | null | undefined) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('ropa') || c.includes('apparel') || c.includes('playera') || c.includes('hoodie')) return '👕';
  if (c.includes('taza') || c.includes('mug')) return '☕';
  if (c.includes('poster') || c.includes('póster')) return '🖼️';
  if (c.includes('gorra') || c.includes('cap')) return '🧢';
  return '🛍️';
};

export function ProductImage({ image, category, style }: { image: string | null; category?: string | null; style: object }) {
  const uri = productImage(image);
  if (uri) return <Image source={{ uri }} style={[{ backgroundColor: colors.elevated }, style]} resizeMode="cover" />;
  return <View style={[{ backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ fontSize: 40 }}>{categoryEmoji(category)}</Text></View>;
}

// − 1 +
export function QtyStepper({ value, min = 1, max, onChange }: { value: number; min?: number; max: number; onChange: (n: number) => void }) {
  return (
    <View style={s.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={[s.stepBtn, value <= min && { opacity: 0.35 }]}><Text style={s.stepTxt}>−</Text></Pressable>
      <Text style={s.stepVal}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={[s.stepBtn, value >= max && { opacity: 0.35 }]}><Text style={s.stepTxt}>+</Text></Pressable>
    </View>
  );
}

export function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: bold ? colors.text : colors.muted, fontSize: bold ? 17 : 15, fontWeight: bold ? '800' : '400' }}>{label}</Text>
      <Text style={{ color: color ?? colors.text, fontSize: bold ? 17 : 15, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

export const cardStyle = { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border } as const;

const s = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated, borderRadius: radius.md },
  stepBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: colors.text, fontSize: 20, fontWeight: '700' },
  stepVal: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' },
});
