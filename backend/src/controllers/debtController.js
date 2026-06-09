const { Debt } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const debts = await Debt.findAll({
      where: { user_id: req.userId, activa: true },
      order: [['monto_total', 'ASC']],
    });
    res.json({ debts });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto_total, cuota_mensual, monto_pagado, tipo, emoji } = req.body;
    if (!nombre || !monto_total || !cuota_mensual)
      return res.status(400).json({ message: 'Nombre, monto total y cuota son requeridos' });

    const debt = await Debt.create({
      user_id: req.userId,
      nombre,
      monto_total,
      cuota_mensual,
      monto_pagado: monto_pagado || 0,
      tipo: tipo || 'Otro',
      emoji: emoji || '💳',
    });
    res.status(201).json({ debt });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear deuda', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    const { nombre, monto_total, cuota_mensual, monto_pagado, tipo, emoji } = req.body;
    if (nombre) debt.nombre = nombre;
    if (monto_total) debt.monto_total = monto_total;
    if (cuota_mensual) debt.cuota_mensual = cuota_mensual;
    if (monto_pagado !== undefined) debt.monto_pagado = monto_pagado;
    if (tipo) debt.tipo = tipo;
    if (emoji) debt.emoji = emoji;

    await debt.save();
    res.json({ debt });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    debt.activa = false;
    await debt.save();
    res.json({ message: 'Deuda eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
};

// Pagar una cuota (incrementa monto_pagado)
exports.pagarCuota = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    const nuevoPagado = parseFloat(debt.monto_pagado) + parseFloat(debt.cuota_mensual);
    debt.monto_pagado = Math.min(nuevoPagado, parseFloat(debt.monto_total));

    if (parseFloat(debt.monto_pagado) >= parseFloat(debt.monto_total)) {
      debt.activa = false;
    }

    await debt.save();
    res.json({ debt, liquidada: !debt.activa });
  } catch (err) {
    res.status(500).json({ message: 'Error al pagar cuota', error: err.message });
  }
};
