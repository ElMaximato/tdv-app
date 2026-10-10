import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

export type Option = { value: string; label: string };

// Botón tipo "píldora" que abre una lista (hoja inferior) para elegir una opción.
export function Dropdown({ label, value, options, onChange, icon }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void; icon?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  const active = value !== options[0]?.value;      // la primera opción es la "por defecto"
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[s.pill, active && s.pillActive]}>
        <Text style={s.small}>{icon ? `${icon} ` : ''}{label}</Text>
        <Text style={[s.value, active && { color: colors.gold }]} numberOfLines={1}>{current?.label ?? '—'} ▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {options.map(o => {
                const sel = o.value === value;
                return (
                  <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={[s.row, sel && s.rowSel]}>
                    <Text style={[s.rowTxt, sel && { color: colors.gold, fontWeight: '800' }]}>{o.label}</Text>
                    {sel ? <Text style={{ color: colors.gold, fontSize: 16 }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  pill: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { borderColor: colors.gold },
  small: { color: colors.dim, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  value: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,5,12,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingBottom: 28, paddingTop: 10, borderWidth: 1, borderColor: colors.border },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.elevated, marginBottom: 14 },
  sheetTitle: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md },
  rowSel: { backgroundColor: colors.elevated },
  rowTxt: { color: colors.text, fontSize: 16 },
});
