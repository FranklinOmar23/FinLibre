const { Goal } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ goals });
  } catch (err) {
    console.error('[goals.getAll]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, categoria, monto_objetivo, monto_actual, ahorro_mensual, fecha_objetivo } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
      return res.status(400).json({ message: 'Nombre inválido' });

    const objetivoNum = Number(monto_objetivo);
    if (!monto_objetivo || isNaN(objetivoNum) || objetivoNum <= 0 || objetivoNum > 999_999_999)
      return res.status(400).json({ message: 'Monto objetivo inválido' });

    const ahorroNum = Number(ahorro_mensual);
    if (!ahorro_mensual || isNaN(ahorroNum) || ahorroNum <= 0 || ahorroNum > objetivoNum)
      return res.status(400).json({ message: 'Ahorro mensual inválido' });

    const goal = await Goal.create({
      user_id: req.userId,
      nombre: nombre.trim(),
      categoria: categoria || 'Otro',
      monto_objetivo: objetivoNum,
      monto_actual: Math.max(0, Number(monto_actual) || 0),
      ahorro_mensual: ahorroNum,
      fecha_objetivo: fecha_objetivo || null,
    });
    res.status(201).json({ goal });
  } catch (err) {
    console.error('[goals.create]', err.message);
    res.status(500).json({ message: 'Error al crear meta' });
  }
};

exports.update = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });

    const { nombre, categoria, monto_objetivo, monto_actual, ahorro_mensual, fecha_objetivo } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
        return res.status(400).json({ message: 'Nombre inválido' });
      goal.nombre = nombre.trim();
    }
    if (categoria !== undefined) goal.categoria = categoria;
    if (monto_objetivo !== undefined) {
      const n = Number(monto_objetivo);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Monto objetivo inválido' });
      goal.monto_objetivo = n;
    }
    if (monto_actual !== undefined) goal.monto_actual = Math.max(0, Number(monto_actual));
    if (ahorro_mensual !== undefined) {
      const n = Number(ahorro_mensual);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Ahorro mensual inválido' });
      goal.ahorro_mensual = n;
    }
    if (fecha_objetivo !== undefined) goal.fecha_objetivo = fecha_objetivo;

    await goal.save();
    res.json({ goal });
  } catch (err) {
    console.error('[goals.update]', err.message);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};

exports.remove = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });
    await goal.destroy();
    res.json({ message: 'Eliminada' });
  } catch (err) {
    console.error('[goals.remove]', err.message);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

exports.abonar = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });

    const monto = parseFloat(req.body.monto);
    if (!monto || isNaN(monto) || monto <= 0) return res.status(400).json({ message: 'Monto inválido' });

    goal.monto_actual = Math.min(
      parseFloat(goal.monto_actual) + monto,
      parseFloat(goal.monto_objetivo)
    );
    await goal.save();
    res.json({ goal, completada: parseFloat(goal.monto_actual) >= parseFloat(goal.monto_objetivo) });
  } catch (err) {
    console.error('[goals.abonar]', err.message);
    res.status(500).json({ message: 'Error al abonar' });
  }
};
