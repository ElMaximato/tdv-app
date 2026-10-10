import * as LocalAuthentication from 'expo-local-authentication';

import type { AuthMethod } from '../api/shop';

// Se lanza cuando la persona cierra el aviso de huella/PIN: no es un error, solo no se sigue.
export class UserCancelled extends Error {
  constructor() { super('cancelled'); }
}

// Pide huella, rostro o el PIN/patrón del teléfono. Devuelve cuál se usó para guardarlo con el pago.
// El sistema no dice si la persona usó la huella o el PIN de respaldo, así que se reporta el método
// más fuerte que tiene configurado el teléfono.
export async function confirmIdentity(reason = 'Confirma tu identidad para pagar'): Promise<AuthMethod> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) {
    throw new Error('Activa un bloqueo de pantalla (huella, rostro o PIN) en tu teléfono para poder pagar.');
  }
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,       // permite el PIN/patrón si la huella falla
  });
  if (!res.success) {
    if (res.error === 'user_cancel' || res.error === 'system_cancel' || res.error === 'app_cancel') throw new UserCancelled();
    if (res.error === 'lockout') throw new Error('Demasiados intentos. Espera unos segundos e inténtalo de nuevo.');
    throw new Error('No se pudo confirmar tu identidad. Inténtalo de nuevo.');
  }
  if (level === LocalAuthentication.SecurityLevel.SECRET) return 'device_pin';
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  return 'device_pin';
}
