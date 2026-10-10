import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired, superAdminOnly } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/users', adminRequired, async (req, res) => {
  const page=Math.max(1,parseInt(req.query.page)||1),limit=Math.min(50,parseInt(req.query.limit)||20),offset=(page-1)*limit,q=req.query.q||'';
  try{const[users]=await db.query(`SELECT id,username,email,role,is_verified,created_at FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,[`%${q}%`,`%${q}%`,limit,offset]);const[[{total}]]=await db.query(`SELECT COUNT(*) AS total FROM users WHERE username LIKE ? OR email LIKE ?`,[`%${q}%`,`%${q}%`]);res.json({data:users,meta:{page,limit,total,pages:Math.ceil(total/limit)}});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

router.patch('/admin/users/:id/role', adminRequired, superAdminOnly, async (req, res) => {
  const {role}=req.body;if(!['admin','editor','member'].includes(role))return res.status(400).json({error:'Rol inválido'});if(parseInt(req.params.id)===req.admin.id)return res.status(400).json({error:'No puedes cambiar tu propio rol'});
  try{await db.query('UPDATE users SET role=? WHERE id=?',[role,req.params.id]);await logAudit(req.admin.id,'user_role_change',req.ip,`User ${req.params.id} → ${role}`);res.json({ok:true});}
  catch(err){console.error(err);res.status(500).json({error:'Error'});}
});

export default router;
