import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/user/profile', authRequired, async (req, res) => {
  try {
    const [[user]] = await db.query(`
      SELECT id, username, email, role, avatar, avatar_id, banner_id,
             bio, is_verified, email_verified, created_at,
             fav_console, fav_game_id, fav_game_title
      FROM users WHERE id = ?
    `, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [[{ vote_count }]] = await db.query('SELECT COUNT(*) AS vote_count FROM community_votes WHERE user_id = ?', [req.user.id]);
    const [quizAttempts] = await db.query('SELECT score, total, passed, attempted_at FROM quiz_attempts WHERE user_id = ? ORDER BY attempted_at DESC LIMIT 10', [req.user.id]);

    let top5 = [];
    try {
      const [rows] = await db.query(`
        SELECT ut.position, g.id AS game_id, g.title, g.slug, g.cover_image, g.release_year, p.name AS platform
        FROM user_top5 ut
        JOIN games g ON g.id = ut.game_id JOIN platforms p ON p.id = g.platform_id
        WHERE ut.user_id = ? ORDER BY ut.position
      `, [req.user.id]);
      top5 = rows;
    } catch { top5 = []; }

    let favConsoleData = null;
    if (user.fav_console) {
      try { const [[c]] = await db.query('SELECT name, slug, hero_logo, accent_color FROM platforms WHERE slug = ?', [user.fav_console]); favConsoleData = c ?? null; } catch {}
    }
    let favGameData = null;
    if (user.fav_game_id) {
      try { const [[g]] = await db.query('SELECT id, title, slug, cover_image FROM games WHERE id = ?', [user.fav_game_id]); favGameData = g ?? null; } catch {}
    }

    res.json({
      ...user,
      stats: { vote_count, quiz_attempts: quizAttempts.length, quiz_passed: quizAttempts.filter(q => q.passed).length },
      quiz_history: quizAttempts,
      top5,
      fav_console_data: favConsoleData,
      fav_game_data:    favGameData,
    });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Error al obtener perfil' }); }
});

// Avatares válidos — agrega aquí cuando subas nuevos PNGs
const VALID_AVATARS = [
  'mario', 'link', 'yoshi', 'donkey-kong', 'samus',
  'pikachu', 'fox', 'kirby', 'luigi', 'toad', 'bowser', 'peach',
  // Agrega aquí: 'toon-link', 'ganondorf', etc.
];

router.patch('/user/avatar', authRequired, async (req, res) => {
  const { avatar_id } = req.body;
  if (!avatar_id || typeof avatar_id !== 'string') return res.status(400).json({ error: 'avatar_id es obligatorio' });
  if (!VALID_AVATARS.includes(avatar_id)) return res.status(400).json({ error: 'Avatar no válido' });
  try { await db.query('UPDATE users SET avatar_id = ? WHERE id = ?', [avatar_id, req.user.id]); res.json({ ok: true, avatar_id }); }
  catch(err) { console.error(err); res.status(500).json({ error: 'Error al actualizar avatar' }); }
});

// Bio del perfil (máx. 200 caracteres; vacía = se borra)
router.patch('/user/bio', authRequired, async (req, res) => {
  const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim().slice(0, 200) : null;
  if (bio === null) return res.status(400).json({ error: 'bio debe ser texto' });
  try { await db.query('UPDATE users SET bio = ? WHERE id = ?', [bio || null, req.user.id]); res.json({ ok: true, bio }); }
  catch(err) { console.error(err); res.status(500).json({ error: 'Error al actualizar la bio' }); }
});

router.patch('/user/banner', authRequired, async (req, res) => {
  const { banner_id } = req.body;
  if (!banner_id || typeof banner_id !== 'string') return res.status(400).json({ error: 'banner_id es obligatorio' });
  try { await db.query('UPDATE users SET banner_id = ? WHERE id = ?', [banner_id, req.user.id]); res.json({ ok: true, banner_id }); }
  catch(err) { console.error(err); res.status(500).json({ error: 'Error al actualizar banner' }); }
});

router.patch('/user/fav-console', authRequired, async (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: 'slug es obligatorio' });
  try {
    const [[platform]] = await db.query('SELECT slug, name FROM platforms WHERE slug = ?', [slug]);
    if (!platform) return res.status(404).json({ error: 'Consola no encontrada' });
    await db.query('UPDATE users SET fav_console = ? WHERE id = ?', [slug, req.user.id]);
    res.json({ ok: true, fav_console: slug });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Error al actualizar consola favorita' }); }
});

router.patch('/user/fav-game', authRequired, async (req, res) => {
  const { game_id } = req.body;
  if (!game_id) return res.status(400).json({ error: 'game_id es obligatorio' });
  try {
    const [[game]] = await db.query('SELECT id, title FROM games WHERE id = ? AND is_published = TRUE', [game_id]);
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    await db.query('UPDATE users SET fav_game_id = ?, fav_game_title = ? WHERE id = ?', [game.id, game.title, req.user.id]);
    res.json({ ok: true, fav_game_id: game.id, fav_game_title: game.title });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Error al actualizar juego favorito' }); }
});

router.get('/user/top5', authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ut.position, g.id AS game_id, g.title, g.slug, g.cover_image, g.release_year, p.name AS platform
      FROM user_top5 ut JOIN games g ON g.id = ut.game_id JOIN platforms p ON p.id = g.platform_id
      WHERE ut.user_id = ? ORDER BY ut.position
    `, [req.user.id]);
    res.json(rows);
  } catch(err) { console.error(err); res.status(500).json({ error: 'Error al obtener top 5' }); }
});

router.put('/user/top5', authRequired, async (req, res) => {
  const { game_ids } = req.body;
  if (!Array.isArray(game_ids) || game_ids.length > 5) return res.status(400).json({ error: 'game_ids debe ser un array de máximo 5 elementos' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM user_top5 WHERE user_id = ?', [req.user.id]);
    if (game_ids.length > 0) await conn.query('INSERT INTO user_top5 (user_id, game_id, position) VALUES ?', [game_ids.map((id,i) => [req.user.id, id, i+1])]);
    await conn.commit(); res.json({ ok: true });
  } catch(err) { await conn.rollback(); console.error(err); res.status(500).json({ error: 'Error al guardar top 5' }); }
  finally { conn.release(); }
});

export default router;
