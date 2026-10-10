import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/tierlist', adminRequired, async (_req, res) => {
  try {
    const [inTier] = await db.query(`
      SELECT te.id AS entry_id, te.tier, te.position,
             g.id, g.title, g.slug, g.cover_image, g.release_year,
             p.name AS platform, er.score_overall
      FROM tierlist_entries te
      JOIN games g              ON g.id = te.game_id
      JOIN platforms p          ON p.id = g.platform_id
      LEFT JOIN editorial_reviews er ON er.game_id = g.id
      WHERE g.is_published = TRUE
      ORDER BY FIELD(te.tier,'S','A','B','C','D'), te.position ASC
    `);

    // FIX: MySQL no soporta NULLS LAST — usamos (er.score_overall IS NULL), score_overall DESC
    const [available] = await db.query(`
      SELECT g.id, g.title, g.slug, g.cover_image, g.release_year,
             p.name AS platform, er.score_overall
      FROM games g
      JOIN platforms p ON p.id = g.platform_id
      LEFT JOIN editorial_reviews er ON er.game_id = g.id
      WHERE g.is_published = TRUE
        AND g.id NOT IN (SELECT game_id FROM tierlist_entries)
      ORDER BY (er.score_overall IS NULL), er.score_overall DESC, g.title ASC
    `);

    const grouped = { S: [], A: [], B: [], C: [], D: [] };
    inTier.forEach(r => { if (grouped[r.tier]) grouped[r.tier].push(r); });
    res.json({ tiers: grouped, available });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.put('/admin/tierlist', adminRequired, async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries debe ser un array' });
  const VALID_TIERS = ['S','A','B','C','D'];
  for (const e of entries) {
    if (!VALID_TIERS.includes(e.tier)) return res.status(400).json({ error: `Tier inválido: ${e.tier}` });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM tierlist_entries');
    if (entries.length > 0) {
      await conn.query('INSERT INTO tierlist_entries (game_id,tier,position) VALUES ?',
        [entries.map((e,i) => [e.game_id, e.tier, e.position ?? i])]);
    }
    await conn.commit();
    await logAudit(req.admin.id,'tierlist_save',req.ip,`${entries.length} entradas`);
    res.json({ ok: true });
  } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ error: 'Error al guardar tierlist' }); }
  finally { conn.release(); }
});

router.post('/admin/tierlist/entry', adminRequired, async (req, res) => {
  const { game_id, tier } = req.body;
  if (!game_id || !['S','A','B','C','D'].includes(tier)) return res.status(400).json({ error: 'game_id y tier son obligatorios' });
  try {
    const [[{ maxPos }]] = await db.query('SELECT COALESCE(MAX(position),0) AS maxPos FROM tierlist_entries WHERE tier = ?', [tier]);
    await db.query('INSERT INTO tierlist_entries (game_id,tier,position) VALUES (?,?,?) ON DUPLICATE KEY UPDATE tier=VALUES(tier),position=VALUES(position)', [game_id, tier, maxPos + 1]);
    await logAudit(req.admin.id,'tierlist_entry_add',req.ip,`Game ${game_id} → Tier ${tier}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al agregar' }); }
});

router.delete('/admin/tierlist/entry/:gameId', adminRequired, async (req, res) => {
  try {
    await db.query('DELETE FROM tierlist_entries WHERE game_id = ?', [req.params.gameId]);
    await logAudit(req.admin.id,'tierlist_entry_remove',req.ip,`Game ${req.params.gameId}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar' }); }
});

router.patch('/admin/tierlist/entry/:gameId', adminRequired, async (req, res) => {
  const { tier } = req.body;
  if (!['S','A','B','C','D'].includes(tier)) return res.status(400).json({ error: 'Tier inválido' });
  try {
    const [[{ maxPos }]] = await db.query('SELECT COALESCE(MAX(position),0) AS maxPos FROM tierlist_entries WHERE tier = ?', [tier]);
    await db.query('UPDATE tierlist_entries SET tier=?,position=? WHERE game_id=?', [tier, maxPos + 1, req.params.gameId]);
    await logAudit(req.admin.id,'tierlist_move',req.ip,`Game ${req.params.gameId} → ${tier}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al mover' }); }
});

export default router;
