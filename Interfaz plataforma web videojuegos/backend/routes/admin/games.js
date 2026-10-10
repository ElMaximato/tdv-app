import fs from 'fs';
import path from 'path';
import { Router } from 'express';

import { db } from '../../config/db.js';
import { ROOT_DIR } from '../../config/paths.js';
import { adminRequired, superAdminOnly } from '../../middleware/auth.js';
import { upload, validateUploadedFiles } from '../../middleware/upload.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/games', adminRequired, async (req, res) => {
  const page=Math.max(1,parseInt(req.query.page)||1),limit=Math.min(50,parseInt(req.query.limit)||20),offset=(page-1)*limit;
  const status=req.query.status,q=req.query.q||'';
  const conditions=['1=1'],params=[];
  if(status==='published')conditions.push('g.is_published=TRUE');
  if(status==='draft')conditions.push('g.is_published=FALSE');
  if(q){conditions.push('g.title LIKE ?');params.push(`%${q}%`);}
  const where=conditions.join(' AND ');
  try {
    const [games]=await db.query(`SELECT g.id,g.title,g.slug,g.release_year,g.cover_image,g.is_published,g.created_at,p.name AS platform,p.slug AS platform_slug,er.score_overall AS emilio_score,er.is_gem,er.is_essential FROM games g JOIN platforms p ON p.id=g.platform_id LEFT JOIN editorial_reviews er ON er.game_id=g.id WHERE ${where} ORDER BY g.updated_at DESC LIMIT ? OFFSET ?`,[...params,limit,offset]);
    const [[{total}]]=await db.query(`SELECT COUNT(*) AS total FROM games g WHERE ${where}`,params);
    res.json({data:games,meta:{page,limit,total,pages:Math.ceil(total/limit)}});
  } catch(err){console.error(err);res.status(500).json({error:'Error al listar juegos'});}
});

router.get('/admin/games/:id', adminRequired, async (req, res) => {
  try {
    const [[game]]=await db.query(`SELECT g.*,p.name AS platform_name,p.slug AS platform_slug,er.*,g.id AS id FROM games g JOIN platforms p ON p.id=g.platform_id LEFT JOIN editorial_reviews er ON er.game_id=g.id WHERE g.id=?`,[req.params.id]);
    if (!game) return res.status(404).json({error:'No encontrado'});
    const [genres]=await db.query(`SELECT gn.id,gn.name,gn.slug FROM genres gn JOIN game_genres gg ON gg.genre_id=gn.id WHERE gg.game_id=?`,[req.params.id]);
    res.json({...game,genres});
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener juego'});}
});

router.post('/admin/games', adminRequired, upload.single('cover'), validateUploadedFiles, async (req, res) => {
  const {title,platform_id,release_year,developer,publisher,description,gamerankings_score,metacritic_score,genres}=req.body;
  if (!title||!platform_id) return res.status(400).json({error:'title y platform_id son obligatorios'});
  const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const cover=req.file?`covers/${req.file.filename}`:null;
  try {
    const [result]=await db.query(`INSERT INTO games (title,slug,platform_id,release_year,developer,publisher,cover_image,description,gamerankings_score,metacritic_score,is_published) VALUES (?,?,?,?,?,?,?,?,?,?,FALSE)`,[title,slug,platform_id,release_year||null,developer||null,publisher||null,cover,description||null,gamerankings_score||null,metacritic_score||null]);
    const gameId=result.insertId;
    if (genres){const ids=typeof genres==='string'?JSON.parse(genres):genres;if(Array.isArray(ids)&&ids.length>0)await db.query('INSERT IGNORE INTO game_genres (game_id,genre_id) VALUES ?',[ids.map(gid=>[gameId,gid])]);}
    await logAudit(req.admin.id,'game_create',req.ip,`ID ${gameId}: ${title}`);
    res.status(201).json({id:gameId,slug});
  } catch(err){if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'Ya existe un juego con ese título'});console.error(err);res.status(500).json({error:'Error al crear juego'});}
});

router.put('/admin/games/:id', adminRequired, upload.single('cover'), validateUploadedFiles, async (req, res) => {
  const fields=['title','platform_id','release_year','developer','publisher','description','gamerankings_score','metacritic_score'];
  const updates=[],params=[];
  // '' → NULL, pero un 0 legítimo (p. ej. nota 0) se conserva
  fields.forEach(f=>{if(req.body[f]!==undefined){updates.push(`${f}=?`);params.push(req.body[f]===''?null:req.body[f]);}});
  if(req.file){updates.push('cover_image=?');params.push(`covers/${req.file.filename}`);}
  if(!updates.length&&!req.body.genres) return res.status(400).json({error:'Nada que actualizar'});
  try {
    if(updates.length>0){params.push(req.params.id);await db.query(`UPDATE games SET ${updates.join(',')} WHERE id=?`,params);}
    if(req.body.genres){const ids=typeof req.body.genres==='string'?JSON.parse(req.body.genres):req.body.genres;await db.query('DELETE FROM game_genres WHERE game_id=?',[req.params.id]);if(Array.isArray(ids)&&ids.length>0)await db.query('INSERT IGNORE INTO game_genres (game_id,genre_id) VALUES ?',[ids.map(gid=>[req.params.id,gid])]);}
    await logAudit(req.admin.id,'game_update',req.ip,`ID ${req.params.id}`);res.json({ok:true});
  } catch(err){console.error(err);res.status(500).json({error:'Error al actualizar'});}
});

router.patch('/admin/games/:id/publish', adminRequired, async (req, res) => {
  const {published}=req.body;
  try{await db.query('UPDATE games SET is_published=? WHERE id=?',[!!published,req.params.id]);await logAudit(req.admin.id,published?'game_publish':'game_unpublish',req.ip,`ID ${req.params.id}`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.delete('/admin/games/:id', adminRequired, superAdminOnly, async (req, res) => {
  try {
    const [[game]]=await db.query('SELECT title,cover_image FROM games WHERE id=?',[req.params.id]);
    if(!game) return res.status(404).json({error:'No encontrado'});
    await db.query('DELETE FROM games WHERE id=?',[req.params.id]);
    if(game.cover_image&&!game.cover_image.startsWith('http')){const fp=path.join(ROOT_DIR,'uploads',game.cover_image);if(fs.existsSync(fp))fs.unlinkSync(fp);}
    await logAudit(req.admin.id,'game_delete',req.ip,`ID ${req.params.id}: ${game.title}`);res.json({ok:true});
  } catch(err){console.error(err);res.status(500).json({error:'Error al eliminar'});}
});

router.post('/admin/genres', adminRequired, async(req,res)=>{const{name,slug}=req.body;if(!name||!slug)return res.status(400).json({error:'name y slug obligatorios'});try{const[r]=await db.query('INSERT INTO genres (name,slug) VALUES (?,?)',[name,slug]);res.status(201).json({id:r.insertId});}catch(err){if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'Género ya existe'});console.error(err);res.status(500).json({error:'Error'});}});

export default router;
