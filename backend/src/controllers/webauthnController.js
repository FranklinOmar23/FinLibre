const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { User, WebAuthnCredential } = require('../models');
const jwt = require('jsonwebtoken');

const RP_NAME = 'FinLibre';
const isProd = process.env.NODE_ENV === 'production';
const RP_ID = process.env.RP_ID || (isProd ? 'finlibre.arcodedominicana.com' : 'localhost');
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());

// Almacena challenges temporalmente en memoria (en producción usar Redis/DB)
const challengeStore = new Map();

// ─── Registro de huella/Face ID ─────────────────────────────────────────────

exports.registrationOptions = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    const existingCreds = await WebAuthnCredential.findAll({ where: { user_id: req.userId } });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(String(user.id)),
      userName: user.email,
      userDisplayName: user.nombre,
      attestationType: 'none',
      excludeCredentials: existingCreds.map(c => ({
        id: Buffer.from(c.credential_id, 'base64url'),
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // solo biometría del dispositivo
      },
    });

    challengeStore.set(`reg_${req.userId}`, options.challenge);
    setTimeout(() => challengeStore.delete(`reg_${req.userId}`), 5 * 60 * 1000);

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registrationVerify = async (req, res) => {
  try {
    const expectedChallenge = challengeStore.get(`reg_${req.userId}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expirado' });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (!verification.verified) return res.status(400).json({ error: 'Verificación fallida' });

    const { credential, credentialDeviceType } = verification.registrationInfo;

    await WebAuthnCredential.create({
      user_id: req.userId,
      credential_id: Buffer.from(credential.id).toString('base64url'),
      public_key: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      device_type: credentialDeviceType,
    });

    challengeStore.delete(`reg_${req.userId}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Autenticación con huella/Face ID ───────────────────────────────────────

exports.authOptions = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const creds = await WebAuthnCredential.findAll({ where: { user_id: user.id } });
    if (creds.length === 0) return res.status(400).json({ error: 'No tienes biometría registrada' });

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: creds.map(c => ({
        id: Buffer.from(c.credential_id, 'base64url'),
        type: 'public-key',
      })),
    });

    challengeStore.set(`auth_${user.id}`, { challenge: options.challenge, userId: user.id });
    setTimeout(() => challengeStore.delete(`auth_${user.id}`), 5 * 60 * 1000);

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.authVerify = async (req, res) => {
  try {
    const { email, response } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const stored = challengeStore.get(`auth_${user.id}`);
    if (!stored) return res.status(400).json({ error: 'Challenge expirado' });

    const credId = response.id;
    const cred = await WebAuthnCredential.findOne({
      where: { user_id: user.id, credential_id: credId },
    });
    if (!cred) return res.status(400).json({ error: 'Credencial no encontrada' });

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credential_id,
        publicKey: Buffer.from(cred.public_key, 'base64url'),
        counter: Number(cred.counter),
      },
    });

    if (!verification.verified) return res.status(400).json({ error: 'Autenticación fallida' });

    await cred.update({ counter: verification.authenticationInfo.newCounter });
    challengeStore.delete(`auth_${user.id}`);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        ingreso_mensual: user.ingreso_mensual,
        frecuencia_cobro: user.frecuencia_cobro,
        dia_cobro: user.dia_cobro,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listCredentials = async (req, res) => {
  const creds = await WebAuthnCredential.findAll({
    where: { user_id: req.userId },
    attributes: ['id', 'device_type', 'createdAt'],
  });
  res.json(creds);
};

exports.deleteCredential = async (req, res) => {
  await WebAuthnCredential.destroy({ where: { id: req.params.id, user_id: req.userId } });
  res.json({ ok: true });
};
