import { db } from '../config/db.js';
import { notifyUser } from '../utils/notify.js';
import { orderCode } from './orders.js';
import { stripe } from './stripe.js';

const PAID_STATES = ['paid', 'processing', 'shipped', 'delivered'];

// Marca un pedido como pagado a partir de un PaymentIntent de Stripe YA cobrado.
// La usan POST /shop/orders/:id/confirm y el webhook, así que es segura de llamar varias veces.
// Devuelve { result }:
//   'paid'          → se marcó como pagado ahora
//   'already_paid'  → ya estaba pagado (llamada repetida)
//   'refunded'      → el pedido ya se había cancelado/expirado: se reembolsó el cobro
//   'mismatch'      → el cobro no corresponde al pedido (monto, moneda o PaymentIntent distinto)
//   'not_paid'      → Stripe todavía no confirma el cobro
export async function finalizePayment(orderId, pi) {
  if (pi.status !== 'succeeded') return { result: 'not_paid', status: pi.status };

  const conn = await db.getConnection();
  let outcome, userId;
  try {
    await conn.beginTransaction();
    const [[o]] = await conn.query(
      'SELECT id,user_id,status,total_cents,currency,stripe_payment_intent_id FROM orders WHERE id=? FOR UPDATE', [orderId]);
    if (!o || o.stripe_payment_intent_id !== pi.id || pi.amount !== o.total_cents || pi.currency !== o.currency) {
      await conn.rollback();
      console.warn(`finalizePayment: el cobro ${pi.id} no coincide con el pedido ${orderId}`);
      return { result: 'mismatch' };
    }
    userId = o.user_id;
    if (o.status === 'pending_payment') {
      await conn.query("UPDATE orders SET status='paid', paid_at=NOW() WHERE id=?", [orderId]);
      await conn.query("UPDATE payments SET status='succeeded', error_message=NULL WHERE order_id=? AND provider_ref=?", [orderId, pi.id]);
      outcome = 'paid';
    } else if (PAID_STATES.includes(o.status)) {
      outcome = 'already_paid';
    } else {
      // cancelled / refunded: el stock ya se devolvió, así que no se puede surtir. Se reembolsa.
      await conn.query("UPDATE payments SET status='succeeded' WHERE order_id=? AND provider_ref=?", [orderId, pi.id]);
      outcome = o.status === 'refunded' ? 'already_paid' : 'needs_refund';
    }
    await conn.commit();
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally { conn.release(); }

  if (outcome === 'paid') {
    await notifyUser(userId, { type: 'order_status', title: '¡Pago recibido! ✅', body: `Recibimos el pago de tu pedido ${await orderCode(orderId)}.`, data: { orderId, status: 'paid' } });
    return { result: 'paid' };
  }
  if (outcome === 'needs_refund') {
    await stripe.refunds.create({ payment_intent: pi.id });
    await db.query("UPDATE orders SET status='refunded' WHERE id=? AND status='cancelled'", [orderId]);
    await notifyUser(userId, { type: 'order_status', title: 'Pedido reembolsado', body: `Tu pedido ${await orderCode(orderId)} había expirado, así que te devolvimos el cobro.`, data: { orderId, status: 'refunded' } });
    return { result: 'refunded' };
  }
  return { result: outcome };
}

// Guarda el motivo de un pago fallido (tarjeta rechazada, etc.).
export async function markPaymentFailed(pi) {
  const msg = (pi.last_payment_error?.message || 'El pago no se completó').slice(0, 300);
  await db.query("UPDATE payments SET status='failed', error_message=? WHERE provider_ref=? AND status='created'", [msg, pi.id]);
}
