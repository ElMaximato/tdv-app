import fs from 'fs';
import path from 'path';
import { Router } from 'express';

import { db } from '../../config/db.js';
import { ROOT_DIR } from '../../config/paths.js';
import { adminRequired, superAdminOnly } from '../../middleware/auth.js';
import { consoleUpload, validateUploadedFiles } from '../../middleware/upload.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/platforms', adminRequired, async (_req, res) => {
  try{const [rows]=await db.query(`SELECT p.id,p.name,p.slug,p.manufacturer,p.release_year,p.is_published,p.hero_logo,p.accent_color,p.created_at,p.updated_at,COUNT(DISTINCT g.id) AS games_count FROM platforms p LEFT JOIN games g ON g.platform_id=p.id GROUP BY p.id ORDER BY p.generation,p.name`);res.json(rows);}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.get('/admin/platforms/:id', adminRequired, async (req, res) => {
  try {
    const [[platform]]=await db.query(`SELECT * FROM platforms WHERE id=?`,[req.params.id]);
    if(!platform) return res.status(404).json({error:'No encontrada'});
    ['key_features','tech_specs','gallery','trivia'].forEach(f=>{if(platform[f]&&typeof platform[f]==='string'){try{platform[f]=JSON.parse(platform[f]);}catch{platform[f]=[];}}if(!Array.isArray(platform[f]))platform[f]=[];});
    let fg=[]; try{const[r]=await db.query(`SELECT g.id,g.title,g.slug,g.cover_image,pfg.position,pfg.caption,pfg.game_id FROM platform_featured_games pfg JOIN games g ON g.id=pfg.game_id WHERE pfg.platform_id=? ORDER BY pfg.position`,[req.params.id]);fg=r;}catch{fg=[];}
    let tl=[]; try{const[r]=await db.query(`SELECT id,event_date,event_year,title,description,icon,position FROM platform_timeline WHERE platform_id=? ORDER BY event_year,position`,[req.params.id]);tl=r;}catch{tl=[];}
    res.json({...platform,featured_games:fg,timeline:tl});
  } catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.post('/admin/platforms', adminRequired, consoleUpload, validateUploadedFiles, async (req, res) => {
  const {name,slug,generation,manufacturer,release_year,discontinued_year,hero_title,hero_subtitle,short_description,full_history,key_features,tech_specs,trivia,accent_color,secondary_color,meta_title,meta_description,meta_keywords,is_published}=req.body;
  if(!name||!slug) return res.status(400).json({error:'name y slug son obligatorios'});
  const finalSlug=slug.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const hb=req.files?.hero_banner?.[0]?`consoles/${req.files.hero_banner[0].filename}`:null;
  const hl=req.files?.hero_logo?.[0]?`consoles/${req.files.hero_logo[0].filename}`:null;
  const hc=req.files?.hero_console_img?.[0]?`consoles/${req.files.hero_console_img[0].filename}`:null;
  const gi=(req.files?.gallery||[]).map(f=>({path:`consoles/${f.filename}`,caption:''}));
  try {
    const [result]=await db.query(`INSERT INTO platforms (name,slug,generation,manufacturer,release_year,discontinued_year,hero_title,hero_subtitle,hero_banner,hero_logo,hero_console_img,short_description,full_history,key_features,tech_specs,gallery,trivia,accent_color,secondary_color,meta_title,meta_description,meta_keywords,is_published,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name,finalSlug,generation||null,manufacturer||null,release_year||null,discontinued_year||null,hero_title||null,hero_subtitle||null,hb,hl,hc,short_description||null,full_history||null,key_features?(typeof key_features==='string'?key_features:JSON.stringify(key_features)):null,tech_specs?(typeof tech_specs==='string'?tech_specs:JSON.stringify(tech_specs)):null,JSON.stringify(gi),trivia?(typeof trivia==='string'?trivia:JSON.stringify(trivia)):null,accent_color||'#e60012',secondary_color||'#fbbf24',meta_title||null,meta_description||null,meta_keywords||null,is_published==='true'||is_published===true?1:0,is_published==='true'||is_published===true?new Date():null]);
    await logAudit(req.admin.id,'platform_create',req.ip,`ID ${result.insertId}: ${name}`);res.status(201).json({id:result.insertId,slug:finalSlug});
  } catch(err){if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'Ya existe una consola con ese slug'});console.error(err);res.status(500).json({error:'Error al crear consola'});}
});

router.put('/admin/platforms/:id', adminRequired, consoleUpload, validateUploadedFiles, async (req, res) => {
  const id=req.params.id;
  const fields=['name','slug','generation','manufacturer','release_year','discontinued_year','hero_title','hero_subtitle','short_description','full_history','accent_color','secondary_color','meta_title','meta_description','meta_keywords'];
  const updates=[],params=[];
  fields.forEach(f=>{if(req.body[f]!==undefined){updates.push(`${f}=?`);params.push(req.body[f]||null);}});
  if(req.files?.hero_banner?.[0]){updates.push('hero_banner=?');params.push(`consoles/${req.files.hero_banner[0].filename}`);}
  if(req.files?.hero_logo?.[0]){updates.push('hero_logo=?');params.push(`consoles/${req.files.hero_logo[0].filename}`);}
  if(req.files?.hero_console_img?.[0]){updates.push('hero_console_img=?');params.push(`consoles/${req.files.hero_console_img[0].filename}`);}
  if(req.body.existing_gallery!==undefined||req.files?.gallery){const ex=req.body.existing_gallery?(typeof req.body.existing_gallery==='string'?JSON.parse(req.body.existing_gallery):req.body.existing_gallery):[];const no=(req.files?.gallery||[]).map(f=>({path:`consoles/${f.filename}`,caption:''}));updates.push('gallery=?');params.push(JSON.stringify([...ex,...no]));}
  ['key_features','tech_specs','trivia'].forEach(f=>{if(req.body[f]!==undefined){updates.push(`${f}=?`);const v=req.body[f];params.push(v===null||v===''?null:(typeof v==='string'?v:JSON.stringify(v)));}});
  if(req.body.is_published!==undefined){const pub=req.body.is_published==='true'||req.body.is_published===true;updates.push('is_published=?');params.push(pub?1:0);if(pub){const[[curr]]=await db.query('SELECT is_published,published_at FROM platforms WHERE id=?',[id]);if(!curr.is_published||!curr.published_at)updates.push('published_at=NOW()');}}
  if(!updates.length) return res.status(400).json({error:'Nada que actualizar'});
  try{params.push(id);await db.query(`UPDATE platforms SET ${updates.join(',')} WHERE id=?`,params);await logAudit(req.admin.id,'platform_update',req.ip,`ID ${id}`);res.json({ok:true});}
  catch(err){if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'Ya existe una consola con ese slug'});console.error(err);res.status(500).json({error:'Error al actualizar'});}
});

router.delete('/admin/platforms/:id', adminRequired, superAdminOnly, async (req, res) => {
  try{const[[p]]=await db.query('SELECT name FROM platforms WHERE id=?',[req.params.id]);if(!p)return res.status(404).json({error:'No encontrada'});const[[{count}]]=await db.query('SELECT COUNT(*) AS count FROM games WHERE platform_id=?',[req.params.id]);if(count>0)return res.status(409).json({error:`No se puede eliminar: hay ${count} juego(s) asociado(s)`});await db.query('DELETE FROM platforms WHERE id=?',[req.params.id]);await logAudit(req.admin.id,'platform_delete',req.ip,`ID ${req.params.id}: ${p.name}`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error al eliminar'});}
});

router.patch('/admin/platforms/:id/publish', adminRequired, async (req, res) => {
  const {published}=req.body;
  try{if(published)await db.query('UPDATE platforms SET is_published=TRUE,published_at=COALESCE(published_at,NOW()) WHERE id=?',[req.params.id]);else await db.query('UPDATE platforms SET is_published=FALSE WHERE id=?',[req.params.id]);await logAudit(req.admin.id,published?'platform_publish':'platform_unpublish',req.ip,`ID ${req.params.id}`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.post('/admin/platforms/:id/featured-games', adminRequired, async (req, res) => {
  const {games}=req.body;if(!Array.isArray(games)) return res.status(400).json({error:'games debe ser un array'});
  try{await db.query('DELETE FROM platform_featured_games WHERE platform_id=?',[req.params.id]);if(games.length>0)await db.query('INSERT INTO platform_featured_games (platform_id,game_id,position,caption) VALUES ?',[games.map((g,i)=>[req.params.id,g.game_id,g.position??i,g.caption||null])]);await logAudit(req.admin.id,'platform_featured_set',req.ip,`Platform ID ${req.params.id} (${games.length} juegos)`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.get('/admin/platforms/:id/timeline', adminRequired, async (req,res)=>{try{const[r]=await db.query(`SELECT id,event_date,event_year,title,description,icon,position FROM platform_timeline WHERE platform_id=? ORDER BY event_year ASC,position ASC`,[req.params.id]);res.json(r);}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.post('/admin/platforms/:id/timeline', adminRequired, async (req,res)=>{const{event_year,event_date,title,description,icon,position}=req.body;if(!event_year||!title)return res.status(400).json({error:'event_year y title son obligatorios'});try{const[r]=await db.query(`INSERT INTO platform_timeline (platform_id,event_year,event_date,title,description,icon,position) VALUES (?,?,?,?,?,?,?)`,[req.params.id,event_year,event_date||null,title,description||null,icon||null,position||0]);res.status(201).json({id:r.insertId});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.put('/admin/timeline/:id',           adminRequired, async (req,res)=>{const{event_year,event_date,title,description,icon,position}=req.body;try{await db.query(`UPDATE platform_timeline SET event_year=?,event_date=?,title=?,description=?,icon=?,position=? WHERE id=?`,[event_year,event_date||null,title,description||null,icon||null,position||0,req.params.id]);res.json({ok:true});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.delete('/admin/timeline/:id',           adminRequired, async (req,res)=>{try{await db.query('DELETE FROM platform_timeline WHERE id=?',[req.params.id]);res.json({ok:true});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});

router.delete('/admin/platforms/:id/gallery/:index', adminRequired, async (req, res) => {
  try{const[[p]]=await db.query('SELECT gallery FROM platforms WHERE id=?',[req.params.id]);if(!p)return res.status(404).json({error:'No encontrada'});let g=p.gallery?(typeof p.gallery==='string'?JSON.parse(p.gallery):p.gallery):[];const i=parseInt(req.params.index);if(i<0||i>=g.length)return res.status(400).json({error:'Índice inválido'});const rm=g.splice(i,1)[0];if(rm?.path&&!rm.path.startsWith('http')){const fp=path.join(ROOT_DIR,'uploads',rm.path);if(fs.existsSync(fp))fs.unlinkSync(fp);}await db.query('UPDATE platforms SET gallery=? WHERE id=?',[JSON.stringify(g),req.params.id]);res.json({ok:true,gallery:g});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

export default router;
