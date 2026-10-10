import { Router } from 'express';

import { db } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// La nota de la comunidad es APARTE de la de Emilio: no cambia el orden del ranking.
// Cualquier usuario con sesión puede votar (un voto por juego, se puede cambiar o quitar).
async function communityStats(gameId) {
  const [[r]] = await db.query('SELECT ROUND(AVG(score),1) AS community_avg, COUNT(*) AS vote_count FROM community_votes WHERE game_id=?', [gameId]);
  return { community_avg: r.community_avg == null ? null : Number(r.community_avg), vote_count: Number(r.vote_count) };
}
const parseGameId = (req) => { const n = parseInt(req.params.id); return Number.isInteger(n) && n > 0 ? n : null; };

router.get('/games/:id/vote', authRequired, async (req, res) => {
  const gameId = parseGameId(req);
  if (!gameId) return res.status(400).json({ error: 'Juego inválido' });
  try {
    const [[v]] = await db.query('SELECT score FROM community_votes WHERE game_id=? AND user_id=?', [gameId, req.user.id]);
    res.json({ score: v ? Number(v.score) : null });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al consultar tu voto' }); }
});

router.post('/games/:id/vote', authRequired, async (req, res) => {
  // Escala 0-100 (igual que la nota de Emilio). Un decimal como máximo.
  const score = Number(req.body.score);
  if (req.body.score == null || req.body.score === '' || !Number.isFinite(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'El score debe ser un número entre 0 y 100' });
  }
  const gameId = parseGameId(req);
  if (!gameId) return res.status(400).json({ error: 'Juego inválido' });
  try {
    const [[game]] = await db.query('SELECT id FROM games WHERE id=? AND is_published=TRUE', [gameId]);
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    const mine = Math.round(score * 10) / 10;
    await db.query('INSERT INTO community_votes (game_id,user_id,score) VALUES (?,?,?) ON DUPLICATE KEY UPDATE score=VALUES(score)', [gameId, req.user.id, mine]);
    res.json({ ok: true, score: mine, ...(await communityStats(gameId)) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al votar' }); }
});

router.delete('/games/:id/vote', authRequired, async (req, res) => {
  const gameId = parseGameId(req);
  if (!gameId) return res.status(400).json({ error: 'Juego inválido' });
  try {
    await db.query('DELETE FROM community_votes WHERE game_id=? AND user_id=?', [gameId, req.user.id]);
    res.json({ ok: true, score: null, ...(await communityStats(gameId)) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al quitar tu voto' }); }
});

export default router;
