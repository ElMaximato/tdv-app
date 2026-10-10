import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { isExpoToken } from '../utils/push.js';

const router = Router();

// ── Registro del celular para recibir push ────────────────────
// La app obtiene su token de Expo (getExpoPushTokenAsync) y lo manda aquí al iniciar sesión.
router.post('/push/register', authRequired, async (req, res) => {
  const { token, device_name, platform } = req.body || {};
  if (!isExpoToken(token)) return res.status(400).json({ error: 'Token de notificaciones inválido' });
  const plat = platform === 'ios' ? 'ios' : 'android';
  const name = typeof device_name === 'string' ? device_name.trim().slice(0, 120) || null : null;
  try {
    // Si el mismo celular inicia sesión con otra cuenta, el token pasa a la cuenta nueva.
    await db.query(
      `INSERT INTO push_tokens (user_id,token,platform,device_name,is_active) VALUES (?,?,?,?,1)
       ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), platform=VALUES(platform), device_name=VALUES(device_name), is_active=1`,
      [req.user.id, token, plat, name]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'No se pudo registrar el dispositivo' }); }
});

// Al cerrar sesión la app llama aquí para que ese celular deje de recibir avisos de esta cuenta.
router.post('/push/unregister', authRequired, async (req, res) => {
  const { token } = req.body || {};
  if (!isExpoToken(token)) return res.status(400).json({ error: 'Token de notificaciones inválido' });
  try {
    await db.query('UPDATE push_tokens SET is_active=0 WHERE token=? AND user_id=?', [token, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'No se pudo dar de baja el dispositivo' }); }
});

// ── Bandeja de avisos ─────────────────────────────────────────
router.get('/notifications', authRequired, async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
  const unreadOnly = req.query.unread === 'true';
  try {
    const [rows] = await db.query(
      `SELECT id,type,title,body,data,created_at,read_at FROM notifications
       WHERE user_id=? ${unreadOnly ? 'AND read_at IS NULL' : ''} ORDER BY id DESC LIMIT ?`, [req.user.id, limit]);
    const [[{ unread }]] = await db.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id=? AND read_at IS NULL', [req.user.id]);
    res.json({ unread_count: unread, items: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener tus avisos' }); }
});

router.get('/notifications/unread-count', authRequired, async (req, res) => {
  try {
    const [[{ unread }]] = await db.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id=? AND read_at IS NULL', [req.user.id]);
    res.json({ unread_count: unread });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.post('/notifications/read-all', authRequired, async (req, res) => {
  try {
    const [r] = await db.query('UPDATE notifications SET read_at=NOW() WHERE user_id=? AND read_at IS NULL', [req.user.id]);
    res.json({ ok: true, updated: r.affectedRows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.post('/notifications/:id/read', authRequired, async (req, res) => {
  try {
    const [[n]] = await db.query('SELECT id FROM notifications WHERE id=? AND user_id=?', [parseInt(req.params.id) || 0, req.user.id]);
    if (!n) return res.status(404).json({ error: 'Aviso no encontrado' });
    await db.query('UPDATE notifications SET read_at=COALESCE(read_at, NOW()) WHERE id=?', [n.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

export default router;
