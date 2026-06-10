const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const corsMiddleware = require('./middleware/cors');
const { sequelize } = require('./models');
const { startReminderJob } = require('./jobs/reminders');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const serviceRoutes      = require('./routes/services');
const debtRoutes         = require('./routes/debts');
const savingsRoutes      = require('./routes/savings');
const goalRoutes         = require('./routes/goals');
const pushRoutes         = require('./routes/push');
const webauthnRoutes     = require('./routes/webauthn');
const chatRoutes         = require('./routes/chat');
const stripeRoutes       = require('./routes/stripe');
const stripeWebhook      = require('./routes/stripeWebhook');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // needed for PWA assets
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Stripe webhook — DEBE ir antes de express.json() para recibir raw body ───
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ── Body parsing (explicit size limit to prevent payload DoS) ────────────────
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                   // 20 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 15,             // 15 mensajes por minuto (respetar cuota Gemini)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados mensajes. Espera un momento.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Intenta más tarde.' },
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/chat',     chatLimiter, chatRoutes);
app.use('/api/stripe',   apiLimiter, stripeRoutes);
app.use('/api/users',    apiLimiter, userRoutes);
app.use('/api/services', apiLimiter, serviceRoutes);
app.use('/api/debts',    apiLimiter, debtRoutes);
app.use('/api/savings',  apiLimiter, savingsRoutes);
app.use('/api/goals',    apiLimiter, goalRoutes);
app.use('/api/push',     apiLimiter, pushRoutes);
app.use('/api/webauthn', apiLimiter, webauthnRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'FinLibre API' }));
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Arranque ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
sequelize
  .sync({})
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    startReminderJob();
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ Error de base de datos:', err.message));
