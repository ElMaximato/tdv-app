import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { db } from '../config/db.js';
import { USER_COOKIE_OPTS, authRequired, isMobileClient, signUser } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimits.js';
import { isAllowedEmail, isStrongPassword, isValidUsername } from '../utils/validators.js';

const router = Router();

// Registro directo: la cuenta queda activa y con la sesión iniciada (sin código por correo).
router.post('/auth/register', loginLimiter, async (req, res) => {
  const {username,password}=req.body || {};
  const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():req.body?.email;
  if (!username||!email||!password) return res.status(400).json({error:'username, email y password son obligatorios'});
  if (typeof username!=='string'||typeof email!=='string'||typeof password!=='string') return res.status(400).json({error:'Datos inválidos'});
  if (!isAllowedEmail(email)) return res.status(400).json({error:'Usa un correo de Gmail, Hotmail, Outlook u otro proveedor oficial (máximo 80 caracteres)'});
  if (!isStrongPassword(password)) return res.status(400).json({error:'La contraseña debe tener de 8 a 20 caracteres, una mayúscula y un número'});
  if (!isValidUsername(username)) return res.status(400).json({error:'El usuario debe tener de 3 a 10 caracteres, solo letras y números'});
  try {
    const hash=await bcrypt.hash(password,12);
    const [result]=await db.query('INSERT INTO users (username,email,password_hash,role,email_verified,email_verified_at) VALUES (?,?,?,?,TRUE,NOW())',[username,email,hash,'member']);
    const [[user]]=await db.query('SELECT id,username,email,role,avatar,avatar_id,is_verified FROM users WHERE id=?',[result.insertId]);
    const token=signUser({id:user.id,username:user.username,role:user.role});
    if (isMobileClient(req)) return res.status(201).json({user,token});   // móvil: token en el JSON, sin cookie
    res.cookie('tdv_token',token,USER_COOKIE_OPTS);
    res.status(201).json({ok:true,user});
  } catch(err){if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'El username o email ya está en uso'});console.error(err);res.status(500).json({error:'Error al registrar'});}
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  const {password}=req.body||{};
  const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():req.body?.email;
  if (!email||!password) return res.status(400).json({error:'email y password son obligatorios'});
  if (typeof email!=='string'||typeof password!=='string'||email.length>80||password.length>128) return res.status(400).json({error:'Credenciales incorrectas'});
  try {
    const [[user]]=await db.query('SELECT id,username,email,password_hash,role,avatar,avatar_id,is_verified FROM users WHERE email=?',[email]);
    if (!user) return res.status(401).json({error:'Credenciales incorrectas'});
    const match=await bcrypt.compare(password,user.password_hash);
    if (!match) return res.status(401).json({error:'Credenciales incorrectas'});
    const token=signUser({id:user.id,username:user.username,role:user.role});
    const {password_hash,...safeUser}=user;
    if (isMobileClient(req)) return res.json({user:safeUser,token});   // móvil: token en el JSON, sin cookie
    res.cookie('tdv_token',token,USER_COOKIE_OPTS);
    res.json({user:safeUser});
  } catch(err){console.error(err);res.status(500).json({error:'Error en el login'});}
});

// Ping para que la app compruebe que llega al servidor (y a la base de datos).
router.get('/health', async (_req, res) => {
  try { await db.query('SELECT 1'); res.json({ ok:true, db:true, time:new Date().toISOString() }); }
  catch { res.status(503).json({ ok:false, db:false }); }
});

router.get('/auth/me', authRequired, async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, username, email, role, avatar, avatar_id, is_verified FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }); }
});

router.post('/auth/logout', (_req, res) => {
  res.clearCookie('tdv_token', { path:'/' });
  res.json({ ok:true });
});

export default router;
