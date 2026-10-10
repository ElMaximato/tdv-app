import Stripe from 'stripe';

// Cliente de Stripe. Se crea una sola vez y lo comparten las rutas de pago.
// (config/env.js ya cargó el .env porque server.js lo importa primero.)
const key = process.env.STRIPE_SECRET_KEY || '';

export const stripeEnabled = key.startsWith('sk_');
if (!stripeEnabled) console.warn('⚠️  STRIPE_SECRET_KEY no está definido: los pagos están desactivados.');
else if (!key.startsWith('sk_test_')) console.warn('⚠️  La clave de Stripe NO es de prueba (sk_test_...). Cuidado: cobraría dinero real.');

export const stripe = stripeEnabled ? new Stripe(key) : null;
