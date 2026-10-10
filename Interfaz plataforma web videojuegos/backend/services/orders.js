import crypto from 'crypto';

import { db } from '../config/db.js';

// Lógica de la tienda reutilizable (la usan routes/shop.js, routes/admin/orders.js y, después, los pagos).

export const SHIPPING_CENTS           = 9900;    // envío: $99.00 MXN
export const FREE_SHIPPING_FROM_CENTS = 99900;   // envío gratis desde $999.00
export const SHOP_CURRENCY            = 'mxn';
export const MAX_QTY_PER_ITEM         = 10;
export const MAX_PENDING_ORDERS       = 3;       // pedidos sin pagar por usuario
export const PENDING_ORDER_TTL_MIN    = 30;      // un pedido sin pagar libera su stock a los 30 min

// Código público de pedido, ej. TDV-K7M2QX (sin letras confusas como O/0 o I/1).
// El cliente solo ve este código; el id interno de la base de datos no se muestra.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export async function generateOrderCode(conn = db) {
  for (let i = 0; i < 8; i++) {
    let c = 'TDV-';
    for (const b of crypto.randomBytes(6)) c += CODE_ALPHABET[b % CODE_ALPHABET.length];
    const [[dup]] = await conn.query('SELECT 1 AS x FROM orders WHERE public_code=?', [c]);
    if (!dup) return c;
  }
  throw new Error('No se pudo generar un código de pedido único');
}
export async function orderCode(orderId) {
  const [[r]] = await db.query('SELECT public_code FROM orders WHERE id=?', [orderId]);
  return r?.public_code ?? `#${orderId}`;
}

// Cancela un pedido sin pagar y le devuelve el stock. Se llama DENTRO de una transacción.
export async function cancelPendingOrder(conn, orderId) {
  const [res] = await conn.query("UPDATE orders SET status='cancelled' WHERE id=? AND status='pending_payment'", [orderId]);
  if (res.affectedRows === 0) return false;
  const [items] = await conn.query('SELECT variant_id, quantity FROM order_items WHERE order_id=? AND variant_id IS NOT NULL', [orderId]);
  for (const it of items) await conn.query('UPDATE product_variants SET stock = stock + ? WHERE id=?', [it.quantity, it.variant_id]);
  return true;
}

export async function expireStaleOrders() {
  const conn = await db.getConnection();
  try {
    const [stale] = await conn.query("SELECT id FROM orders WHERE status='pending_payment' AND created_at < (NOW() - INTERVAL ? MINUTE)", [PENDING_ORDER_TTL_MIN]);
    for (const o of stale) { await conn.beginTransaction(); await cancelPendingOrder(conn, o.id); await conn.commit(); }
  } catch (err) { try { await conn.rollback(); } catch {} console.error('expireStaleOrders:', err.message); }
  finally { conn.release(); }
}
// Se arranca desde server.js
export function startOrderExpiryJob() {
  setInterval(expireStaleOrders, 5 * 60 * 1000).unref();
}

export async function loadVariants(productIds) {
  if (!productIds.length) return {};
  const [rows] = await db.query('SELECT id, product_id, label, stock, price_override_cents FROM product_variants WHERE product_id IN (?) AND is_active=1 ORDER BY id', [productIds]);
  const by = {};
  rows.forEach(v => { (by[v.product_id] ||= []).push(v); });
  return by;
}
export const shapeProduct = (p, variants = []) => ({
  ...p,
  variants: variants.map(v => ({ id: v.id, label: v.label, stock: v.stock, price_cents: v.price_override_cents ?? p.price_cents })),
  in_stock: variants.some(v => v.stock > 0),
});

export async function fetchOrder(orderId, userId = null) {
  const [[o]] = await db.query(
    `SELECT id,public_code,user_id,status,subtotal_cents,shipping_cents,total_cents,currency,paid_at,
            ship_full_name,ship_phone,ship_line1,ship_line2,ship_city,ship_state,ship_postal_code,ship_country,
            tracking_number,created_at,
            CASE WHEN status='pending_payment'
                 THEN GREATEST(0, ${PENDING_ORDER_TTL_MIN * 60} - TIMESTAMPDIFF(SECOND, created_at, NOW()))
                 ELSE NULL END AS expires_in_seconds
     FROM orders WHERE id=? ${userId ? 'AND user_id=?' : ''}`,
    userId ? [orderId, userId] : [orderId]);
  if (!o) return null;
  const [items] = await db.query('SELECT id,product_id,variant_id,product_name,variant_label,unit_price_cents,quantity FROM order_items WHERE order_id=?', [orderId]);
  return { ...o, items };
}
