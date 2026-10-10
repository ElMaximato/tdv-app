import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';

import { confirmOrder, payOrder } from '../api/shop';
import { confirmIdentity } from './biometrics';

// Flujo completo de pago de un pedido que YA existe (pending_payment):
//   1) huella / rostro / PIN  2) el servidor crea el cobro en Stripe  3) hoja de pago de Stripe
//   4) el servidor le pregunta a Stripe si de verdad se cobró y marca el pedido como pagado.
// Devuelve 'paid' o 'canceled' (la persona cerró la hoja de pago). Los errores se lanzan.
// Si la persona cancela el aviso de huella se lanza UserCancelled (ver biometrics.ts).
export async function payExistingOrder(orderId: number): Promise<'paid' | 'canceled'> {
  const method = await confirmIdentity();
  const init = await payOrder(orderId, method);
  if (init.already_paid) return 'paid';

  if (!init.publishable_key) throw new Error('Falta STRIPE_PUBLISHABLE_KEY en el .env del servidor.');
  await initStripe({ publishableKey: init.publishable_key });

  const sheet = await initPaymentSheet({
    merchantDisplayName: 'Tiempo de Videojuegos',
    paymentIntentClientSecret: init.client_secret,
    returnURL: 'tdvapp://stripe-redirect',
    style: 'alwaysDark',
    allowsDelayedPaymentMethods: false,
  });
  if (sheet.error) throw new Error(sheet.error.message);

  const result = await presentPaymentSheet();
  if (result.error) {
    if (String(result.error.code) === 'Canceled') return 'canceled';
    throw new Error(result.error.message);
  }

  await confirmOrder(orderId);
  return 'paid';
}
