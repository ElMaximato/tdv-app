import rateLimit from 'express-rate-limit';

export const loginLimiter      = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: 'Demasiados intentos. Intenta en 15 minutos.' }, standardHeaders: true, legacyHeaders: false });
export const adminLoginLimiter = rateLimit({ windowMs: 15*60*1000, max: 5,  message: { error: 'Demasiados intentos admin.' }, standardHeaders: true, legacyHeaders: false });
export const resendCodeLimiter = rateLimit({ windowMs: 60*1000,    max: 3,  message: { error: 'Demasiados reenvíos.' }, standardHeaders: true, legacyHeaders: false });
export const apiLimiter        = rateLimit({ windowMs: 60*1000,    max: 100, standardHeaders: true, legacyHeaders: false });
