// Carga el .env y valida los secretos. Importar ESTE archivo primero.
import 'dotenv/config';

// En producción los secretos son obligatorios. En desarrollo se usan valores de
// respaldo, pero se avisa en consola para no olvidarlos.
export const IS_PROD = process.env.NODE_ENV === 'production';
function requireSecret(name, devFallback) {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  if (IS_PROD) throw new Error(`Falta ${name} en .env (mínimo 16 caracteres)`);
  console.warn(`⚠️  ${name} no está definido (o es muy corto): usando valor de desarrollo. NO usar así en producción.`);
  return devFallback;
}
export const JWT_SECRET       = requireSecret('JWT_SECRET',       'dev-secret-change-me-0000');
export const JWT_ADMIN_SECRET = requireSecret('JWT_ADMIN_SECRET', 'dev-admin-secret-change-me-0000');
