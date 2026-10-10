import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { featuredUpload, validateUploadedFiles } from '../../middleware/upload.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/games/:id/featured', adminRequired, async (req, res) => {
  try {
    const [[f]]=await db.query('SELECT * FROM featured_pages WHERE game_id=?',[req.params.id]);
    if(!f) return res.json(null);
    ['press_quotes','screenshots','feature_highlights'].forEach(field=>{if(f[field]&&typeof f[field]==='string'){try{f[field]=JSON.parse(f[field]);}catch{f[field]=[];}}});
    res.json(f);
  } catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.post('/admin/games/:id/featured', adminRequired, featuredUpload, validateUploadedFiles, async (req, res) => {
  const {trailer_url,tagline,long_description,accent_color,press_quotes,feature_highlights,existing_screenshots,existing_hero}=req.body;
  try {
    let heroPath=existing_hero||null;
    if(req.files?.hero_image?.[0]) heroPath=`featured/${req.files.hero_image[0].filename}`;
    if(!heroPath) return res.status(400).json({error:'Se requiere una imagen de fondo (hero)'});
    const existing=existing_screenshots?(typeof existing_screenshots==='string'?JSON.parse(existing_screenshots):existing_screenshots):[];
    const newShots=(req.files?.screenshots||[]).map(f=>({path:`featured/${f.filename}`,caption:''}));
    const quotes=press_quotes?(typeof press_quotes==='string'?JSON.parse(press_quotes):press_quotes):[];
    const features=feature_highlights?(typeof feature_highlights==='string'?JSON.parse(feature_highlights):feature_highlights):[];
    await db.query(`INSERT INTO featured_pages (game_id,hero_image,trailer_url,tagline,long_description,press_quotes,screenshots,feature_highlights,accent_color) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE hero_image=VALUES(hero_image),trailer_url=VALUES(trailer_url),tagline=VALUES(tagline),long_description=VALUES(long_description),press_quotes=VALUES(press_quotes),screenshots=VALUES(screenshots),feature_highlights=VALUES(feature_highlights),accent_color=VALUES(accent_color)`,
      [req.params.id,heroPath,trailer_url||null,tagline||null,long_description||null,JSON.stringify(quotes),JSON.stringify([...existing,...newShots]),JSON.stringify(features),accent_color||'#e60012']);
    await db.query('UPDATE games SET has_featured_page=TRUE WHERE id=?',[req.params.id]);
    await logAudit(req.admin.id,'featured_save',req.ip,`Game ID ${req.params.id}`);res.json({ok:true,hero_image:heroPath});
  } catch(err){console.error(err);res.status(500).json({error:'Error al guardar datos featured'});}
});

router.delete('/admin/games/:id/featured', adminRequired, async (req, res) => {
  try{await db.query('DELETE FROM featured_pages WHERE game_id=?',[req.params.id]);await db.query('UPDATE games SET has_featured_page=FALSE WHERE id=?',[req.params.id]);await logAudit(req.admin.id,'featured_delete',req.ip,`Game ID ${req.params.id}`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

export default router;
