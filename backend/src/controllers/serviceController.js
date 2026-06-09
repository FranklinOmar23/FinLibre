const { Service } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { user_id: req.userId, activo: true },
      order: [['createdAt', 'DESC']],
    });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto, categoria, emoji } = req.body;
    if (!nombre || !monto)
      return res.status(400).json({ message: 'Nombre y monto son requeridos' });

    const service = await Service.create({
      user_id: req.userId,
      nombre,
      monto,
      categoria: categoria || 'Otro',
      emoji: emoji || '📦',
    });
    res.status(201).json({ service });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear servicio', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const { nombre, monto, categoria, emoji } = req.body;
    if (nombre) service.nombre = nombre;
    if (monto) service.monto = monto;
    if (categoria) service.categoria = categoria;
    if (emoji) service.emoji = emoji;

    await service.save();
    res.json({ service });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const service = await Service.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    service.activo = false;
    await service.save();
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
};
