import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';
import { notifyMany } from '../../utils/notify.js';

const router = Router();

// Qué tipos puede mandar un admin a mano (order_status lo genera el sistema al cambiar un pedido).
const ADMIN_TYPES = ['new_drop', 'new_review', 'general'];

// Enviar un aviso: a todos los usuarios, o solo a uno si se manda user_id.
//   { "title": "¡Nuevo drop!", "body": "Ya salió el hoodie retro", "type": "new_drop", "data": {"slug":"hoodie-tdv-retro"} }
// `data` es lo que la app usa para abrir la pantalla correcta al tocar el aviso.
router.post('/admin/notifications/send', adminRequired, async (req, res) => {
  const { title, body, type = 'general', user_id, data } = req.body || {};
  const t = typeof title === 'string' ? title.trim() : '';
  const b = typeof body === 'string' ? body.trim() : '';
  if (!t || !b) return res.status(400).json({ error: 'title y body son obligatorios' });
  if (t.length > 120 || b.length > 300) return res.status(400).json({ error: 'Máximo 120 caracteres en el título y 300 en el mensaje' });
  if (!ADMIN_TYPES.includes(type)) return res.status(400).json({ error: `type debe ser: ${ADMIN_TYPES.join(', ')}` });
  if (data !== undefined && (data === null || typeof data !== 'object' || Array.isArray(data) || JSON.stringify(data).length > 1000))
    return res.status(400).json({ error: 'data debe ser un objeto pequeño' });
  try {
    let ids;
    if (user_id !== undefined) {
      const uid = parseInt(user_id);
      const [[u]] = await db.query('SELECT id FROM users WHERE id=?', [uid || 0]);
      if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
      ids = [u.id];
    } else {
      const [rows] = await db.query('SELECT id FROM users');
      ids = rows.map(r => r.id);
    }
    const result = await notifyMany(ids, { type, title: t, body: b, data: data || null });
    await logAudit(req.admin.id, 'notification_send', req.ip, `${type} a ${user_id !== undefined ? `usuario ${ids[0]}` : `${ids.length} usuarios`}: ${t}`.slice(0, 500));
    res.json({ ok: true, recipients: result.recipients, push: result.push });
  } catch (err) { console.error(err); res.status(500).json({ error: 'No se pudo enviar el aviso' }); }
});

export default router;
