const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, RefreshToken, PasswordReset, LoginHistory } = require('../models');
const emailService = require('../services/emailService');
require('dotenv').config();

const ACCESS_TTL  = '8h';
const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
const RESET_TTL   = 30 * 60 * 1000;            // 30 min

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TTL,
  path: '/api/auth',
};

function signAccess(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL);
  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
  return token;
}

const safeUser = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  ingreso_mensual: u.ingreso_mensual,
  frecuencia_cobro: u.frecuencia_cobro,
  dia_cobro: u.dia_cobro,
  moneda: u.moneda || 'DOP',
  idioma: u.idioma || 'es',
});

function getClientIp(req) {
  return ((req.headers['x-forwarded-for'] || req.ip || 'unknown')
    .split(',')[0].trim());
}

function formatDateTime() {
  return new Date().toLocaleString('es-ES', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
  });
}

// ─────────────────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, ingreso_mensual, frecuencia_cobro, dia_cobro } = req.body;

    if (!nombre || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });

    if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100)
      return res.status(400).json({ message: 'El nombre debe tener entre 2 y 100 caracteres' });

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150)
      return res.status(400).json({ message: 'Email inválido' });

    if (typeof password !== 'string' || password.length < 8 || password.length > 128)
      return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 128 caracteres' });

    const existe = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existe) return res.status(409).json({ message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      nombre: nombre.trim(), email: email.toLowerCase().trim(), password: hash,
      ingreso_mensual: Math.max(0, Number(ingreso_mensual) || 0),
      frecuencia_cobro: frecuencia_cobro || null,
      dia_cobro: dia_cobro || null,
    });

    const accessToken  = signAccess(user.id);
    const refreshToken = await createRefreshToken(user.id);

    // Enviar bienvenida (no bloquea la respuesta)
    emailService.sendWelcome({ to: user.email, nombre: user.nombre.split(' ')[0] }).catch(() => {});

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.status(201).json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ message: 'Error al registrar' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });

    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ message: 'Datos inválidos' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const accessToken  = signAccess(user.id);
    const refreshToken = await createRefreshToken(user.id);

    // Detectar IP nueva — solo enviar alerta si no se vio esta IP en los últimos 30 días
    const clientIp  = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const known = await LoginHistory.findOne({
      where: { user_id: user.id, ip: clientIp, createdAt: { [Op.gt]: THIRTY_DAYS_AGO } },
    });

    // Registrar siempre, alertar solo si IP es nueva
    LoginHistory.create({ user_id: user.id, ip: clientIp, user_agent: userAgent }).catch(() => {});

    if (!known) {
      emailService.sendLoginAlert({
        to: user.email,
        nombre: user.nombre.split(' ')[0],
        ip: clientIp,
        userAgent,
        time: formatDateTime(),
      }).catch(() => {});
    }

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token || typeof access_token !== 'string')
      return res.status(400).json({ message: 'Token de Google requerido' });

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) return res.status(401).json({ message: 'Token de Google inválido' });

    const { sub: googleId, email, name } = await infoRes.json();

    let isNew = false;
    let user = await User.findOne({ where: { google_id: googleId } });
    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ google_id: googleId });
      } else {
        user = await User.create({
          nombre: name, email, password: null,
          google_id: googleId, ingreso_mensual: 0,
        });
        isNew = true;
      }
    }

    if (isNew) {
      emailService.sendWelcome({ to: user.email, nombre: user.nombre.split(' ')[0] }).catch(() => {});
    } else {
      // Alerta de inicio de sesión Google igual que email/password
      const clientIp  = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const known = await LoginHistory.findOne({
        where: { user_id: user.id, ip: clientIp, createdAt: { [Op.gt]: THIRTY_DAYS_AGO } },
      });
      LoginHistory.create({ user_id: user.id, ip: clientIp, user_agent: userAgent }).catch(() => {});
      if (!known) {
        emailService.sendLoginAlert({
          to: user.email,
          nombre: user.nombre.split(' ')[0],
          ip: clientIp,
          userAgent,
          time: formatDateTime(),
        }).catch(() => {});
      }
    }

    const accessToken  = signAccess(user.id);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    console.error('[googleLogin]', err.message);
    res.status(401).json({ message: 'Error con Google' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.fl_refresh;
    if (!token) return res.status(401).json({ message: 'Sin refresh token' });

    const stored = await RefreshToken.findOne({
      where: { token, expires_at: { [Op.gt]: new Date() } },
    });
    if (!stored) return res.status(401).json({ message: 'Refresh token inválido o expirado' });

    const user = await User.findByPk(stored.user_id);
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    await stored.destroy();
    const newRefresh = await createRefreshToken(user.id);
    const newAccess  = signAccess(user.id);

    res.cookie('fl_refresh', newRefresh, COOKIE_OPTS);
    res.json({ token: newAccess, user: safeUser(user) });
  } catch (err) {
    console.error('[refresh]', err.message);
    res.status(500).json({ message: 'Error al refrescar sesión' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.fl_refresh;
    if (token) await RefreshToken.destroy({ where: { token } });
    res.clearCookie('fl_refresh', { ...COOKIE_OPTS, maxAge: 0 });
    res.json({ ok: true });
  } catch (err) {
    console.error('[logout]', err.message);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'nombre', 'email', 'ingreso_mensual', 'frecuencia_cobro', 'dia_cobro', 'moneda', 'idioma', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// ── Recuperar contraseña ──────────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || email.length > 150)
      return res.status(400).json({ message: 'Email requerido' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    // Siempre devuelve 200 para prevenir enumeración de emails
    if (!user || !user.password) {
      return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
    }

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL);

    await PasswordReset.destroy({ where: { user_id: user.id } });
    await PasswordReset.create({ user_id: user.id, token, expires_at: expiresAt });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await emailService.sendPasswordReset({
      to: user.email,
      nombre: user.nombre.split(' ')[0],
      resetUrl,
      expiresInMinutes: 30,
    });

    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
  } catch (err) {
    console.error('[forgotPassword]', err.message);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string')
      return res.status(400).json({ message: 'Token y contraseña son requeridos' });

    if (password.length < 8 || password.length > 128)
      return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 128 caracteres' });

    const record = await PasswordReset.findOne({
      where: { token, expires_at: { [Op.gt]: new Date() } },
    });
    if (!record) return res.status(400).json({ message: 'Enlace inválido o expirado' });

    const user = await User.findByPk(record.user_id);
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const hash = await bcrypt.hash(password, 12);
    await user.update({ password: hash });
    await record.destroy();

    emailService.sendPasswordChanged({ to: user.email, nombre: user.nombre.split(' ')[0] }).catch(() => {});

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('[resetPassword]', err.message);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
};
