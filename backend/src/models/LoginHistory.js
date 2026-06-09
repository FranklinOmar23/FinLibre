const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
}, {
  tableName: 'login_history',
  timestamps: true,
  updatedAt: false,
});

module.exports = LoginHistory;
