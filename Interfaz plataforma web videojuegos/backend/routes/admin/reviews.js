import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.post('/admin/games/:id/review', adminRequired, async (req, res) => {
  const {score_gameplay,score_story,score_graphics,score_soundtrack,score_longevity,score_overall,summary,review_body,personal_note,played_year,hours_played,is_gem,is_essential,emilio_rank}=req.body;
  try {
    await db.query(`INSERT INTO editorial_reviews (game_id,score_gameplay,score_story,score_graphics,score_soundtrack,score_longevity,score_overall,summary,review_body,personal_note,played_year,hours_played,is_gem,is_essential,emilio_rank,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE score_gameplay=VALUES(score_gameplay),score_story=VALUES(score_story),score_graphics=VALUES(score_graphics),score_soundtrack=VALUES(score_soundtrack),score_longevity=VALUES(score_longevity),score_overall=VALUES(score_overall),summary=VALUES(summary),review_body=VALUES(review_body),personal_note=VALUES(personal_note),played_year=VALUES(played_year),hours_played=VALUES(hours_played),is_gem=VALUES(is_gem),is_essential=VALUES(is_essential),emilio_rank=VALUES(emilio_rank),published_at=IF(published_at IS NULL,NOW(),published_at),updated_at=NOW()`,
      [req.params.id,score_gameplay,score_story,score_graphics,score_soundtrack,score_longevity,score_overall,summary,review_body,personal_note,played_year,hours_played,is_gem?1:0,is_essential?1:0,emilio_rank]);
    await logAudit(req.admin.id,'review_save',req.ip,`Game ID ${req.params.id}`);res.json({ok:true});
  } catch(err){console.error(err);res.status(500).json({error:'Error al guardar reseña'});}
});

export default router;
