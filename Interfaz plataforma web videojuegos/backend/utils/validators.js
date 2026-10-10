// ── Validaciones ──────────────────────────────────────────────
export const ALLOWED_EMAIL_DOMAINS = new Set(['gmail.com','outlook.com','outlook.es','outlook.com.ar','outlook.com.mx','outlook.com.co','hotmail.com','hotmail.com.ar','hotmail.es','hotmail.com.mx','hotmail.com.co','live.com','live.com.ar','live.es','live.com.mx','live.com.co','msn.com','yahoo.com','yahoo.com.ar','yahoo.es','yahoo.com.mx','yahoo.com.co','icloud.com','me.com','mac.com','protonmail.com','proton.me','pm.me','mail.com','aol.com']);
export function isAllowedEmail(email) { if (email.length > 80) return false; const domain = email.split('@')[1]?.toLowerCase(); return !!domain && ALLOWED_EMAIL_DOMAINS.has(domain); }
export function isStrongPassword(p) { return p.length >= 8 && p.length <= 20 && /[A-Z]/.test(p) && /[0-9]/.test(p); }
export function isValidUsername(u) { return /^[A-Za-z0-9]{3,10}$/.test(u); }
