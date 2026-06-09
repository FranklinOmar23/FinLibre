const { Savings } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const savings = await Savings.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ savings });
  } catch (err) {
    console.error('[savings.getAll]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto_objetivo, monto_actual, descripcion } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
      return res.status(400).json({ message: 'Nombre inválido' });

    const objetivoNum = Number(monto_objetivo);
    if (!monto_objetivo || isNaN(objetivoNum) || objetivoNum <= 0 || objetivoNum > 999_999_999)
      return res.status(400).json({ message: 'Monto objetivo inválido' });

    const saving = await Savings.create({
      user_id: req.userId,
      nombre: nombre.trim(),
      monto_objetivo: objetivoNum,
      monto_actual: Math.max(0, Number(monto_actual) || 0),
      descripcion: typeof descripcion === 'string' ? descripcion.slice(0, 255) : '',
    });
    res.status(201).json({ saving });
  } catch (err) {
    console.error('[savings.create]', err.message);
    res.status(500).json({ message: 'Error al crear' });
  }
};

exports.update = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });

    const { nombre, monto_objetivo, monto_actual, descripcion } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
        return res.status(400).json({ message: 'Nombre inválido' });
      saving.nombre = nombre.trim();
    }
    if (monto_objetivo !== undefined) {
      const n = Number(monto_objetivo);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Monto objetivo inválido' });
      saving.monto_objetivo = n;
    }
    if (monto_actual !== undefined) saving.monto_actual = Math.max(0, Number(monto_actual));
    if (descripcion !== undefined) saving.descripcion = String(descripcion).slice(0, 255);

    await saving.save();
    res.json({ saving });
  } catch (err) {
    console.error('[savings.update]', err.message);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};

exports.remove = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });
    await saving.destroy();
    res.json({ message: 'Eliminado' });
  } catch (err) {
    console.error('[savings.remove]', err.message);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

exports.abonar = async (req, res) => {
  try {
    const saving = await Savings.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!saving) return res.status(404).json({ message: 'No encontrado' });

    const monto = parseFloat(req.body.monto);
    if (!monto || isNaN(monto) || monto <= 0) return res.status(400).json({ message: 'Monto inválido' });

    saving.monto_actual = Math.min(
      parseFloat(saving.monto_actual) + monto,
      parseFloat(saving.monto_objetivo)
    );
    await saving.save();
    res.json({ saving, completado: parseFloat(saving.monto_actual) >= parseFloat(saving.monto_objetivo) });
  } catch (err) {
    console.error('[savings.abonar]', err.message);
    res.status(500).json({ message: 'Error al abonar' });
  }
};
