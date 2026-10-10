import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { FREE_SHIPPING_FROM_CENTS, MAX_PENDING_ORDERS, MAX_QTY_PER_ITEM, PENDING_ORDER_TTL_MIN, SHIPPING_CENTS, SHOP_CURRENCY, cancelPendingOrder, expireStaleOrders, fetchOrder, generateOrderCode, loadVariants, shapeProduct } from '../services/orders.js';
import { finalizePayment } from '../services/payments.js';
import { stripe } from '../services/stripe.js';

const router = Router();

// ── Catálogo (público) ────────────────────────────────────────
router.get('/shop/products', async (req, res) => {
  try {
    const conds = ['is_active=1'], params = [];
    if (req.query.category) { conds.push('category=?'); params.push(req.query.category); }
    if (req.query.featured === 'true') conds.push('is_featured=1');
    const [products] = await db.query(
      `SELECT id,slug,name,description,category,price_cents,currency,image,is_featured FROM products WHERE ${conds.join(' AND ')} ORDER BY is_featured DESC, id`, params);
    const variants = await loadVariants(products.map(p => p.id));
    res.json(products.map(p => shapeProduct(p, variants[p.id])));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener productos' }); }
});

router.get('/shop/products/:slug', async (req, res) => {
  try {
    const [[p]] = await db.query(
      'SELECT id,slug,name,description,category,price_cents,currency,image,gallery,is_featured FROM products WHERE slug=? AND is_active=1', [req.params.slug]);
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    const variants = await loadVariants([p.id]);
    res.json(shapeProduct(p, variants[p.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener el producto' }); }
});

// ── Direcciones de envío ──────────────────────────────────────
router.get('/shop/addresses', authRequired, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,full_name,phone,line1,line2,city,state,postal_code,country,is_default FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener direcciones' }); }
});

// Valida y limpia los datos de una dirección (la usan crear y editar).
function parseAddress(a = {}) {
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');
  const addr = {
    full_name: clean(a.full_name), phone: clean(a.phone), line1: clean(a.line1), line2: clean(a.line2),
    city: clean(a.city), state: clean(a.state), postal_code: clean(a.postal_code),
  };
  const MAX = { full_name: 80, line1: 80, line2: 40, city: 50, state: 80 };
  const NAMES = { full_name: 'El nombre', line1: 'La calle y número', line2: 'La colonia', city: 'La ciudad', state: 'El estado' };
  for (const k of Object.keys(MAX)) if (addr[k].length > MAX[k]) return { error: `${NAMES[k]} no puede pasar de ${MAX[k]} caracteres` };
  if (!addr.full_name || !addr.line1 || !addr.city || !addr.state || !addr.postal_code)
    return { error: 'Faltan datos: nombre, calle, ciudad, estado y código postal son obligatorios' };
  if (!/^\d{5}$/.test(addr.postal_code)) return { error: 'El código postal debe tener 5 dígitos' };
  if (addr.phone && !/^\d{10}$/.test(addr.phone)) return { error: 'El teléfono debe tener 10 dígitos' };
  return { addr };
}

router.post('/shop/addresses', authRequired, async (req, res) => {
  const a = req.body || {};
  const { addr, error } = parseAddress(a);
  if (error) return res.status(400).json({ error });
  try {
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM addresses WHERE user_id=?', [req.user.id]);
    if (n >= 5) return res.status(400).json({ error: 'Máximo 5 direcciones. Borra una para agregar otra.' });
    const makeDefault = n === 0 || a.is_default === true;
    if (makeDefault) await db.query('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    const [r] = await db.query(
      'INSERT INTO addresses (user_id,full_name,phone,line1,line2,city,state,postal_code,country,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, addr.full_name, addr.phone || null, addr.line1, addr.line2 || null, addr.city, addr.state, addr.postal_code, 'MX', makeDefault ? 1 : 0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al guardar la dirección' }); }
});

// Editar una dirección. Los pedidos ya hechos no cambian (guardan su propia copia de la dirección).
router.put('/shop/addresses/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const a = req.body || {};
  const { addr, error } = parseAddress(a);
  if (error) return res.status(400).json({ error });
  try {
    const [[own]] = await db.query('SELECT id FROM addresses WHERE id=? AND user_id=?', [id, req.user.id]);
    if (!own) return res.status(404).json({ error: 'Dirección no encontrada' });
    if (a.is_default === true) await db.query('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    await db.query(
      `UPDATE addresses SET full_name=?,phone=?,line1=?,line2=?,city=?,state=?,postal_code=?${a.is_default === true ? ',is_default=1' : ''} WHERE id=? AND user_id=?`,
      [addr.full_name, addr.phone || null, addr.line1, addr.line2 || null, addr.city, addr.state, addr.postal_code, id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar la dirección' }); }
});

// Marcar una dirección como predeterminada.
router.post('/shop/addresses/:id/default', authRequired, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  try {
    const [[own]] = await db.query('SELECT id FROM addresses WHERE id=? AND user_id=?', [id, req.user.id]);
    if (!own) return res.status(404).json({ error: 'Dirección no encontrada' });
    await db.query('UPDATE addresses SET is_default = (id = ?) WHERE user_id=?', [id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al cambiar la dirección predeterminada' }); }
});

router.delete('/shop/addresses/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  try {
    const [[row]] = await db.query('SELECT is_default FROM addresses WHERE id=? AND user_id=?', [id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Dirección no encontrada' });
    await db.query('DELETE FROM addresses WHERE id=? AND user_id=?', [id, req.user.id]);
    // Si se borró la predeterminada, la más reciente que quede pasa a serlo.
    if (row.is_default) await db.query('UPDATE addresses SET is_default=1 WHERE user_id=? ORDER BY id DESC LIMIT 1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al borrar la dirección' }); }
});

// ── Pedidos ───────────────────────────────────────────────────
// Crea el pedido en estado pending_payment y APARTA el stock. El pago va en routes/payments.js.
router.post('/shop/orders', authRequired, async (req, res) => {
  const raw = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!raw.length || raw.length > 20) return res.status(400).json({ error: 'El carrito está vacío o tiene demasiados productos' });
  const merged = new Map();                                   // variant_id → cantidad total
  for (const it of raw) {
    const vid = parseInt(it?.variant_id), qty = parseInt(it?.quantity);
    if (!Number.isInteger(vid) || vid < 1 || !Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'Producto o cantidad inválidos' });
    merged.set(vid, (merged.get(vid) || 0) + qty);
  }
  for (const [, q] of merged) if (q > MAX_QTY_PER_ITEM) return res.status(400).json({ error: `Máximo ${MAX_QTY_PER_ITEM} piezas por producto` });
  const addrId = parseInt(req.body?.address_id);
  if (!Number.isInteger(addrId)) return res.status(400).json({ error: 'Elige una dirección de envío' });

  await expireStaleOrders();                                  // libera stock de pedidos abandonados
  const conn = await db.getConnection();
  try {
    const [[addr]] = await conn.query('SELECT * FROM addresses WHERE id=? AND user_id=?', [addrId, req.user.id]);
    if (!addr) return res.status(404).json({ error: 'Dirección no encontrada' });
    const [[{ pending }]] = await conn.query("SELECT COUNT(*) AS pending FROM orders WHERE user_id=? AND status='pending_payment'", [req.user.id]);
    if (pending >= MAX_PENDING_ORDERS) return res.status(429).json({ error: 'Tienes pedidos sin pagar. Págalos o cancélalos antes de crear otro.' });

    await conn.beginTransaction();
    const lines = []; let subtotal = 0;
    for (const vid of [...merged.keys()].sort((a, b) => a - b)) {   // orden fijo = sin bloqueos cruzados
      const qty = merged.get(vid);
      const [[v]] = await conn.query(
        `SELECT pv.id, pv.label, pv.stock, pv.price_override_cents, p.id AS product_id, p.name, p.price_cents
         FROM product_variants pv JOIN products p ON p.id = pv.product_id
         WHERE pv.id=? AND pv.is_active=1 AND p.is_active=1 FOR UPDATE OF pv`, [vid]);
      if (!v) { await conn.rollback(); return res.status(404).json({ error: 'Un producto del carrito ya no está disponible' }); }
      if (v.stock < qty) { await conn.rollback(); return res.status(409).json({ error: `Sin stock suficiente de "${v.name}" (${v.label}). Quedan ${v.stock}.` }); }
      const unit = v.price_override_cents ?? v.price_cents;
      await conn.query('UPDATE product_variants SET stock = stock - ? WHERE id=?', [qty, vid]);
      subtotal += unit * qty;
      lines.push([v.product_id, vid, v.name, v.label, unit, qty]);
    }
    const shipping = subtotal >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;
    const total = subtotal + shipping;
    const code = await generateOrderCode(conn);
    const [o] = await conn.query(
      `INSERT INTO orders (public_code,user_id,status,subtotal_cents,shipping_cents,total_cents,currency,
         ship_full_name,ship_phone,ship_line1,ship_line2,ship_city,ship_state,ship_postal_code,ship_country)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, req.user.id, 'pending_payment', subtotal, shipping, total, SHOP_CURRENCY,
       addr.full_name, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]);
    await conn.query('INSERT INTO order_items (order_id,product_id,variant_id,product_name,variant_label,unit_price_cents,quantity) VALUES ?',
      [lines.map(l => [o.insertId, ...l])]);
    await conn.commit();
    res.status(201).json(await fetchOrder(o.insertId, req.user.id));
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error(err); res.status(500).json({ error: 'Error al crear el pedido' });
  } finally { conn.release(); }
});

router.get('/shop/orders', authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id,public_code,status,total_cents,currency,created_at,
              CASE WHEN status='pending_payment' THEN GREATEST(0, ${PENDING_ORDER_TTL_MIN * 60} - TIMESTAMPDIFF(SECOND, created_at, NOW())) ELSE NULL END AS expires_in_seconds,
              (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id=orders.id) AS item_count
       FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 50`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener tus pedidos' }); }
});

router.get('/shop/orders/:id', authRequired, async (req, res) => {
  try {
    const order = await fetchOrder(parseInt(req.params.id) || 0, req.user.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener el pedido' }); }
});

router.post('/shop/orders/:id/cancel', authRequired, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const conn = await db.getConnection();
  try {
    const [[o]] = await conn.query('SELECT id, stripe_payment_intent_id AS pid FROM orders WHERE id=? AND user_id=?', [id, req.user.id]);
    if (!o) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Si la persona ya pagó en Stripe pero la app no alcanzó a confirmar, no se cancela: se registra el pago.
    if (o.pid && stripe) {
      const pi = await stripe.paymentIntents.retrieve(o.pid);
      if (pi.status === 'succeeded') { await finalizePayment(id, pi); return res.status(409).json({ error: 'Este pedido ya fue pagado' }); }
    }
    await conn.beginTransaction();
    const ok = await cancelPendingOrder(conn, id);
    if (!ok) { await conn.rollback(); return res.status(409).json({ error: 'Solo se pueden cancelar pedidos sin pagar' }); }
    await conn.commit();
    if (o.pid && stripe) await stripe.paymentIntents.cancel(o.pid).catch(() => {});   // el cobro ya no se podrá completar
    res.json({ ok: true });
  } catch (err) { try { await conn.rollback(); } catch {} console.error(err); res.status(500).json({ error: 'Error al cancelar' }); }
  finally { conn.release(); }
});

export default router;
