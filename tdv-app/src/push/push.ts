import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { api } from '../api/client';

// Notificaciones push con Expo. No funcionan en Expo Go (Android): solo en el development build.
// Por eso todo se carga "perezoso" y, en Expo Go, simplemente no hace nada (la app sigue normal).
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let currentToken: string | null = null;

function notif() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

/** Cómo se muestran los avisos cuando la app está abierta. */
export function setupNotificationHandler() {
  if (inExpoGo) return;
  notif().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Pide permiso, obtiene el token de Expo y lo manda al backend. Devuelve el token o null. */
export async function registerForPush(): Promise<string | null> {
  if (inExpoGo || !Device.isDevice) return null;
  try {
    const N = notif();
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'Avisos',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e60012',
      });
    }
    let { status } = await N.getPermissionsAsync();
    if (status !== 'granted') status = (await N.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data: token } = await N.getExpoPushTokenAsync({ projectId });
    currentToken = token;
    await api('/push/register', {
      method: 'POST', auth: true,
      body: { token, device_name: Device.modelName ?? 'Android', platform: Platform.OS },
    });
    return token;
  } catch (err) {
    console.warn('registerForPush:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Al cerrar sesión: este celular deja de recibir avisos de la cuenta. */
export async function unregisterPush() {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  await api('/push/unregister', { method: 'POST', auth: true, body: { token } }).catch(() => {});
}

/** Se ejecuta cuando la persona toca un aviso. Devuelve una función para dejar de escuchar. */
export function onNotificationTap(handler: (data: Record<string, any>) => void): () => void {
  if (inExpoGo) return () => {};
  const sub = notif().addNotificationResponseReceivedListener(r => handler((r.notification.request.content.data ?? {}) as Record<string, any>));
  return () => sub.remove();
}
