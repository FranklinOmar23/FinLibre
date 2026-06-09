const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM(
      'Vivienda',
      'Utilidades',
      'Comunicación',
      'Entretenimiento',
      'Salud',
      'Transporte',
      'Otro'
    ),
    defaultValue: 'Otro',
  },
  emoji: {
    type: DataTypes.STRING(10),
    defaultValue: '📦',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'services',
  timestamps: true,
});

module.exports = Service;
