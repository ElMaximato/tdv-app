import { Router } from 'express';

import { db } from '../config/db.js';

const router = Router();

router.get('/sagas', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, slug, name, short_description, cover_image,
             hero_image, accent_color, publisher, first_game_year,
             (SELECT COUNT(*) FROM saga_entries se WHERE se.saga_id = sagas.id) AS game_count
      FROM sagas WHERE is_published = TRUE ORDER BY name ASC
    `);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al listar sagas' }); }
});

router.get('/sagas/:slug', async (req, res) => {
  try {
    const [[saga]] = await db.query(`SELECT * FROM sagas WHERE slug = ? AND is_published = TRUE`, [req.params.slug]);
    if (!saga) return res.status(404).json({ error: 'Saga no encontrada' });
    const [entries] = await db.query(`
      SELECT se.id, se.position, se.is_essential, se.is_optional,
             se.emilio_verdict, se.play_reason, se.skip_reason,
             se.custom_title, se.custom_platform, se.custom_year,
             g.id AS game_id, g.title AS game_title, g.slug AS game_slug,
             g.cover_image AS game_cover, g.release_year, g.developer,
             p.name AS platform_name, er.score_overall AS emilio_score, er.summary AS game_summary
      FROM saga_entries se
      LEFT JOIN games g              ON g.id = se.game_id
      LEFT JOIN platforms p          ON p.id = g.platform_id
      LEFT JOIN editorial_reviews er ON er.game_id = g.id
      WHERE se.saga_id = ? ORDER BY se.position ASC
    `, [saga.id]);
    res.json({ ...saga, entries });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al obtener saga' }); }
});

export default router;
