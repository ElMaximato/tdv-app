import jwt from 'jsonwebtoken';

import { db } from '../config/db.js';
import { JWT_ADMIN_SECRET, JWT_SECRET } from '../config/env.js';
import { logAudit } from '../utils/audit.js';

export const USER_COOKIE_OPTS  = { httpOnly:true, sameSite:'strict', secure: process.env.NODE_ENV==='production', maxAge:7*24*60*60*1000, path:'/' };
export const ADMIN_COOKIE_OPTS = { httpOnly:true, sameSite:'strict', secure: process.env.NODE_ENV==='production', maxAge:2*60*60*1000, path:'/api/admin' };

export const signUser  = (p) => jwt.sign(p, JWT_SECRET, { expiresIn:'7d', issuer:'tdv-user' });
export const signAdmin = (p) => jwt.sign({...p,admin:true}, JWT_ADMIN_SECRET, { expiresIn:'2h', issuer:'tdv-admin' });
export function verifyUser(t)  { return jwt.verify(t, JWT_SECRET,       { issuer:'tdv-user'  }); }
export function verifyAdmin(t) { return jwt.verify(t, JWT_ADMIN_SECRET, { issuer:'tdv-admin' }); }

// La app móvil se identifica con la cabecera  X-Client: mobile  y guarda el token ella misma
// (expo-secure-store). La web seguiría usando cookies httpOnly.
export const isMobileClient = (req) => req.get('x-client') === 'mobile';
export function bearerToken(req) {
  const h = req.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

export function authRequired(req, res, next) {
  const token = bearerToken(req) || req.cookies?.tdv_token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try { req.user = verifyUser(token); next(); }
  catch { res.status(401).json({ error: 'Sesión inválida o expirada' }); }
}

export async function adminRequired(req, res, next) {
  // Móvil: token admin en la cabecera X-Admin-Token. Web: cookie.
  const token = req.get('x-admin-token') || req.cookies?.tdv_admin_token;
  if (!token) return res.status(401).json({ error: 'Token admin requerido' });
  try {
    const decoded = verifyAdmin(token);
    if (!decoded.admin) return res.status(403).json({ error: 'Token no es admin' });
    const [[user]] = await db.query('SELECT id, username, role FROM users WHERE id = ? AND role IN (?, ?)', [decoded.id, 'admin', 'editor']);
    if (!user) { await logAudit(decoded.id, 'admin_access_denied', req.ip, 'Rol no válido'); return res.status(403).json({ error: 'Sin permisos admin' }); }
    req.admin = user; next();
  } catch { res.status(401).json({ error: 'Token admin inválido o expirado' }); }
}

export function superAdminOnly(req, res, next) { if (req.admin?.role !== 'admin') return res.status(403).json({ error: 'Solo super-admin' }); next(); }
