import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { fetchOrder, orderCode } from '../../services/orders.js';
import { logAudit } from '../../utils/audit.js';
import { notifyUser } from '../../utils/notify.js';

const router = Router();

// ── Admin: pedidos ────────────────────────────────────────────
router.get('/admin/orders', adminRequired, async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const status = req.query.status;
  try {
    const [rows] = await db.query(
      `SELECT o.id,o.status,o.total_cents,o.currency,o.created_at,o.paid_at,o.tracking_number,u.username,u.email,
              (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id=o.id) AS item_count
       FROM orders o JOIN users u ON u.id=o.user_id
       ${status ? 'WHERE o.status=?' : ''} ORDER BY o.id DESC LIMIT ?`,
      status ? [status, limit] : [limit]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al listar pedidos' }); }
});

router.get('/admin/orders/:id', adminRequired, async (req, res) => {
  try {
    const order = await fetchOrder(parseInt(req.params.id) || 0);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

// El pedido solo avanza: paid → processing → shipped → delivered (se puede saltar pasos, no retroceder).
const ORDER_RANK  = { paid: 1, processing: 2, shipped: 3, delivered: 4 };
const ORDER_NOTIF = {
  processing: { title: 'Preparando tu pedido 📦', body: (code) => `Estamos empacando tu pedido ${code}.` },
  shipped:    { title: 'Tu pedido va en camino 🚚', body: (code) => `Tu pedido ${code} ya salió. ¡Pronto lo tendrás!` },
  delivered:  { title: 'Pedido entregado 🎮', body: (code) => `Tu pedido ${code} fue entregado. ¡Disfruta tu merch!` },
};
router.patch('/admin/orders/:id/status', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id) || 0;
  const { status, tracking_number } = req.body || {};
  if (!ORDER_NOTIF[status]) return res.status(400).json({ error: 'Estado inválido. Usa processing, shipped o delivered.' });
  try {
    const [[o]] = await db.query('SELECT id,user_id,status FROM orders WHERE id=?', [id]);
    if (!o) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (!ORDER_RANK[o.status]) return res.status(409).json({ error: `El pedido está en "${o.status}" y no se puede avanzar` });
    if (ORDER_RANK[status] <= ORDER_RANK[o.status]) return res.status(409).json({ error: `El pedido ya está en "${o.status}"` });
    const track = typeof tracking_number === 'string' && tracking_number.trim() ? tracking_number.trim().slice(0, 80) : null;
    await db.query('UPDATE orders SET status=?, tracking_number=COALESCE(?, tracking_number) WHERE id=?', [status, track, id]);
    await logAudit(req.admin.id, 'order_status', req.ip, `Pedido ${id}: ${o.status} → ${status}`);
    const n = ORDER_NOTIF[status];
    await notifyUser(o.user_id, { type: 'order_status', title: n.title, body: n.body(await orderCode(id)), data: { orderId: id, status } });
    res.json({ ok: true, status });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar el pedido' }); }
});

export default router;
