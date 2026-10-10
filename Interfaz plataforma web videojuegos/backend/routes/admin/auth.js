import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { db } from '../../config/db.js';
import { ADMIN_COOKIE_OPTS, adminRequired, isMobileClient, signAdmin } from '../../middleware/auth.js';
import { adminLoginLimiter } from '../../middleware/rateLimits.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.post('/admin/auth/login', adminLoginLimiter, async (req, res) => {
  const {email,password}=req.body;
  if (!email||!password) return res.status(400).json({error:'email y password son obligatorios'});
  try {
    const [[user]]=await db.query('SELECT id,username,email,password_hash,role FROM users WHERE email=?',[email]);
    if (!user){await logAudit(null,'admin_login_fail',req.ip,`Email no existe: ${email}`);return res.status(401).json({error:'Credenciales incorrectas'});}
    const match=await bcrypt.compare(password,user.password_hash);
    if (!match){await logAudit(user.id,'admin_login_fail',req.ip,'Password incorrecto');return res.status(401).json({error:'Credenciales incorrectas'});}
    if (!['admin','editor'].includes(user.role)){await logAudit(user.id,'admin_login_denied',req.ip,`Rol insuficiente: ${user.role}`);return res.status(403).json({error:'Sin permisos de administrador'});}
    await logAudit(user.id,'admin_login_success',req.ip);
    const token=signAdmin({id:user.id,username:user.username,role:user.role});
    const adminUser={id:user.id,username:user.username,email:user.email,role:user.role};
    if (isMobileClient(req)) return res.json({user:adminUser,token});
    res.cookie('tdv_admin_token',token,ADMIN_COOKIE_OPTS);
    res.json({user:adminUser});
  } catch(err){console.error(err);res.status(500).json({error:'Error en login admin'});}
});

router.get('/admin/auth/me', adminRequired, (req, res) => { res.json({ user:req.admin }); });
router.post('/admin/auth/logout', (_req, res) => { res.clearCookie('tdv_admin_token',{path:'/api/admin'}); res.json({ok:true}); });

export default router;
