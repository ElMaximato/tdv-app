import { Router } from 'express';

import { db } from '../config/db.js';
import { bearerToken, verifyUser } from '../middleware/auth.js';

const router = Router();

// Sesión opcional: la lista y el detalle son públicos, pero si hay sesión se marca cuáles son favoritos y tu voto.
function optionalUserId(req) {
  const token = bearerToken(req) || req.cookies?.tdv_token;
  if (!token) return null;
  try { return verifyUser(token).id; } catch { return null; }
}

router.get('/games', async (req, res) => {
  try {
    const page=Math.max(1,parseInt(req.query.page)||1), limit=Math.min(100,parseInt(req.query.limit)||20), offset=(page-1)*limit;
    // El ranking se ordena por defecto con la nota de Emilio. La nota de la gente es aparte (community_avg).
    const allowed=['emilio_score','community_avg','release_year','composite_score','title'];
    const sort=allowed.includes(req.query.sort)?req.query.sort:'emilio_score';
    const dir=(req.query.order||'').toLowerCase()==='asc'?'ASC':(sort==='title'&&!req.query.order?'ASC':'DESC');
    const uid=optionalUserId(req);
    const conditions=['1=1'], params=[];
    if (req.query.platform)         { conditions.push('platform_slug = ?');  params.push(req.query.platform); }
    if (req.query.gem==='true')       conditions.push('is_gem = 1');
    if (req.query.essential==='true') conditions.push('is_essential = 1');
    if (req.query.year_from)        { conditions.push('release_year >= ?');  params.push(parseInt(req.query.year_from)); }
    if (req.query.year_to)          { conditions.push('release_year <= ?');  params.push(parseInt(req.query.year_to)); }
    if (req.query.q)                { conditions.push('title LIKE ?');       params.push(`%${req.query.q}%`); }
    if (sort==='community_avg')       conditions.push('community_avg IS NOT NULL');   // "por la gente": solo juegos con votos
    const where=conditions.join(' AND ');
    let from='FROM v_rankings', fromParams=[];
    if (req.query.genre) { from=`FROM v_rankings JOIN game_genres gg ON gg.game_id=v_rankings.id JOIN genres gn ON gn.id=gg.genre_id AND gn.slug=?`; fromParams=[req.query.genre]; }
    const favSel = uid ? 'EXISTS(SELECT 1 FROM favorites f WHERE f.user_id=? AND f.game_id=v_rankings.id)' : '0';
    const selParams = uid ? [uid] : [];
    const order = `ORDER BY v_rankings.${sort} ${dir}, v_rankings.emilio_score DESC, v_rankings.id`;
    const [rows]=await db.query(`SELECT v_rankings.*, ${favSel} AS is_favorite ${from} WHERE ${where} ${order} LIMIT ? OFFSET ?`,[...selParams,...fromParams,...params,limit,offset]);
    const [[{total}]]=await db.query(`SELECT COUNT(*) AS total ${from} WHERE ${where}`,[...fromParams,...params]);
    res.json({ data:rows.map(r=>({...r,is_favorite:!!Number(r.is_favorite)})), meta:{page,limit,total,pages:Math.ceil(total/limit)} });
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener rankings'});}
});

router.get('/games/:slug', async (req, res) => {
  try {
    const [[game]] = await db.query(`
      SELECT g.*, p.name AS platform_name, p.slug AS platform_slug,
             er.score_gameplay, er.score_story, er.score_graphics, er.score_soundtrack, er.score_longevity,
             er.score_overall, er.summary, er.review_body, er.personal_note,
             er.played_year, er.hours_played, er.is_gem, er.is_essential, er.emilio_rank,
             ROUND(AVG(cv.score),1) AS community_avg, COUNT(cv.id) AS vote_count,
             fp.hero_image, fp.trailer_url, fp.tagline, fp.long_description,
             fp.press_quotes, fp.screenshots, fp.feature_highlights, fp.accent_color
      FROM games g
      JOIN platforms p              ON p.id = g.platform_id
      LEFT JOIN editorial_reviews er ON er.game_id = g.id
      LEFT JOIN community_votes cv   ON cv.game_id = g.id
      LEFT JOIN featured_pages fp    ON fp.game_id = g.id
      WHERE g.slug = ? AND g.is_published = TRUE
      GROUP BY g.id
    `, [req.params.slug]);
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    const [genres] = await db.query(`SELECT gn.name, gn.slug FROM genres gn JOIN game_genres gg ON gg.genre_id=gn.id WHERE gg.game_id=?`, [game.id]);
    ['press_quotes','screenshots','feature_highlights'].forEach(f => {
      if (game[f] && typeof game[f]==='string') { try{game[f]=JSON.parse(game[f]);}catch{game[f]=[];} }
    });
    let my_vote = null, is_favorite = false;
    const uid = optionalUserId(req);
    if (uid) {
      const [[v]] = await db.query('SELECT score FROM community_votes WHERE game_id=? AND user_id=?', [game.id, uid]);
      my_vote = v ? Number(v.score) : null;
      const [[f]] = await db.query('SELECT 1 AS x FROM favorites WHERE game_id=? AND user_id=?', [game.id, uid]);
      is_favorite = !!f;
    }
    res.json({...game, genres, my_vote, is_favorite});
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener el juego'});}
});

router.get('/genres', async (_req, res) => {
  try { const [rows]=await db.query('SELECT id, name, slug FROM genres ORDER BY name'); res.json(rows); }
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

export default router;
