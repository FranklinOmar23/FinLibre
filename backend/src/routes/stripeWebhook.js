const router = require('express').Router();
const Stripe = require('stripe');
const { User } = require('../models');
const emailService = require('../services/emailService');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/webhook  — Stripe envía eventos aquí
// Necesita el body crudo (raw) para verificar la firma
router.post('/', async (req, res) => {
  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[stripe.webhook] Firma inválida:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Sin secreto (desarrollo local sin Stripe CLI) — parsear manualmente
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).send('Invalid JSON');
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId  = session.metadata?.userId;

    if (userId) {
      try {
        const user = await User.findByPk(userId);
        if (user) {
          const amount   = (session.amount_total / 100).toFixed(2);
          const currency = (session.currency || 'usd').toUpperCase();
          await emailService.sendDonationSuccess({
            to: user.email,
            nombre: user.nombre.split(' ')[0],
            amount,
            currency,
          });
        }
      } catch (err) {
        console.error('[stripe.webhook] Error enviando email de donación:', err.message);
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
