const webpush = require('web-push');
const { PushSubscription } = require('../models');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.getVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }

    // Upsert: un usuario puede tener varias suscripciones (múltiples dispositivos)
    const [sub] = await PushSubscription.findOrCreate({
      where: { user_id: req.userId, endpoint },
      defaults: { user_id: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    // Actualizar keys si ya existía
    if (sub.p256dh !== keys.p256dh) {
      await sub.update({ p256dh: keys.p256dh, auth: keys.auth });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.destroy({ where: { user_id: req.userId, endpoint } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Envía push a todos los dispositivos de un usuario
async function sendPushToUser(userId, payload) {
  const subs = await PushSubscription.findAll({ where: { user_id: userId } });
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async err => {
        // 410 = suscripción expirada, eliminar
        if (err.statusCode === 410) await sub.destroy();
        throw err;
      })
    )
  );
  return results;
}

exports.sendPushToUser = sendPushToUser;

// Test manual desde Perfil
exports.testPush = async (req, res) => {
  try {
    await sendPushToUser(req.userId, {
      title: '🐊 FinLibre',
      body: '¡Las notificaciones funcionan perfectamente!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      url: '/app',
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
