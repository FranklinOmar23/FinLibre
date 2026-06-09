const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'nombre', 'email', 'ingreso_mensual', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    console.error('[users.getProfile]', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, ingreso_mensual, password, moneda, idioma } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100)
        return res.status(400).json({ message: 'Nombre inválido' });
      user.nombre = nombre.trim();
    }
    if (ingreso_mensual !== undefined) {
      const n = Number(ingreso_mensual);
      if (isNaN(n) || n < 0) return res.status(400).json({ message: 'Ingreso inválido' });
      user.ingreso_mensual = n;
    }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128)
        return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 128 caracteres' });
      user.password = await bcrypt.hash(password, 12);
    }
    if (moneda !== undefined) user.moneda = moneda;
    if (idioma !== undefined) user.idioma = idioma;

    await user.save();
    res.json({
      user: {
        id: user.id, nombre: user.nombre, email: user.email,
        ingreso_mensual: user.ingreso_mensual,
        moneda: user.moneda, idioma: user.idioma,
      },
    });
  } catch (err) {
    console.error('[users.updateProfile]', err.message);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};
