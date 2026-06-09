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
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, ingreso_mensual, password, moneda, idioma } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (nombre) user.nombre = nombre;
    if (ingreso_mensual !== undefined) user.ingreso_mensual = ingreso_mensual;
    if (password) user.password = await bcrypt.hash(password, 12);
    if (moneda) user.moneda = moneda;
    if (idioma) user.idioma = idioma;

    await user.save();
    res.json({
      user: {
        id: user.id, nombre: user.nombre, email: user.email,
        ingreso_mensual: user.ingreso_mensual,
        moneda: user.moneda, idioma: user.idioma,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};
