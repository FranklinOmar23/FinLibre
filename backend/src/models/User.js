const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // null cuando usa Google OAuth
  },
  ingreso_mensual: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  frecuencia_cobro: {
    type: DataTypes.ENUM('quincenal', 'mensual', 'semanal'),
    allowNull: true,
  },
  dia_cobro: {
    type: DataTypes.INTEGER, // 1-31; para quincenal = día del segundo pago (el 1ro siempre es 15)
    allowNull: true,
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  moneda: {
    type: DataTypes.ENUM('DOP','USD','EUR','GBP','BRL','MXN','COP','ARS','CLP','PEN'),
    defaultValue: 'DOP',
  },
  idioma: {
    type: DataTypes.ENUM('es','en','pt'),
    defaultValue: 'es',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
