const webpush = require('web-push');
const { PushSubscription } = require('../models');

if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[push] VAPID keys not set — push notifications disabled');
}

exports.getVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ error: 'Suscripción inválida' });

    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://'))
      return res.status(400).json({ error: 'Endpoint inválido' });

    const [sub] = await PushSubscription.findOrCreate({
      where: { user_id: req.userId, endpoint },
      defaults: { user_id: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    if (sub.p256dh !== keys.p256dh) {
      await sub.update({ p256dh: keys.p256dh, auth: keys.auth });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[push.subscribe]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint requerido' });
    await PushSubscription.destroy({ where: { user_id: req.userId, endpoint } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[push.unsubscribe]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};

async function sendPushToUser(userId, payload) {
  const subs = await PushSubscription.findAll({ where: { user_id: userId } });
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async err => {
        if (err.statusCode === 410) await sub.destroy();
        throw err;
      })
    )
  );
  return results;
}

exports.sendPushToUser = sendPushToUser;

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
    console.error('[push.test]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};
