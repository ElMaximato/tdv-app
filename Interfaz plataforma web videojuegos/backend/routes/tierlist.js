import { Router } from 'express';

import { db } from '../config/db.js';

const router = Router();

// Modo Score — agrupa juegos por su score_overall real de forma automática
router.get('/tierlist/scores', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.id, g.title, g.slug, g.cover_image, g.release_year,
             p.name AS platform, er.score_overall, er.is_gem, er.is_essential
      FROM games g
      JOIN editorial_reviews er ON er.game_id = g.id
      JOIN platforms p          ON p.id = g.platform_id
      WHERE g.is_published = TRUE AND er.score_overall IS NOT NULL
      ORDER BY er.score_overall DESC, g.title ASC
    `);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener scores' }); }
});

// Modo Tier clásico — S/A/B/C/D asignado manualmente por Emilio
router.get('/tierlist/tiers', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT te.tier, te.position, g.id, g.title, g.slug,
             g.cover_image, g.release_year, p.name AS platform,
             er.score_overall, er.is_gem, er.is_essential
      FROM tierlist_entries te
      JOIN games g              ON g.id = te.game_id
      JOIN platforms p          ON p.id = g.platform_id
      LEFT JOIN editorial_reviews er ON er.game_id = g.id
      WHERE g.is_published = TRUE
      ORDER BY FIELD(te.tier,'S','A','B','C','D'), te.position ASC
    `);
    // Agrupar por tier
    const grouped = { S: [], A: [], B: [], C: [], D: [] };
    rows.forEach(r => { if (grouped[r.tier]) grouped[r.tier].push(r); });
    res.json(grouped);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener tierlist' }); }
});

export default router;
