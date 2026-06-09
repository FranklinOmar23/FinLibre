const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, RefreshToken } = require('../models');
require('dotenv').config();

const ACCESS_TTL  = '8h';
const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días en ms

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

// ─────────────────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, ingreso_mensual, frecuencia_cobro, dia_cobro } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });

    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(409).json({ message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      nombre, email, password: hash,
      ingreso_mensual: ingreso_mensual || 0,
      frecuencia_cobro: frecuencia_cobro || null,
      dia_cobro: dia_cobro || null,
    });

    const accessToken   = signAccess(user.id);
    const refreshToken  = await createRefreshToken(user.id);

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.status(201).json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const accessToken   = signAccess(user.id);
    const refreshToken  = await createRefreshToken(user.id);

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ message: 'Token de Google requerido' });

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) return res.status(401).json({ message: 'Token de Google inválido' });

    const { sub: googleId, email, name } = await infoRes.json();

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
      }
    }

    const accessToken  = signAccess(user.id);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie('fl_refresh', refreshToken, COOKIE_OPTS);
    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    res.status(401).json({ message: 'Error con Google', error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.fl_refresh;
    if (!token) return res.status(401).json({ message: 'Sin refresh token' });

    const stored = await RefreshToken.findOne({
      where: {
        token,
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!stored) return res.status(401).json({ message: 'Refresh token inválido o expirado' });

    const user = await User.findByPk(stored.user_id);
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    // Rotar el refresh token (invalidar el viejo, emitir uno nuevo)
    await stored.destroy();
    const newRefresh = await createRefreshToken(user.id);
    const newAccess  = signAccess(user.id);

    res.cookie('fl_refresh', newRefresh, COOKIE_OPTS);
    res.json({ token: newAccess, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Error al refrescar sesión', error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.fl_refresh;
    if (token) await RefreshToken.destroy({ where: { token } });
    res.clearCookie('fl_refresh', { ...COOKIE_OPTS, maxAge: 0 });
    res.json({ ok: true });
  } catch (err) {
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
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
