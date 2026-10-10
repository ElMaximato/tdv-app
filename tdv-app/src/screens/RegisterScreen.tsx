import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { KeyboardForm } from '../components/KeyboardForm';
import { Button, ErrorText, Field } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { LIMITS, checkEmail, checkNewPassword, checkUsername, onlyAlnum } from '../utils/validators';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    // Mismas reglas que el servidor, para avisar antes de hacer la petición.
    const problem = checkUsername(username) ?? checkEmail(email) ?? checkNewPassword(password);
    if (problem) { setError(problem); return; }
    setBusy(true); setError(null);
    try {
      await register(username, email.trim().toLowerCase(), password);
      navigation.popToTop();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally { setBusy(false); }
  }

  return (
    <KeyboardForm contentContainerStyle={{ padding: 24 }} clearable={{ hasData: !!(username || email || password), onClear: () => { setUsername(''); setEmail(''); setPassword(''); setError(null); } }}>
      <Text style={{ color: colors.muted, marginBottom: 24, fontSize: 15 }}>Crea tu cuenta para votar, comprar y recibir avisos.</Text>
      <Field label={`Usuario (${username.length}/${LIMITS.username.max})`} value={username} onChangeText={t => setUsername(onlyAlnum(t, LIMITS.username.max))} maxLength={LIMITS.username.max} placeholder="Solo letras y números" autoCorrect={false} />
      <Field label="Correo" value={email} onChangeText={t => setEmail(t.replace(/\s/g, ''))} maxLength={LIMITS.email.max} keyboardType="email-address" autoComplete="email" autoCorrect={false} placeholder="tucorreo@gmail.com" />
      <Field label={`Contraseña (${password.length}/${LIMITS.password.max})`} value={password} onChangeText={t => setPassword(t.replace(/\s/g, ''))} maxLength={LIMITS.password.max} secureTextEntry placeholder="8-20, una mayúscula y un número" />
      <ErrorText message={error} />
      <Button title="Crear cuenta" onPress={submit} loading={busy} />
    </KeyboardForm>
  );
}
