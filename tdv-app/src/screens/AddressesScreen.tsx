import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { Address, deleteAddress, fetchAddresses, setDefaultAddress } from '../api/shop';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, FullError } from '../components/states';
import { cardStyle } from '../components/shop';
import { Button } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

export default function AddressesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [list, setList] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList(await fetchAddresses()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar tus direcciones'); }
    finally { setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { if (user) load(); }, [load, user]));

  async function makeDefault(a: Address) {
    setBusyId(a.id);
    try { await setDefaultAddress(a.id); await load(); }
    catch (err) { Alert.alert('No se pudo cambiar', err instanceof Error ? err.message : 'Inténtalo de nuevo'); }
    finally { setBusyId(null); }
  }
  function askDelete(a: Address) {
    Alert.alert('Borrar dirección', `¿Borrar la dirección de ${a.full_name}? Tus pedidos anteriores no cambian.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, borrar', style: 'destructive', onPress: async () => {
        setBusyId(a.id);
        try { await deleteAddress(a.id); await load(); }
        catch (err) { Alert.alert('No se pudo borrar', err instanceof Error ? err.message : 'Inténtalo de nuevo'); }
        finally { setBusyId(null); }
      } },
    ]);
  }

  if (!user) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><EmptyState emoji="🔒" title="Inicia sesión" message="Guarda tus direcciones para pagar más rápido." actionLabel="Iniciar sesión" onAction={() => navigation.navigate('Login')} /></View>;
  if (error && !list) return <FullError message={error} onRetry={load} />;
  if (!list) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={list}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.red} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState emoji="📍" title="Aún no tienes direcciones" message="Agrega una para que tus pedidos lleguen hasta tu puerta." tone={colors.cyan} />}
        renderItem={({ item: a }) => (
          <View style={[cardStyle, { marginBottom: 12 }, !!a.is_default && { borderColor: colors.gold }]}>
            {a.is_default ? <Text style={{ color: colors.gold, fontFamily: fonts.pixel, fontSize: 7, marginBottom: 8 }}>★ PREDETERMINADA</Text> : null}
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{a.full_name}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
            <Text style={{ color: colors.muted }}>{a.city}, {a.state} · CP {a.postal_code}</Text>
            {a.phone ? <Text style={{ color: colors.dim, marginTop: 2 }}>📞 {a.phone}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <View style={{ flex: 1 }}><Button title="Editar" variant="ghost" onPress={() => navigation.navigate('AddressForm', { address: a })} disabled={busyId === a.id} /></View>
              {!a.is_default ? <View style={{ flex: 1 }}><Button title="★ Principal" variant="ghost" onPress={() => makeDefault(a)} loading={busyId === a.id} /></View> : null}
              <View style={{ width: 54 }}><Button title="🗑" variant="ghost" onPress={() => askDelete(a)} disabled={busyId === a.id} /></View>
            </View>
          </View>
        )}
      />
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <Button title="+ Agregar dirección" onPress={() => navigation.navigate('AddressForm', {})} />
      </View>
    </View>
  );
}
