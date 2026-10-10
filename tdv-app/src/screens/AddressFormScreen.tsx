import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Switch, Text, View, type TextInput } from 'react-native';

import { createAddress, updateAddress } from '../api/shop';
import { useAuth } from '../auth/AuthContext';
import { KeyboardForm } from '../components/KeyboardForm';
import { Button, ErrorText, Field } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { LIMITS, onlyDigits } from '../utils/validators';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressForm'>;

// Sirve para agregar una dirección nueva o para editar una existente (si llega `address`).
export default function AddressFormScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const editing = route.params?.address;
  const [f, setF] = useState({
    full_name: editing?.full_name ?? '', phone: (editing?.phone ?? '').replace(/\D/g, '').slice(-10), line1: editing?.line1 ?? '', line2: editing?.line2 ?? '',
    city: editing?.city ?? '', state: editing?.state ?? '', postal_code: editing?.postal_code ?? '',
  });
  const [isDefault, setIsDefault] = useState(!!editing?.is_default);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

  useLayoutEffect(() => { navigation.setOptions({ title: editing ? 'Editar dirección' : 'Nueva dirección' }); }, [navigation, editing]);

  async function save() {
    if (!f.full_name.trim() || !f.line1.trim() || !f.city.trim() || !f.state.trim()) { setError('Nombre, calle, ciudad y estado son obligatorios'); return; }
    if (f.full_name.trim().length < 3) { setError('Escribe el nombre completo'); return; }
    if (f.phone && !/^\d{10}$/.test(f.phone)) { setError('El teléfono debe tener 10 dígitos'); return; }
    if (!/^\d{5}$/.test(f.postal_code)) { setError('El código postal debe tener 5 dígitos'); return; }
    setBusy(true); setError(null);
    try {
      if (editing) await updateAddress(editing.id, { ...f, is_default: isDefault });
      else await createAddress({ ...f, is_default: isDefault });
      navigation.goBack();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la dirección'); }
    finally { setBusy(false); }
  }

  const r = {
    phone: useRef<TextInput>(null), line1: useRef<TextInput>(null), line2: useRef<TextInput>(null),
    city: useRef<TextInput>(null), state: useRef<TextInput>(null), zip: useRef<TextInput>(null),
  };

  return (
    <KeyboardForm clearable={{
      hasData: Object.values(f).some(v => v.trim() !== ''),
      onClear: () => { setF({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '' }); setError(null); },
      message: 'Se vaciarán todos los campos de la dirección.',
    }}>
      <Field label="Nombre completo" value={f.full_name} onChangeText={set('full_name')} maxLength={LIMITS.fullName} autoCapitalize="words" placeholder={user?.username ?? 'Nombre de quien recibe'} returnKeyType="next" onSubmitEditing={() => r.phone.current?.focus()} />
      <Field ref={r.phone} label="Teléfono (10 dígitos, opcional)" value={f.phone} onChangeText={t => set('phone')(onlyDigits(t, LIMITS.phone))} maxLength={LIMITS.phone} keyboardType="number-pad" returnKeyType="next" onSubmitEditing={() => r.line1.current?.focus()} />
      <Field ref={r.line1} label="Calle y número" value={f.line1} onChangeText={set('line1')} maxLength={LIMITS.line1} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => r.line2.current?.focus()} />
      <Field ref={r.line2} label="Colonia (opcional)" value={f.line2} onChangeText={set('line2')} maxLength={LIMITS.line2} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => r.city.current?.focus()} />
      <Field ref={r.city} label="Ciudad" value={f.city} onChangeText={set('city')} maxLength={LIMITS.city} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => r.state.current?.focus()} />
      <Field ref={r.state} label="Estado" value={f.state} onChangeText={set('state')} maxLength={LIMITS.state} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => r.zip.current?.focus()} />
      <Field ref={r.zip} label="Código postal" value={f.postal_code} onChangeText={t => set('postal_code')(onlyDigits(t, LIMITS.postal))} keyboardType="number-pad" maxLength={LIMITS.postal} returnKeyType="done" onSubmitEditing={save} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingVertical: 4 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Usar como predeterminada</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Se elegirá primero al pagar.</Text>
        </View>
        <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.gold, false: colors.elevated }} thumbColor="#fff" />
      </View>
      <ErrorText message={error} />
      <Button title={editing ? 'Guardar cambios' : 'Guardar dirección'} onPress={save} loading={busy} />
    </KeyboardForm>
  );
}
