import { Router } from 'express';

import { db } from '../config/db.js';

const router = Router();

router.get('/platforms', async (_req, res) => {
  try { const [rows]=await db.query(`SELECT id,name,slug,generation,manufacturer,release_year,hero_logo,hero_console_img,accent_color,secondary_color,short_description,is_published FROM platforms WHERE is_published=TRUE OR is_published IS NULL ORDER BY generation,name`); res.json(rows); }
  catch(err){console.error(err);res.status(500).json({error:'Error al listar consolas'});}
});

router.get('/platforms/:slug', async (req, res) => {
  try {
    const [[platform]]=await db.query(`SELECT * FROM platforms WHERE slug=? AND (is_published=TRUE OR is_published IS NULL)`,[req.params.slug]);
    if (!platform) return res.status(404).json({error:'Consola no encontrada'});
    ['key_features','tech_specs','gallery','trivia'].forEach(f=>{if(platform[f]&&typeof platform[f]==='string'){try{platform[f]=JSON.parse(platform[f]);}catch{platform[f]=[];}}if(!Array.isArray(platform[f]))platform[f]=[];});
    let featuredGames=[]; try{const[rows]=await db.query(`SELECT g.id,g.title,g.slug,g.cover_image,g.release_year,g.has_featured_page,er.score_overall AS emilio_score,er.is_gem,er.is_essential,pfg.position,pfg.caption FROM platform_featured_games pfg JOIN games g ON g.id=pfg.game_id LEFT JOIN editorial_reviews er ON er.game_id=g.id WHERE pfg.platform_id=? AND g.is_published=TRUE ORDER BY pfg.position`,[platform.id]);featuredGames=rows;}catch{featuredGames=[];}
    const [topGames]=await db.query(`SELECT g.id,g.title,g.slug,g.cover_image,g.release_year,er.score_overall AS emilio_score FROM games g JOIN editorial_reviews er ON er.game_id=g.id WHERE g.platform_id=? AND g.is_published=TRUE ORDER BY er.score_overall DESC LIMIT 10`,[platform.id]);
    const [[{total_games}]]=await db.query(`SELECT COUNT(*) AS total_games FROM games WHERE platform_id=? AND is_published=TRUE`,[platform.id]);
    let timeline=[]; try{const[rows]=await db.query(`SELECT id,event_date,event_year,title,description,icon FROM platform_timeline WHERE platform_id=? ORDER BY event_year ASC,position ASC`,[platform.id]);timeline=rows;}catch{timeline=[];}
    res.json({...platform,featured_games:featuredGames,top_games:topGames,total_games,timeline});
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener consola'});}
});

export default router;
