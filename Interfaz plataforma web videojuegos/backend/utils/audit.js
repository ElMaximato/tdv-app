import { db } from '../config/db.js';

export async function logAudit(userId, action, ip, details='') {
  try { await db.query(`INSERT INTO admin_audit_log (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)`, [userId, action, ip, details]); } catch {}
}
