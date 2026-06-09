const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Debt = sequelize.define('Debt', {
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
  monto_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  monto_pagado: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  cuota_mensual: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM(
      'Préstamo bancario',
      'Tarjeta de crédito',
      'Deuda personal',
      'Hipoteca',
      'Otro'
    ),
    defaultValue: 'Otro',
  },
  emoji: {
    type: DataTypes.STRING(10),
    defaultValue: '💳',
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'debts',
  timestamps: true,
});

module.exports = Debt;
