const { Debt } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const debts = await Debt.findAll({
      where: { user_id: req.userId, activa: true },
      order: [['monto_total', 'ASC']],
    });
    res.json({ debts });
  } catch (err) {
    console.error('[debts.getAll]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto_total, cuota_mensual, monto_pagado, tipo, emoji } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
      return res.status(400).json({ message: 'Nombre inválido' });

    const totalNum = Number(monto_total);
    if (!monto_total || isNaN(totalNum) || totalNum <= 0 || totalNum > 999_999_999)
      return res.status(400).json({ message: 'Monto total inválido' });

    const cuotaNum = Number(cuota_mensual);
    if (!cuota_mensual || isNaN(cuotaNum) || cuotaNum <= 0 || cuotaNum > totalNum)
      return res.status(400).json({ message: 'Cuota mensual inválida' });

    const pagadoNum = Math.max(0, Number(monto_pagado) || 0);

    const debt = await Debt.create({
      user_id: req.userId,
      nombre: nombre.trim(),
      monto_total: totalNum,
      cuota_mensual: cuotaNum,
      monto_pagado: pagadoNum,
      tipo: tipo || 'Otro',
      emoji: emoji || '💳',
    });
    res.status(201).json({ debt });
  } catch (err) {
    console.error('[debts.create]', err.message);
    res.status(500).json({ message: 'Error al crear deuda' });
  }
};

exports.update = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    const { nombre, monto_total, cuota_mensual, monto_pagado, tipo, emoji } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
        return res.status(400).json({ message: 'Nombre inválido' });
      debt.nombre = nombre.trim();
    }
    if (monto_total !== undefined) {
      const n = Number(monto_total);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Monto total inválido' });
      debt.monto_total = n;
    }
    if (cuota_mensual !== undefined) {
      const n = Number(cuota_mensual);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Cuota inválida' });
      debt.cuota_mensual = n;
    }
    if (monto_pagado !== undefined) debt.monto_pagado = Math.max(0, Number(monto_pagado));
    if (tipo) debt.tipo = tipo;
    if (emoji) debt.emoji = emoji;

    await debt.save();
    res.json({ debt });
  } catch (err) {
    console.error('[debts.update]', err.message);
    res.status(500).json({ message: 'Error al actualizar' });
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
    console.error('[debts.remove]', err.message);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

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
    console.error('[debts.pagarCuota]', err.message);
    res.status(500).json({ message: 'Error al pagar cuota' });
  }
};
