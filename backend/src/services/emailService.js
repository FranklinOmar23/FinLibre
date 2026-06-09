require('dotenv').config(); // garantiza carga aunque el módulo se requiera antes que app.js lo haga
const nodemailer = require('nodemailer');

// ── Transport lazy — se crea la primera vez que se envía un correo ─────────
let _transport = null;
function getTransport() {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // STARTTLS en puerto 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: true },
    });
  }
  return _transport;
}

// Helpers — evaluados en tiempo de envío para leer env vars correctamente
const from   = () => `FinLibre <${process.env.SMTP_USER}>`;
const appUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';
const domain = () => appUrl().replace(/https?:\/\//, '');

// ── Helpers de plantilla ──────────────────────────────────────────────────────

function base(content) {
  const url = appUrl();
  const dom = domain();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>FinLibre</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0d1117;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" role="presentation"
  style="max-width:560px;width:100%;background:#161b22;border-radius:18px;border:1px solid rgba(29,158,117,0.22);overflow:hidden">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1d9e75 0%,#0d5c3c 100%);padding:30px 40px;text-align:center">
    <div style="font-size:38px;line-height:1;margin-bottom:10px">🐊</div>
    <div style="font-size:23px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">FinLibre</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:5px;letter-spacing:0.8px;text-transform:uppercase">Tu libertad financiera</div>
  </td></tr>

  <!-- Content -->
  <tr><td style="padding:34px 40px;color:#e6edf3">
    ${content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px;border-top:1px solid rgba(29,158,117,0.12);text-align:center">
    <p style="margin:0 0 5px;font-size:11px;color:#6e7681">Correo automático de FinLibre — no respondas a este mensaje</p>
    <p style="margin:0;font-size:11px">
      <a href="${url}" style="color:#1d9e75;text-decoration:none">${dom}</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function btn(text, url) {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:26px auto 0">
<tr><td style="background:#1d9e75;border-radius:12px;box-shadow:0 4px 20px rgba(29,158,117,0.35)">
<a href="${url}" style="display:inline-block;padding:14px 34px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.2px">${text}</a>
</td></tr></table>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 14px;font-size:21px;font-weight:800;color:#e6edf3;letter-spacing:-0.3px">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:0 0 16px;font-size:14px;color:#8b949e;line-height:1.75">${text}</p>`;
}

function chip(text, color = '#1d9e75') {
  return `<div style="display:inline-block;background:rgba(29,158,117,0.1);border:1px solid rgba(29,158,117,0.28);border-radius:8px;padding:5px 14px;font-size:12px;font-weight:700;color:${color};margin-bottom:18px;letter-spacing:0.3px">${text}</div>`;
}

function infoTable(rows) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#0d1117;border:1px solid rgba(29,158,117,0.14);border-radius:12px;overflow:hidden;margin:0 0 20px">
${rows.map(([label, value], i) => `
<tr>
  <td style="padding:11px 16px;font-size:12px;color:#6e7681;${i ? 'border-top:1px solid rgba(29,158,117,0.08)' : ''}">${label}</td>
  <td style="padding:11px 16px;font-size:12px;color:#e6edf3;text-align:right;${i ? 'border-top:1px solid rgba(29,158,117,0.08)' : ''}">${value}</td>
</tr>`).join('')}
</table>`;
}

// ── Formatear user-agent legible ──────────────────────────────────────────────

function parseDevice(ua) {
  if (!ua || ua === 'unknown') return 'Dispositivo desconocido';
  if (/iPhone|iPad/.test(ua))      return 'iPhone / iPad';
  if (/Android/.test(ua))          return 'Android';
  if (/Windows/.test(ua))          return 'Windows';
  if (/Macintosh|Mac OS/.test(ua)) return 'Mac';
  if (/Linux/.test(ua))            return 'Linux';
  return ua.slice(0, 60);
}

// ── Templates ─────────────────────────────────────────────────────────────────

async function sendWelcome({ to, nombre }) {
  const url = appUrl();
  const html = base(
    h1(`¡Bienvenido a FinLibre, ${nombre}! 🎉`) +
    p('Estamos muy contentos de tenerte aquí. FinLibre es tu compañero hacia la libertad financiera, completamente gratis.') +
    `<table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px">
      ${[
        ['📊', 'Gestiona tus <strong style="color:#e6edf3">deudas</strong> y mira cuándo serás libre'],
        ['📅', 'Controla tus <strong style="color:#e6edf3">servicios</strong> y suscripciones'],
        ['🐷', 'Crea <strong style="color:#e6edf3">metas de ahorro</strong> y alcánzalas'],
        ['🤖', 'Chatea con <strong style="color:#e6edf3">Lib</strong>, tu asistente financiero IA'],
      ].map(([ico, txt]) => `
      <tr>
        <td style="padding:8px 0;width:36px;vertical-align:top;font-size:18px">${ico}</td>
        <td style="padding:8px 0;font-size:14px;color:#8b949e;line-height:1.6">${txt}</td>
      </tr>`).join('')}
    </table>` +
    btn('Ir a mi cuenta', `${url}/app`) +
    `<p style="margin:20px 0 0;font-size:11px;color:#6e7681;text-align:center">Si no creaste esta cuenta, ignora este correo.</p>`
  );
  return getTransport().sendMail({ from: from(), to, subject: '¡Bienvenido a FinLibre! 🐊', html });
}

async function sendPasswordReset({ to, nombre, resetUrl, expiresInMinutes = 30 }) {
  const url = appUrl();
  const html = base(
    chip('Recuperar contraseña') +
    h1('¿Olvidaste tu contraseña?') +
    p(`Hola <strong style="color:#e6edf3">${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta de FinLibre.`) +
    p(`Haz clic en el botón de abajo para crear una nueva contraseña. El enlace expira en <strong style="color:#e6edf3">${expiresInMinutes} minutos</strong>.`) +
    btn('Restablecer mi contraseña', resetUrl) +
    `<div style="margin-top:24px;background:#0d1117;border:1px solid rgba(29,158,117,0.14);border-radius:10px;padding:14px 16px">
      <p style="margin:0 0 6px;font-size:11px;color:#6e7681">Si el botón no funciona, copia este enlace en tu navegador:</p>
      <p style="margin:0;font-size:11px;color:#1d9e75;word-break:break-all">${resetUrl}</p>
    </div>` +
    `<p style="margin:20px 0 0;font-size:11px;color:#6e7681;text-align:center">Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.</p>`
  );
  return getTransport().sendMail({ from: from(), to, subject: '🔑 Restablecer contraseña — FinLibre', html });
}

async function sendLoginAlert({ to, nombre, ip, userAgent, time }) {
  const url    = appUrl();
  const device = parseDevice(userAgent);
  const html = base(
    chip('⚠️ Alerta de seguridad', '#e3b341') +
    h1('Nuevo inicio de sesión') +
    p(`Hola <strong style="color:#e6edf3">${nombre}</strong>, detectamos un acceso a tu cuenta desde un dispositivo o ubicación nueva.`) +
    infoTable([
      ['📅 Fecha y hora', time],
      ['📍 Dirección IP', ip],
      ['💻 Dispositivo', device],
    ]) +
    p('Si fuiste tú, no necesitas hacer nada. Si <strong style="color:#e6edf3">no reconoces este acceso</strong>, cambia tu contraseña de inmediato.') +
    btn('Cambiar mi contraseña', `${url}/forgot-password`) +
    `<p style="margin:20px 0 0;font-size:11px;color:#6e7681;text-align:center">Este es un correo automático de seguridad de FinLibre.</p>`
  );
  return getTransport().sendMail({ from: from(), to, subject: '🔔 Nuevo inicio de sesión en tu cuenta — FinLibre', html });
}

async function sendDonationSuccess({ to, nombre, amount, currency = 'USD' }) {
  const url = appUrl();
  const html = base(
    `<div style="text-align:center;margin-bottom:26px">
      <div style="font-size:52px;line-height:1;margin-bottom:14px">💚</div>
    </div>` +
    h1(`¡Muchas gracias, ${nombre}!`) +
    p('Tu apoyo nos ayuda a mantener FinLibre <strong style="color:#e6edf3">gratuito para todos</strong>. Significa mucho para nosotros.') +
    `<div style="background:rgba(29,158,117,0.1);border:1px solid rgba(29,158,117,0.28);border-radius:14px;padding:22px;text-align:center;margin-bottom:22px">
      <div style="font-size:36px;font-weight:800;color:#26c68f;font-family:monospace;letter-spacing:-1px">${currency} ${amount}</div>
      <div style="font-size:12px;color:#8b949e;margin-top:8px">Donación única · Verificado por Stripe 🔒</div>
    </div>` +
    p('Con tu ayuda, Lib y todo el equipo de FinLibre pueden seguir acompañando a más personas en su camino hacia la libertad financiera. 🐊') +
    btn('Ver mi cuenta', `${url}/app`) +
    `<p style="margin:20px 0 0;font-size:11px;color:#6e7681;text-align:center">Recibirás el recibo oficial de Stripe por separado si lo solicitas.</p>`
  );
  return getTransport().sendMail({ from: from(), to, subject: '💚 ¡Gracias por apoyar FinLibre!', html });
}

async function sendPasswordChanged({ to, nombre }) {
  const url = appUrl();
  const now = new Date().toLocaleString('es-ES', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
  });
  const html = base(
    chip('✅ Confirmación de seguridad') +
    h1('Tu contraseña fue cambiada') +
    p(`Hola <strong style="color:#e6edf3">${nombre}</strong>, te confirmamos que la contraseña de tu cuenta fue actualizada correctamente.`) +
    infoTable([
      ['📅 Fecha y hora', now],
      ['🔒 Estado', 'Contraseña actualizada'],
    ]) +
    p('Si <strong style="color:#e6edf3">no realizaste este cambio</strong>, contacta soporte de inmediato y cambia tu contraseña.') +
    btn('Ir a FinLibre', `${url}/app`)
  );
  return getTransport().sendMail({ from: from(), to, subject: '🔒 Tu contraseña fue cambiada — FinLibre', html });
}

module.exports = {
  sendWelcome,
  sendPasswordReset,
  sendLoginAlert,
  sendDonationSuccess,
  sendPasswordChanged,
  parseDevice,
};
