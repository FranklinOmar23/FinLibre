const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { sequelize } = require('./models');
const { startReminderJob } = require('./jobs/reminders');

const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const serviceRoutes  = require('./routes/services');
const debtRoutes     = require('./routes/debts');
const savingsRoutes  = require('./routes/savings');
const goalRoutes     = require('./routes/goals');
const pushRoutes     = require('./routes/push');
const webauthnRoutes = require('./routes/webauthn');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // necesario para que las cookies httpOnly viajen
}));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/debts',    debtRoutes);
app.use('/api/savings',  savingsRoutes);
app.use('/api/goals',    goalRoutes);
app.use('/api/push',     pushRoutes);
app.use('/api/webauthn', webauthnRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'FinLibre API' }));
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    startReminderJob();
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ Error de base de datos:', err.message));
