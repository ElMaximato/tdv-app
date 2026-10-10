import { db } from '../config/db.js';
import { sendPushToUsers } from './push.js';

// Guarda un aviso en la tabla notifications y además lo manda como push al celular del usuario.
// El push va "en segundo plano": si tarda o falla, no retrasa ni rompe la respuesta de la API.
export async function notifyUser(userId, { type = 'general', title, body, data = null }) {
  try {
    const [r] = await db.query(
      'INSERT INTO notifications (user_id,type,title,body,data) VALUES (?,?,?,?,?)',
      [userId, type, title, body, data ? JSON.stringify(data) : null]
    );
    sendPushToUsers([userId], { title, body, data: { ...(data || {}), type, notificationId: r.insertId } }).catch(() => {});
    return r.insertId;
  } catch (err) { console.error('notifyUser:', err.message); return null; }
}

// Aviso para varios usuarios (nuevo drop, nueva reseña...). Cada quien recibe su propia fila,
// así "leído" es individual. Devuelve { recipients, push }.
export async function notifyMany(userIds, { type = 'general', title, body, data = null }) {
  const ids = [...new Set((userIds || []).filter(Number.isInteger))];
  if (!ids.length) return { recipients: 0, push: { sent: 0, failed: 0, devices: 0 } };
  const json = data ? JSON.stringify(data) : null;
  for (let i = 0; i < ids.length; i += 500)
    await db.query('INSERT INTO notifications (user_id,type,title,body,data) VALUES ?', [ids.slice(i, i + 500).map(id => [id, type, title, body, json])]);
  const push = await sendPushToUsers(ids, { title, body, data: { ...(data || {}), type } });
  return { recipients: ids.length, push };
}
