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
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // true para usuarios existentes; nuevos registros se crean con false
    allowNull: false,
  },
  verification_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  regimen: {
    type: DataTypes.ENUM('RD_FORMAL', 'CUSTOM', 'NONE'),
    defaultValue: 'RD_FORMAL',
    allowNull: false,
  },
  deduccion_pct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: null,
  },
  analysis_pro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Garantiza que un usuario con token de verificación nunca se guarde como verificado,
// sin importar el defaultValue del modelo ni el DEFAULT de MySQL.
User.addHook('beforeCreate', (user) => {
  if (user.getDataValue('verification_token')) {
    user.setDataValue('email_verified', false);
  }
});

module.exports = User;
