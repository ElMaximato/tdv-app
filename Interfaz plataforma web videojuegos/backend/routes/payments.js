import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { fetchOrder } from '../services/orders.js';
import { finalizePayment, markPaymentFailed } from '../services/payments.js';
import { stripe } from '../services/stripe.js';

const router = Router();

// Cómo confirmó la persona en el celular antes de pagar. El servidor NO puede verificar una huella:
// solo exige que la app declare que la pidió, y lo guarda en `payments.auth_method` (útil para la demo).
const AUTH_METHODS = ['fingerprint', 'face', 'device_pin'];

const needStripe = (_req, res, next) => (stripe ? next() : res.status(503).json({ error: 'Los pagos no están configurados en el servidor' }));

// 1) La app pide iniciar el pago. El monto sale SIEMPRE del pedido guardado en la base, nunca de la app.
//    Devuelve el client_secret con el que la app abre la hoja de pago de Stripe (PaymentSheet).
router.post('/shop/orders/:id/pay', authRequired, needStripe, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const authMethod = req.body?.auth_method;
  if (!AUTH_METHODS.includes(authMethod))
    return res.status(400).json({ error: 'Confirma tu identidad con huella, rostro o PIN antes de pagar' });
  try {
    const order = await fetchOrder(id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.status !== 'pending_payment') return res.status(409).json({ error: 'Este pedido ya no está pendiente de pago' });

    const [[row]] = await db.query('SELECT stripe_payment_intent_id AS pid FROM orders WHERE id=?', [id]);
    const oldPid = row?.pid || null;
    let pi = null;
    if (oldPid) {                                     // ¿ya había un intento de pago? se reutiliza si sigue vivo
      pi = await stripe.paymentIntents.retrieve(oldPid);
      if (pi.status === 'succeeded') {
        await finalizePayment(id, pi);
        return res.json({ already_paid: true, order: await fetchOrder(id, req.user.id) });
      }
      if (pi.status === 'canceled' || pi.amount !== order.total_cents) pi = null;
    }

    if (pi) {
      await db.query('UPDATE payments SET auth_method=? WHERE provider_ref=?', [authMethod, pi.id]);
    } else {
      pi = await stripe.paymentIntents.create({
        amount: order.total_cents,
        currency: order.currency,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },   // Stripe ya no acepta payment_method_types
        description: `Pedido ${order.public_code}`,
        metadata: { order_id: String(id), order_code: order.public_code, user_id: String(req.user.id) },
      });
      // Guarda el PaymentIntent en el pedido solo si nadie más lo hizo antes (dos toques seguidos al botón).
      const [u] = await db.query(
        "UPDATE orders SET stripe_payment_intent_id=? WHERE id=? AND status='pending_payment' AND stripe_payment_intent_id <=> ?",
        [pi.id, id, oldPid]);
      if (u.affectedRows === 0) {
        await stripe.paymentIntents.cancel(pi.id).catch(() => {});
        return res.status(409).json({ error: 'Ya hay un pago en curso para este pedido. Intenta de nuevo.' });
      }
      await db.query(
        "INSERT INTO payments (order_id,provider,provider_ref,amount_cents,currency,status,auth_method) VALUES (?,?,?,?,?,'created',?)",
        [id, 'stripe', pi.id, order.total_cents, order.currency, authMethod]);
    }

    res.json({
      order_id: id,
      payment_intent_id: pi.id,
      client_secret: pi.client_secret,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || null,
      amount_cents: order.total_cents,
      currency: order.currency,
    });
  } catch (err) { console.error('pay:', err.message); res.status(500).json({ error: 'No se pudo iniciar el pago' }); }
});

// 2) Cuando la hoja de pago termina, la app llama aquí. El servidor NO se fía de la app:
//    le pregunta a Stripe si de verdad se cobró y revisa que el monto coincida.
router.post('/shop/orders/:id/confirm', authRequired, needStripe, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  try {
    const order = await fetchOrder(id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    const [[row]] = await db.query('SELECT stripe_payment_intent_id AS pid FROM orders WHERE id=?', [id]);
    if (!row?.pid) return res.status(400).json({ error: 'Este pedido no tiene un pago iniciado' });

    const pi = await stripe.paymentIntents.retrieve(row.pid);
    const r = await finalizePayment(id, pi);
    if (r.result === 'paid' || r.result === 'already_paid') return res.json({ ok: true, order: await fetchOrder(id, req.user.id) });
    if (r.result === 'refunded') return res.status(409).json({ error: 'El pedido expiró antes de confirmarse el pago. Te devolvimos el cobro.' });
    if (r.result === 'not_paid') {
      if (pi.status === 'requires_payment_method') await markPaymentFailed(pi);
      return res.status(402).json({ error: pi.last_payment_error?.message || 'El pago no se completó', payment_status: pi.status });
    }
    console.error(`confirm: el cobro ${pi.id} no coincide con el pedido ${id}`);
    res.status(500).json({ error: 'El cobro no coincide con el pedido. Contacta a soporte.' });
  } catch (err) { console.error('confirm:', err.message); res.status(500).json({ error: 'No se pudo confirmar el pago' }); }
});

export default router;

// 3) Webhook de Stripe (opcional en desarrollo, recomendado en producción): Stripe avisa solo, aunque la app
//    se cierre justo después de pagar. Se monta en server.js con express.raw ANTES de express.json.
export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(503).send('Webhook no configurado');
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret); }
  catch { return res.status(400).send('Firma inválida'); }
  try {
    const pi = event.data.object;
    if (event.type === 'payment_intent.succeeded') {
      const orderId = parseInt(pi.metadata?.order_id);
      if (orderId) await finalizePayment(orderId, pi);
    } else if (event.type === 'payment_intent.payment_failed') {
      await markPaymentFailed(pi);
    }
    res.json({ received: true });
  } catch (err) { console.error('webhook:', err.message); res.status(500).send('Error'); }
}