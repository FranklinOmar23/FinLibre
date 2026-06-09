const { Service } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { user_id: req.userId, activo: true },
      order: [['createdAt', 'DESC']],
    });
    res.json({ services });
  } catch (err) {
    console.error('[services.getAll]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, monto, categoria, emoji } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
      return res.status(400).json({ message: 'Nombre inválido (máximo 100 caracteres)' });

    const montoNum = Number(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0 || montoNum > 9_999_999)
      return res.status(400).json({ message: 'Monto inválido' });

    const service = await Service.create({
      user_id: req.userId,
      nombre: nombre.trim(),
      monto: montoNum,
      categoria: categoria || 'Otro',
      emoji: emoji || '📦',
    });
    res.status(201).json({ service });
  } catch (err) {
    console.error('[services.create]', err.message);
    res.status(500).json({ message: 'Error al crear servicio' });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const { nombre, monto, categoria, emoji } = req.body;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)
        return res.status(400).json({ message: 'Nombre inválido' });
      service.nombre = nombre.trim();
    }
    if (monto !== undefined) {
      const montoNum = Number(monto);
      if (isNaN(montoNum) || montoNum <= 0 || montoNum > 9_999_999)
        return res.status(400).json({ message: 'Monto inválido' });
      service.monto = montoNum;
    }
    if (categoria) service.categoria = categoria;
    if (emoji) service.emoji = emoji;

    await service.save();
    res.json({ service });
  } catch (err) {
    console.error('[services.update]', err.message);
    res.status(500).json({ message: 'Error al actualizar' });
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
    console.error('[services.remove]', err.message);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};
