import { db } from '../config/db.js';

// Envío de notificaciones push con el servicio de Expo (no hace falta librería: es una petición HTTP).
// Las claves de Firebase (FCM) se configuran en Expo/EAS, no aquí. Este archivo solo habla con Expo.
const EXPO_URL = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;                                   // Expo acepta hasta 100 mensajes por petición
export const isExpoToken = (t) => typeof t === 'string' && /^Expo(nent)?PushToken\[[^\]\s]{8,}\]$/.test(t);

async function postToExpo(messages) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  const r = await fetch(EXPO_URL, { method: 'POST', headers, body: JSON.stringify(messages), signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Expo respondió HTTP ${r.status}`);
  const body = await r.json();
  return Array.isArray(body.data) ? body.data : [];
}

// Envía un aviso a TODOS los celulares activos de los usuarios dados. Nunca lanza error:
// si el push falla, el aviso ya quedó guardado en la tabla notifications y la app lo verá al abrirse.
// Devuelve { sent, failed, devices }.
export async function sendPushToUsers(userIds, { title, body, data = null }) {
  const stats = { sent: 0, failed: 0, devices: 0 };
  const ids = [...new Set((userIds || []).filter(Number.isInteger))];
  if (!ids.length) return stats;
  try {
    const [rows] = await db.query('SELECT id, token FROM push_tokens WHERE is_active=1 AND user_id IN (?)', [ids]);
    const targets = rows.filter(r => isExpoToken(r.token));
    stats.devices = targets.length;
    for (let i = 0; i < targets.length; i += CHUNK) {
      const slice = targets.slice(i, i + CHUNK);
      const messages = slice.map(t => ({ to: t.token, title, body, data: data || {}, sound: 'default', priority: 'high' }));
      let tickets;
      try { tickets = await postToExpo(messages); }
      catch (err) { console.error('push:', err.message); stats.failed += slice.length; continue; }
      const dead = [];
      tickets.forEach((tk, j) => {
        if (tk.status === 'ok') stats.sent++;
        else {
          stats.failed++;
          if (tk.details?.error === 'DeviceNotRegistered') dead.push(slice[j].id);   // app desinstalada o token vencido
          else console.warn('push rechazado:', tk.message || tk.details?.error);
        }
      });
      if (dead.length) await db.query('UPDATE push_tokens SET is_active=0 WHERE id IN (?)', [dead]);
    }
  } catch (err) { console.error('sendPushToUsers:', err.message); }
  return stats;
}
