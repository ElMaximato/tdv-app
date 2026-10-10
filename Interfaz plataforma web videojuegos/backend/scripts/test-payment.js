// Prueba el flujo de pago SIN la app: inicia el pago, "paga" con una tarjeta de prueba de Stripe y confirma.
//   node scripts/test-payment.js correo contraseña ID_PEDIDO            → pago exitoso (tarjeta 4242)
//   node scripts/test-payment.js correo contraseña ID_PEDIDO --decline  → tarjeta rechazada
import 'dotenv/config';
import Stripe from 'stripe';

const [, , email, password, orderId, flag] = process.argv;
if (!email || !password || !orderId) { console.log('Uso: node scripts/test-payment.js correo contraseña ID_PEDIDO [--decline]'); process.exit(1); }
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}/api`;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function call(path, body, token) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client': 'mobile', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

const login = await call('/auth/login', { email, password });
if (!login.data.token) { console.log('Login falló:', login.data); process.exit(1); }
console.log('1) Login OK');

const pay = await call(`/shop/orders/${orderId}/pay`, { auth_method: 'device_pin' }, login.data.token);
if (pay.status !== 200) { console.log('2) /pay falló:', pay.status, pay.data); process.exit(1); }
console.log(`2) /pay OK → ${pay.data.payment_intent_id} por $${(pay.data.amount_cents / 100).toFixed(2)} ${pay.data.currency.toUpperCase()}`);

try {
  const paid = await stripe.paymentIntents.confirm(pay.data.payment_intent_id, { payment_method: flag === '--decline' ? 'pm_card_chargeDeclined' : 'pm_card_visa' });
  console.log('3) Stripe cobró. Estado:', paid.status);
} catch (err) { console.log('3) Stripe rechazó la tarjeta:', err.message); }

const conf = await call(`/shop/orders/${orderId}/confirm`, {}, login.data.token);
console.log(`4) /confirm → HTTP ${conf.status}`);
console.log(conf.status === 200 ? `   Pedido #${conf.data.order.id} ahora está en estado: ${conf.data.order.status}` : conf.data);
