// ============================================================
//  backend/scripts/create-user.js
//  Crea un usuario ya verificado (para tu cuenta admin o de demo).
//
//  Uso (desde la carpeta backend/):
//    node scripts/create-user.js correo@gmail.com MiUsuario 'Contraseña1' admin
//    node scripts/create-user.js demo@gmail.com   Demo      'Contraseña1' member
//
//  Lee la conexión de backend/.env (DB_HOST, DB_USER, DB_PASS, DB_NAME).
//  Rol: admin | editor | member (por defecto member).
// ============================================================
import 'dotenv/config';
import mysql  from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const [email, username, password, role = 'member'] = process.argv.slice(2);

if (!email || !username || !password) {
  console.error("Uso: node scripts/create-user.js <email> <usuario> '<contraseña>' [admin|editor|member]");
  process.exit(1);
}
if (!['admin', 'editor', 'member'].includes(role)) {
  console.error('Rol inválido. Usa admin, editor o member.');
  process.exit(1);
}
if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  console.error('La contraseña necesita 8+ caracteres, una mayúscula y un número.');
  process.exit(1);
}

const db = await mysql.createConnection({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tiempodevideojuegos',
});

try {
  const hash = await bcrypt.hash(password, 12);
  const [r] = await db.query(
    `INSERT INTO users (username, email, password_hash, role, is_verified, email_verified, email_verified_at)
     VALUES (?, ?, ?, ?, 1, 1, NOW())`,
    [username, email, hash, role]
  );
  console.log(`✔ Usuario creado: id ${r.insertId}, ${username} <${email}>, rol ${role}`);
} catch (err) {
  console.error(err.code === 'ER_DUP_ENTRY' ? '✖ Ese usuario o correo ya existe.' : `✖ ${err.message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
