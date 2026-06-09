const router = require('express').Router();
const Stripe = require('stripe');
const auth = require('../middleware/auth');

// Lazy — evita crash en arranque si la variable aún no está configurada
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
  return Stripe(key);
}

const DONATION_AMOUNTS = [2, 5, 10]; // USD — valores permitidos

// POST /api/stripe/checkout  →  crea una Checkout Session de donación
router.post('/checkout', auth, async (req, res) => {
  try {
    const rawAmount = Number(req.body.amount);
    if (!DONATION_AMOUNTS.includes(rawAmount))
      return res.status(400).json({ message: 'Monto no permitido' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      metadata: { userId: String(req.userId) },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Apoya FinLibre 🐊',
              description: 'Donación única para mantener la app gratuita',
              images: [`${clientUrl}/icon-192.png`],
            },
            unit_amount: rawAmount * 100, // Stripe trabaja en centavos
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/app/perfil?donated=true`,
      cancel_url:  `${clientUrl}/app/perfil`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe.checkout]', err.message);
    res.status(500).json({ message: 'Error al crear sesión de pago' });
  }
});

module.exports = router;
