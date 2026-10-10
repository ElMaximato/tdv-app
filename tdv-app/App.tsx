import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { CartProvider } from './src/cart/CartContext';
import { FavoritesProvider } from './src/favorites/FavoritesContext';
import RootNavigator from './src/navigation/RootNavigator';
import { setupNotificationHandler } from './src/push/push';
import { colors } from './src/theme';

setupNotificationHandler();

function Gate() {
  const { loading } = useAuth();            // espera a saber si ya había una sesión guardada
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.red} /></View>;
  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular, VT323_400Regular });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <StatusBar style="light" />
            <Gate />
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
