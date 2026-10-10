import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired, superAdminOnly } from '../../middleware/auth.js';

const router = Router();

router.get('/admin/dashboard', adminRequired, async (_req, res) => {
  try {
    const [[gameStats]]  =await db.query(`SELECT COUNT(*) AS total,SUM(is_published=TRUE) AS published,SUM(is_published=FALSE) AS drafts FROM games`);
    const [[userStats]]  =await db.query(`SELECT COUNT(*) AS total,SUM(is_verified=TRUE) AS verified,SUM(role='admin') AS admins,SUM(role='editor') AS editors FROM users`);
    const [[voteStats]]  =await db.query(`SELECT COUNT(*) AS total,ROUND(AVG(score),1) AS avg_score FROM community_votes`);
    const [[quizStats]]  =await db.query(`SELECT COUNT(*) AS total,SUM(passed=TRUE) AS passed FROM quiz_attempts`);
    const [[reviewStats]]=await db.query(`SELECT COUNT(*) AS total,SUM(is_gem=TRUE) AS gems,SUM(is_essential=TRUE) AS essentials FROM editorial_reviews`);
    const [recentAudit]  =await db.query(`SELECT al.id,al.action,al.ip_address,al.details,al.created_at,u.username FROM admin_audit_log al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 10`);
    res.json({gameStats,userStats,voteStats,quizStats,reviewStats,recentAudit});
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener dashboard'});}
});

router.get('/admin/audit', adminRequired, superAdminOnly, async(req,res)=>{const limit=Math.min(200,parseInt(req.query.limit)||50);try{const[rows]=await db.query(`SELECT al.*,u.username FROM admin_audit_log al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT ?`,[limit]);res.json(rows);}catch(err){console.error(err);res.status(500).json({error:'Error'});}});

export default router;
