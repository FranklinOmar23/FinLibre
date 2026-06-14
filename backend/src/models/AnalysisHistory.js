const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalysisHistory = sequelize.define('AnalysisHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resumen: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categorias: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  recomendaciones: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  alerta: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'analysis_history',
  timestamps: true,
});

module.exports = AnalysisHistory;
