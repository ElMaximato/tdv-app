// ============================================================
//  backend/utils/email.js
//  Envío de correos con Resend (gratis, 3000/mes)
//
//  Si RESEND_API_KEY no está configurada, imprime el correo
//  en consola en vez de mandarlo — útil para desarrollo local
//  sin necesidad de configurar Resend todavía.
// ============================================================

const EMAIL_FROM = process.env.EMAIL_FROM || 'TDV <onboarding@resend.dev>';
const EMAIL_FROM_NAME = 'Tiempo de Videojuegos';

/**
 * Envía un correo usando la API de Resend.
 * Si no hay API key configurada, lo printea en consola (modo dev).
 */
export async function sendEmail({ to, subject, html, text }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  // ─── MODO DEV: sin API key ────────────────────────────
  if (!RESEND_API_KEY) {
    console.log('\n╔══════════════════════════════════════════════════════════');
    console.log('║  📧 CORREO (modo dev — no se envió de verdad)');
    console.log('╠══════════════════════════════════════════════════════════');
    console.log(`║  Para:    ${to}`);
    console.log(`║  Asunto:  ${subject}`);
    console.log(`║  Text:    ${text || '(solo HTML)'}`);
    console.log('╚══════════════════════════════════════════════════════════\n');
    return { ok: true, dev: true };
  }

  // ─── PRODUCCIÓN: Resend API ───────────────────────────
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    EMAIL_FROM,
        to:      [to],
        subject,
        html,
        text:    text || undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('❌ Resend error:', res.status, errData);
      return { ok: false, error: errData.message || 'Error al enviar correo' };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('❌ Excepción al enviar correo:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Genera un código de 6 dígitos para verificación.
 * Rango: 100000 — 999999 (siempre 6 dígitos).
 */
export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Plantilla HTML para correo de verificación de registro.
 * Diseño: glassmorphism oscuro, Press Start 2P, acento rojo TDV.
 */
export function renderVerificationEmail({ username, code }) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verificación TDV</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0f0f1a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#e60012,#cc0010);padding:10px 18px;border-radius:10px;">
                <span style="font-family:'Courier New',monospace;font-size:16px;font-weight:bold;color:#fff;letter-spacing:2px;">TDV</span>
              </div>
              <div style="font-size:12px;color:#fbbf24;margin-top:10px;letter-spacing:3px;font-weight:bold;">
                TIEMPO DE VIDEOJUEGOS
              </div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:rgba(30,30,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">

              <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px 0;text-align:center;">
                ¡Bienvenido, ${escapeHtml(username)}!
              </h1>

              <p style="color:#8888a8;font-size:15px;line-height:1.6;margin:0 0 28px 0;text-align:center;">
                Un último paso para activar tu cuenta.<br>
                Usa este código para verificar tu email:
              </p>

              <!-- Código -->
              <div style="text-align:center;margin:28px 0;">
                <div style="display:inline-block;background:rgba(230,0,18,0.1);border:2px solid rgba(230,0,18,0.3);border-radius:12px;padding:24px 40px;">
                  <span style="font-family:'Courier New',monospace;font-size:42px;font-weight:bold;color:#e60012;letter-spacing:12px;">${code}</span>
                </div>
              </div>

              <p style="color:#8888a8;font-size:13px;line-height:1.6;margin:24px 0 0 0;text-align:center;">
                El código expira en <strong style="color:#fbbf24;">15 minutos</strong>.
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;">

              <p style="color:#55556a;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Si no te registraste en TDV, ignora este correo.<br>
                Nadie podrá acceder a tu cuenta sin este código.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#55556a;font-size:11px;margin:0;">
                © TDV · Rankings honestos de retro-gaming
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
¡Bienvenido a TDV, ${username}!

Tu código de verificación es: ${code}

El código expira en 15 minutos.

Si no te registraste en TDV, ignora este correo.

TDV — Tiempo de Videojuegos
`.trim();

  return { html, text };
}

/**
 * Plantilla para reset de password (lo dejo preparado por si después lo quieres).
 */
export function renderPasswordResetEmail({ username, code }) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
    <table width="520" style="max-width:520px;">
      <tr><td align="center" style="padding-bottom:32px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#e60012,#cc0010);padding:10px 18px;border-radius:10px;color:#fff;font-weight:bold;">TDV</div>
      </td></tr>
      <tr><td style="background:rgba(30,30,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
        <h1 style="color:#fff;text-align:center;margin:0 0 16px;">Recupera tu contraseña</h1>
        <p style="color:#8888a8;text-align:center;margin:0 0 24px;">Hola ${escapeHtml(username)}, usa este código:</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:rgba(230,0,18,0.1);border:2px solid rgba(230,0,18,0.3);border-radius:12px;padding:24px 40px;">
            <span style="font-family:monospace;font-size:42px;font-weight:bold;color:#e60012;letter-spacing:12px;">${code}</span>
          </div>
        </div>
        <p style="color:#8888a8;font-size:13px;text-align:center;">Expira en 15 minutos. Si no solicitaste este reset, ignora este correo.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  return { html, text: `Código de reset: ${code} (expira en 15 min)` };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
