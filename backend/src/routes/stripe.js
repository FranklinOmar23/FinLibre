const router = require('express').Router();
const Stripe = require('stripe');
const auth = require('../middleware/auth');
const { User } = require('../models');

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

// POST /api/stripe/analysis-pro  →  pago único RD$300 para desbloquear Análisis Pro
router.post('/analysis-pro', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.analysis_pro) return res.status(400).json({ message: 'Ya tienes Análisis Pro activo' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      metadata: { userId: String(req.userId), product: 'analysis_pro' },
      line_items: [
        {
          price_data: {
            currency: 'dop',
            product_data: {
              name: 'FinLibre Análisis Pro 🐊',
              description: 'Acceso de por vida al Lector de Estado de Cuenta con IA',
              images: [`${clientUrl}/icon-192.png`],
            },
            unit_amount: 30000, // RD$300 en centavos
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/app/analisis?unlocked=true`,
      cancel_url:  `${clientUrl}/app/analisis`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe.analysis-pro]', err.message);
    res.status(500).json({ message: 'Error al crear sesión de pago' });
  }
});

module.exports = router;
