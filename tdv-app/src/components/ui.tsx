import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { useKeyboardForm } from './KeyboardForm';
import { colors, fonts, radius } from '../theme';

export function PixelTitle({ children, size = 14, color = colors.text }: { children: React.ReactNode; size?: number; color?: string }) {
  return <Text style={{ fontFamily: fonts.pixel, fontSize: size, color, lineHeight: size * 1.6 }}>{children}</Text>;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost'; style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' ? s.btnPrimary : s.btnGhost,
        off && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnText, variant === 'ghost' && { color: colors.text }]}>{title}</Text>}
    </Pressable>
  );
}

export const Field = React.forwardRef<TextInput, TextInputProps & { label: string }>(function Field(props, ref) {
  const { label, style, onFocus, onBlur, ...rest } = props;
  const form = useKeyboardForm();
  const [focused, setFocused] = React.useState(false);
  const y = React.useRef(0);
  return (
    <View style={{ marginBottom: 14 }} onLayout={e => { y.current = e.nativeEvent.layout.y; }}>
      <Text style={[s.label, focused && { color: colors.gold }]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.dim}
        style={[s.input, focused && s.inputFocused, style]}
        autoCapitalize="none"
        onFocus={e => { setFocused(true); form?.scrollToY(y.current); onFocus?.(e); }}
        onBlur={e => { setFocused(false); onBlur?.(e); }}
        {...rest}
      />
    </View>
  );
});

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={s.error}>{message}</Text>;
}

export function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>{children}</View>;
}

const s = StyleSheet.create({
  btn: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnPrimary: { backgroundColor: colors.red },
  btnGhost: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  inputFocused: { borderColor: colors.gold, backgroundColor: colors.elevated },
  input: { height: 50, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, fontSize: 16 },
  error: { color: '#ff6b6b', fontSize: 14, marginBottom: 12 },
});
