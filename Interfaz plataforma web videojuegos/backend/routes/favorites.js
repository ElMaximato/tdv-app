import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// "Quiero jugarlo": lista de favoritos del usuario (misma forma que /games para reusar la tarjeta).
router.get('/favorites', authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, 1 AS is_favorite FROM favorites f JOIN v_rankings v ON v.id=f.game_id
       WHERE f.user_id=? ORDER BY f.created_at DESC`, [req.user.id]);
    res.json(rows.map(r => ({ ...r, is_favorite: true })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener tus favoritos' }); }
});

router.post('/games/:id/favorite', authRequired, async (req, res) => {
  const gameId = parseInt(req.params.id);
  if (!Number.isInteger(gameId) || gameId < 1) return res.status(400).json({ error: 'Juego inválido' });
  try {
    const [[g]] = await db.query('SELECT id FROM games WHERE id=? AND is_published=1', [gameId]);
    if (!g) return res.status(404).json({ error: 'Juego no encontrado' });
    await db.query('INSERT IGNORE INTO favorites (user_id, game_id) VALUES (?,?)', [req.user.id, gameId]);
    res.json({ ok: true, is_favorite: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al guardar el favorito' }); }
});

router.delete('/games/:id/favorite', authRequired, async (req, res) => {
  const gameId = parseInt(req.params.id);
  if (!Number.isInteger(gameId) || gameId < 1) return res.status(400).json({ error: 'Juego inválido' });
  try {
    await db.query('DELETE FROM favorites WHERE user_id=? AND game_id=?', [req.user.id, gameId]);
    res.json({ ok: true, is_favorite: false });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al quitar el favorito' }); }
});

export default router;
