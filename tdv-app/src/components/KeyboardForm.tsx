import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, ScrollView, Text, type ScrollViewProps } from 'react-native';

import { useShake } from '../hooks/useShake';
import { colors } from '../theme';

// Formulario que "esquiva" el teclado sin librerías nativas:
//  - mide la altura real del teclado y la suma como espacio al final del scroll,
//  - cuando un Field recibe foco, desplaza el scroll para dejarlo visible arriba del teclado.
// Extra: con la prop `clearable`, agitar el celular ofrece borrar todo lo escrito (con confirmación).
type Ctx = { scrollToY: (y: number) => void };
const FormCtx = createContext<Ctx | null>(null);
export const useKeyboardForm = () => useContext(FormCtx);

export type Clearable = { hasData: boolean; onClear: () => void; message?: string };

export function KeyboardForm({ children, contentContainerStyle, clearable, ...rest }: ScrollViewProps & { clearable?: Clearable }) {
  const ref = useRef<ScrollView>(null);
  const [kb, setKb] = useState(0);
  const focused = useIsFocused();
  const asking = useRef(false);               // evita abrir dos avisos si se agita varias veces
  const clr = useRef(clearable);
  clr.current = clearable;

  useEffect(() => {
    const showEv = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEv = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEv, e => setKb(e.endCoordinates.height));
    const b = Keyboard.addListener(hideEv, () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);

  const scrollToY = useCallback((y: number) => {
    setTimeout(() => ref.current?.scrollTo({ y: Math.max(0, y - 90), animated: true }), 120);
  }, []);

  const onShake = useCallback(() => {
    const c = clr.current;
    if (!c || !c.hasData || asking.current) return;
    asking.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const done = () => { asking.current = false; };
    Alert.alert('¿Borrar lo que escribiste?', c.message ?? 'Se vaciarán todos los campos de este formulario.', [
      { text: 'Cancelar', style: 'cancel', onPress: done },
      { text: 'Borrar todo', style: 'destructive', onPress: () => { done(); Keyboard.dismiss(); c.onClear(); } },
    ], { cancelable: true, onDismiss: done });
  }, []);
  useShake(onShake, !!clearable && clearable.hasData && focused);

  return (
    <FormCtx.Provider value={{ scrollToY }}>
      <ScrollView
        ref={ref}
        style={{ flex: 1, backgroundColor: colors.bg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ padding: 20, paddingBottom: 40 + kb }, contentContainerStyle]}
        {...rest}
      >
        {children}
        {clearable?.hasData ? <Text style={{ color: colors.dim, fontSize: 12, textAlign: 'center', marginTop: 18 }}>📳 Agita el celular para borrar lo escrito</Text> : null}
      </ScrollView>
    </FormCtx.Provider>
  );
}
