import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired, superAdminOnly } from '../../middleware/auth.js';
import { sagaUpload, validateUploadedFiles } from '../../middleware/upload.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/sagas', adminRequired, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.slug, s.name, s.is_published, s.accent_color,
             s.cover_image, s.publisher, s.created_at, s.updated_at,
             COUNT(se.id) AS game_count
      FROM sagas s LEFT JOIN saga_entries se ON se.saga_id = s.id
      GROUP BY s.id ORDER BY s.updated_at DESC
    `);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.get('/admin/sagas/:id', adminRequired, async (req, res) => {
  try {
    const [[saga]] = await db.query(`SELECT * FROM sagas WHERE id = ?`, [req.params.id]);
    if (!saga) return res.status(404).json({ error: 'No encontrada' });
    const [entries] = await db.query(`
      SELECT se.*, g.title AS game_title, g.slug AS game_slug, g.cover_image AS game_cover,
             g.release_year, p.name AS platform_name
      FROM saga_entries se
      LEFT JOIN games g     ON g.id = se.game_id
      LEFT JOIN platforms p ON p.id = g.platform_id
      WHERE se.saga_id = ? ORDER BY se.position ASC
    `, [req.params.id]);
    res.json({ ...saga, entries });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.post('/admin/sagas', adminRequired, sagaUpload, validateUploadedFiles, async (req, res) => {
  const { name, short_description, intro_text, emilio_note, accent_color, publisher, first_game_year } = req.body;
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const cover = req.files?.saga_cover?.[0] ? `sagas/${req.files.saga_cover[0].filename}` : null;
  const hero  = req.files?.saga_hero?.[0]  ? `sagas/${req.files.saga_hero[0].filename}`  : null;
  try {
    const [result] = await db.query(`INSERT INTO sagas (slug,name,short_description,intro_text,emilio_note,cover_image,hero_image,accent_color,publisher,first_game_year,is_published) VALUES (?,?,?,?,?,?,?,?,?,?,FALSE)`,
      [slug,name,short_description||null,intro_text||null,emilio_note||null,cover,hero,accent_color||'#e60012',publisher||null,first_game_year||null]);
    await logAudit(req.admin.id,'saga_create',req.ip,`ID ${result.insertId}: ${name}`);
    res.status(201).json({ id: result.insertId, slug });
  } catch (err) {
    if (err.code==='ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una saga con ese nombre' });
    console.error(err); res.status(500).json({ error: 'Error al crear saga' });
  }
});

router.put('/admin/sagas/:id', adminRequired, sagaUpload, validateUploadedFiles, async (req, res) => {
  const fields = ['name','short_description','intro_text','emilio_note','accent_color','publisher','first_game_year'];
  const updates = [], params = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]||null); } });
  if (req.files?.saga_cover?.[0]) { updates.push('cover_image = ?'); params.push(`sagas/${req.files.saga_cover[0].filename}`); }
  if (req.files?.saga_hero?.[0])  { updates.push('hero_image = ?');  params.push(`sagas/${req.files.saga_hero[0].filename}`); }
  if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });
  try {
    params.push(req.params.id);
    await db.query(`UPDATE sagas SET ${updates.join(', ')} WHERE id = ?`, params);
    await logAudit(req.admin.id,'saga_update',req.ip,`ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar saga' }); }
});

router.patch('/admin/sagas/:id/publish', adminRequired, async (req, res) => {
  const { published } = req.body;
  try {
    if (published) await db.query(`UPDATE sagas SET is_published=TRUE, published_at=COALESCE(published_at,NOW()) WHERE id=?`, [req.params.id]);
    else           await db.query(`UPDATE sagas SET is_published=FALSE WHERE id=?`, [req.params.id]);
    await logAudit(req.admin.id, published?'saga_publish':'saga_unpublish', req.ip, `ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.delete('/admin/sagas/:id', adminRequired, superAdminOnly, async (req, res) => {
  try {
    const [[saga]] = await db.query('SELECT name FROM sagas WHERE id = ?', [req.params.id]);
    if (!saga) return res.status(404).json({ error: 'No encontrada' });
    await db.query('DELETE FROM sagas WHERE id = ?', [req.params.id]);
    await logAudit(req.admin.id,'saga_delete',req.ip,`ID ${req.params.id}: ${saga.name}`);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar' }); }
});

router.put('/admin/sagas/:id/entries', adminRequired, async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries debe ser un array' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM saga_entries WHERE saga_id = ?', [req.params.id]);
    if (entries.length > 0) {
      const values = entries.map((e,i) => [req.params.id,e.game_id||null,e.position??i+1,e.custom_title||null,e.custom_platform||null,e.custom_year||null,e.emilio_verdict||null,e.play_reason||null,e.is_essential?1:0,e.is_optional?1:0,e.skip_reason||null]);
      await conn.query(`INSERT INTO saga_entries (saga_id,game_id,position,custom_title,custom_platform,custom_year,emilio_verdict,play_reason,is_essential,is_optional,skip_reason) VALUES ?`, [values]);
    }
    await conn.commit();
    await logAudit(req.admin.id,'saga_entries_save',req.ip,`Saga ID ${req.params.id} (${entries.length} entradas)`);
    res.json({ ok: true });
  } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ error: 'Error al guardar entradas' }); }
  finally { conn.release(); }
});

export default router;
