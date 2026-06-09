const cron = require('node-cron');
const { User, Debt } = require('../models');
const { sendPushToUser } = require('../controllers/pushController');

const CURRENCY_SYMBOLS = {
  DOP: 'RD$', USD: '$', EUR: '€', GBP: '£',
  BRL: 'R$', MXN: '$', COP: '$', ARS: '$', CLP: '$', PEN: 'S/',
};

function fmtMonto(n, moneda) {
  const symbol = CURRENCY_SYMBOLS[moneda] || moneda || 'RD$';
  return `${symbol}${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 0 })}`;
}

// Corre todos los días a las 8:00 AM
function startReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const dayOfWeek  = today.getDay() === 0 ? 7 : today.getDay(); // 1=Lun … 7=Dom

      const users = await User.findAll({
        where: { frecuencia_cobro: ['quincenal', 'mensual', 'semanal'] },
      });

      for (const user of users) {
        const esDia = esCobro(user.frecuencia_cobro, user.dia_cobro, dayOfMonth, dayOfWeek);
        if (!esDia) continue;

        const deudas = await Debt.findAll({
          where: { user_id: user.id, activa: true },
        });

        if (deudas.length === 0) continue;

        const totalCuotas = deudas.reduce((s, d) => s + parseFloat(d.cuota_mensual), 0);
        const moneda = user.moneda || 'DOP';
        const freq = user.frecuencia_cobro === 'semanal' ? '/semana' : '/mes';

        await sendPushToUser(user.id, {
          title: '💸 Día de cobro — FinLibre',
          body: `Hoy cobras, ${user.nombre.split(' ')[0]}. Tienes ${deudas.length} deuda${deudas.length > 1 ? 's' : ''} por ${fmtMonto(totalCuotas, moneda)}${freq}.`,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          url: '/app/deudas',
          tag: 'cobro-reminder',
        });
      }
    } catch (err) {
      console.error('[Reminder cron]', err.message);
    }
  }, { timezone: 'America/Santo_Domingo' });

  console.log('✓ Recordatorios de cobro activos (8:00 AM, Santo Domingo)');
}

function esCobro(frecuencia, diaCobro, hoy, hoyDiaSemana) {
  if (!frecuencia || !diaCobro) return false;
  if (frecuencia === 'mensual')   return hoy === diaCobro;
  if (frecuencia === 'quincenal') return hoy === 15 || hoy === diaCobro;
  if (frecuencia === 'semanal')   return hoyDiaSemana === diaCobro; // 1=Lun…7=Dom
  return false;
}

module.exports = { startReminderJob };
