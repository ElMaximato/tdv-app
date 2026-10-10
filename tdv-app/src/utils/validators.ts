// Reglas de los formularios. El servidor aplica las mismas (backend/utils/validators.js y routes/auth.js, shop.js).

export const LIMITS = {
  username: { min: 3, max: 10 },
  email: { max: 80 },
  password: { min: 8, max: 20 },
  fullName: 80, phone: 10, line1: 80, line2: 40, city: 50, state: 80, postal: 5,
  search: 80,
} as const;

// Proveedores oficiales aceptados (misma lista que el servidor).
export const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'outlook.es', 'outlook.com.mx', 'outlook.com.ar', 'outlook.com.co',
  'hotmail.com', 'hotmail.es', 'hotmail.com.mx', 'hotmail.com.ar', 'hotmail.com.co',
  'live.com', 'live.com.mx', 'live.com.ar', 'live.com.co', 'live.es', 'msn.com',
  'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'yahoo.com.ar', 'yahoo.com.co',
  'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'pm.me', 'mail.com', 'aol.com',
]);

// Filtros mientras se escribe
export const onlyAlnum = (t: string, max: number) => t.replace(/[^A-Za-z0-9]/g, '').slice(0, max);
export const onlyDigits = (t: string, max: number) => t.replace(/\D/g, '').slice(0, max);

// Validaciones (devuelven el mensaje de error o null si está bien)
export function checkUsername(u: string): string | null {
  if (!/^[A-Za-z0-9]+$/.test(u)) return 'El usuario solo puede tener letras y números';
  if (u.length < LIMITS.username.min || u.length > LIMITS.username.max) return `El usuario debe tener entre ${LIMITS.username.min} y ${LIMITS.username.max} caracteres`;
  return null;
}
export function checkEmail(e: string): string | null {
  const v = e.trim().toLowerCase();
  if (v.length > LIMITS.email.max) return `El correo no puede pasar de ${LIMITS.email.max} caracteres`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Escribe un correo válido';
  if (!ALLOWED_EMAIL_DOMAINS.has(v.split('@')[1])) return 'Usa un correo de Gmail, Hotmail, Outlook u otro proveedor oficial';
  return null;
}
export function checkNewPassword(p: string): string | null {
  if (p.length < LIMITS.password.min || p.length > LIMITS.password.max) return `La contraseña debe tener de ${LIMITS.password.min} a ${LIMITS.password.max} caracteres`;
  if (!/[A-Z]/.test(p)) return 'La contraseña necesita al menos una mayúscula';
  if (!/\d/.test(p)) return 'La contraseña necesita al menos un número';
  return null;
}
