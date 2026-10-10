// Prueba las notificaciones SIN la app:
//   node scripts/test-push.js correo contraseña                              → token falso (prueba la API; el push real no llega)
//   node scripts/test-push.js correo contraseña "ExponentPushToken[xxxx]"    → con el token real de tu celular
// La cuenta debe ser admin (para poder enviar el aviso).
import 'dotenv/config';

const [, , email, password, tokenArg] = process.argv;
if (!email || !password) { console.log('Uso: node scripts/test-push.js correo contraseña [ExponentPushToken[...]]'); process.exit(1); }
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}/api`;
const token = tokenArg || 'ExponentPushToken[tdv-prueba-0000000000]';

async function call(method, path, body, headers = {}) {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', 'X-Client': 'mobile', ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

const login = await call('POST', '/auth/login', { email, password });
if (!login.data.token) { console.log('Login falló:', login.data); process.exit(1); }
const auth = { Authorization: `Bearer ${login.data.token}` };
console.log('1) Login OK');

const reg = await call('POST', '/push/register', { token, device_name: 'Prueba script', platform: 'android' }, auth);
console.log(`2) /push/register → HTTP ${reg.status}`, reg.status === 200 ? '' : reg.data);

const adm = await call('POST', '/admin/auth/login', { email, password });
if (!adm.data.token) { console.log('3) Login admin falló:', adm.data); process.exit(1); }
const sent = await call('POST', '/admin/notifications/send',
  { title: '¡Prueba de TDV! 🎮', body: 'Si ves esto en tu celular, las notificaciones funcionan.', type: 'general', user_id: login.data.user.id },
  { 'X-Admin-Token': adm.data.token });
console.log(`3) /admin/notifications/send → HTTP ${sent.status}`, sent.data);

const list = await call('GET', '/notifications?limit=3', null, auth);
console.log(`4) /notifications → HTTP ${list.status}, sin leer: ${list.data.unread_count}`);
(list.data.items || []).forEach(n => console.log(`   #${n.id} [${n.type}] ${n.title} ${n.read_at ? '(leído)' : '(nuevo)'}`));

const all = await call('POST', '/notifications/read-all', null, auth);
console.log(`5) /notifications/read-all → HTTP ${all.status}, marcados: ${all.data.updated}`);
