const { Goal } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, categoria, monto_objetivo, monto_actual, ahorro_mensual, fecha_objetivo } = req.body;
    if (!nombre || !monto_objetivo || !ahorro_mensual)
      return res.status(400).json({ message: 'Nombre, monto objetivo y ahorro mensual son requeridos' });
    const goal = await Goal.create({
      user_id: req.userId,
      nombre,
      categoria: categoria || 'Otro',
      monto_objetivo,
      monto_actual: monto_actual || 0,
      ahorro_mensual,
      fecha_objetivo: fecha_objetivo || null,
    });
    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear meta', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });
    const { nombre, categoria, monto_objetivo, monto_actual, ahorro_mensual, fecha_objetivo } = req.body;
    if (nombre !== undefined)          goal.nombre = nombre;
    if (categoria !== undefined)       goal.categoria = categoria;
    if (monto_objetivo !== undefined)  goal.monto_objetivo = monto_objetivo;
    if (monto_actual !== undefined)    goal.monto_actual = monto_actual;
    if (ahorro_mensual !== undefined)  goal.ahorro_mensual = ahorro_mensual;
    if (fecha_objetivo !== undefined)  goal.fecha_objetivo = fecha_objetivo;
    await goal.save();
    res.json({ goal });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });
    await goal.destroy();
    res.json({ message: 'Eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
};

exports.abonar = async (req, res) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!goal) return res.status(404).json({ message: 'No encontrada' });
    const monto = parseFloat(req.body.monto);
    if (!monto || monto <= 0) return res.status(400).json({ message: 'Monto inválido' });
    goal.monto_actual = Math.min(
      parseFloat(goal.monto_actual) + monto,
      parseFloat(goal.monto_objetivo)
    );
    await goal.save();
    res.json({ goal, completada: parseFloat(goal.monto_actual) >= parseFloat(goal.monto_objetivo) });
  } catch (err) {
    res.status(500).json({ message: 'Error al abonar', error: err.message });
  }
};
