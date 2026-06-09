const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Savings = sequelize.define('Savings', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  nombre:         { type: DataTypes.STRING(100), allowNull: false },
  monto_objetivo: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  monto_actual:   { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  descripcion:    { type: DataTypes.STRING(255), defaultValue: '' },
}, {
  tableName: 'savings',
  timestamps: true,
});

module.exports = Savings;
