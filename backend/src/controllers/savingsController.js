const { Savings } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const savings = await Savings.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ savings });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto_objetivo, monto_actual, descripcion } = req.body;
    if (!nombre || !monto_objetivo)
      return res.status(400).json({ message: 'Nombre y monto objetivo son requeridos' });
    const saving = await Savings.create({
      user_id: req.userId,
      nombre,
      monto_objetivo,
      monto_actual: monto_actual || 0,
      descripcion: descripcion || '',
    });
    res.status(201).json({ saving });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });
    const { nombre, monto_objetivo, monto_actual, descripcion } = req.body;
    if (nombre !== undefined)         saving.nombre = nombre;
    if (monto_objetivo !== undefined) saving.monto_objetivo = monto_objetivo;
    if (monto_actual !== undefined)   saving.monto_actual = monto_actual;
    if (descripcion !== undefined)    saving.descripcion = descripcion;
    await saving.save();
    res.json({ saving });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });
    await saving.destroy();
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
};

exports.abonar = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });
    const monto = parseFloat(req.body.monto);
    if (!monto || monto <= 0) return res.status(400).json({ message: 'Monto inválido' });
    saving.monto_actual = Math.min(
      parseFloat(saving.monto_actual) + monto,
      parseFloat(saving.monto_objetivo)
    );
    await saving.save();
    res.json({ saving, completado: parseFloat(saving.monto_actual) >= parseFloat(saving.monto_objetivo) });
  } catch (err) {
    res.status(500).json({ message: 'Error al abonar', error: err.message });
  }
};
