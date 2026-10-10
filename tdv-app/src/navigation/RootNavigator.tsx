import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Text } from 'react-native';

import AddressFormScreen from '../screens/AddressFormScreen';
import AddressesScreen from '../screens/AddressesScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import MerchScreen from '../screens/MerchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProductScreen from '../screens/ProductScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RankingScreen from '../screens/RankingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import Top5Screen from '../screens/Top5Screen';
import { onNotificationTap } from '../push/push';
import { colors } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const navRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.border, primary: colors.red },
};

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ tabBarIcon: icon('🏆') }} />
      <Tab.Screen name="Merch" component={MerchScreen} options={{ title: 'Tienda', tabBarIcon: icon('🛍️') }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  // Al tocar una notificación push: abre el pedido si trae uno, o la bandeja de avisos.
  useEffect(() => onNotificationTap(d => {
    if (!navRef.isReady()) return;
    const orderId = Number(d.orderId ?? d.order_id);
    if (orderId) navRef.navigate('OrderDetail', { id: orderId });
    else navRef.navigate('Notifications');
  }), []);

  return (
    <NavigationContainer theme={navTheme} ref={navRef}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerShadowVisible: false }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="GameDetail" component={GameDetailScreen} options={({ route }) => ({ title: route.params.title ?? 'Juego' })} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Product" component={ProductScreen} options={({ route }) => ({ title: route.params.name ?? 'Producto' })} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrito' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pago' }} />
        <Stack.Screen name="AddressForm" component={AddressFormScreen} options={{ title: 'Nueva dirección' }} />
        <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Mis direcciones' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Mis favoritos' }} />
        <Stack.Screen name="Top5" component={Top5Screen} options={{ title: 'Mi Top 5' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Avisos' }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Mis pedidos' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Detalle del pedido' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
