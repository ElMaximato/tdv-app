import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { KeyboardForm } from '../components/KeyboardForm';
import { Button, ErrorText, Field, PixelTitle } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { LIMITS, checkEmail } from '../utils/validators';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) { setError('Escribe tu correo y contraseña'); return; }
    const problem = checkEmail(email);
    if (problem) { setError(problem); return; }
    setBusy(true); setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.popToTop();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally { setBusy(false); }
  }

  return (
    <KeyboardForm contentContainerStyle={{ padding: 24, paddingTop: 40 }} clearable={{ hasData: !!(email || password), onClear: () => { setEmail(''); setPassword(''); setError(null); } }}>
      <PixelTitle size={16} color={colors.red}>TIEMPO DE{'\n'}VIDEOJUEGOS</PixelTitle>
      <Text style={{ color: colors.muted, marginTop: 10, marginBottom: 32, fontSize: 15 }}>Inicia sesión para votar, comprar y recibir avisos.</Text>

      <Field label="Correo" value={email} onChangeText={t => setEmail(t.replace(/\s/g, ''))} maxLength={LIMITS.email.max} keyboardType="email-address" autoComplete="email" autoCorrect={false} placeholder="tucorreo@gmail.com" />
      <Field label="Contraseña" value={password} onChangeText={t => setPassword(t.replace(/\s/g, ''))} maxLength={LIMITS.password.max} secureTextEntry autoComplete="password" placeholder="••••••••" onSubmitEditing={submit} />
      <ErrorText message={error} />
      <Button title="Entrar" onPress={submit} loading={busy} />

      <View style={{ height: 14 }} />
      <Button title="Crear cuenta" variant="ghost" onPress={() => navigation.navigate('Register')} />
    </KeyboardForm>
  );
}
