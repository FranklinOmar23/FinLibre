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

// Confiar en el proxy de Hostinger para leer la IP real del cliente
app.set('trust proxy', 1);

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
const isProd = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 50 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 15 : 500, // respetar cuota Gemini solo en prod
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados mensajes. Espera un momento.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 200 : 2000,
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

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FinLibre API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      font-family: 'Segoe UI', sans-serif;
      color: #f1f5f9;
    }
    .card {
      text-align: center;
      padding: 48px 64px;
      background: #1e293b;
      border-radius: 16px;
      border: 1px solid #334155;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    }
    .dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #22c55e;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    p { color: #94a3b8; margin-top: 12px; font-size: 0.95rem; }
    .badge {
      display: inline-block;
      margin-top: 20px;
      padding: 4px 14px;
      background: #166534;
      color: #86efac;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1><span class="dot"></span>Backend corriendo</h1>
    <p>FinLibre API está activa y lista para recibir peticiones.</p>
    <div class="badge">v1.0 &nbsp;·&nbsp; Node.js + Express</div>
  </div>
</body>
</html>`);
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'FinLibre API' }));
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Arranque ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// El servidor arranca siempre; la DB se conecta en paralelo
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));

sequelize
  .sync({})
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    startReminderJob();
  })
  .catch((err) => console.error('❌ Error de base de datos:', err.message));
