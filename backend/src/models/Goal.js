const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goal = sequelize.define('Goal', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  nombre:         { type: DataTypes.STRING(100), allowNull: false },
  categoria: {
    type: DataTypes.ENUM('Viaje', 'Vehículo', 'Educación', 'Vivienda', 'Emergencia', 'Tecnología', 'Otro'),
    defaultValue: 'Otro',
  },
  monto_objetivo: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  monto_actual:   { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  ahorro_mensual: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  fecha_objetivo: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: 'goals',
  timestamps: true,
});

module.exports = Goal;
