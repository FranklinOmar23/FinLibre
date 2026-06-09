const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebAuthnCredential = sequelize.define('WebAuthnCredential', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  credential_id: { type: DataTypes.TEXT, allowNull: false },
  public_key: { type: DataTypes.TEXT, allowNull: false },
  counter: { type: DataTypes.BIGINT, defaultValue: 0 },
  device_type: { type: DataTypes.STRING(50), allowNull: true },
}, {
  tableName: 'webauthn_credentials',
  timestamps: true,
  underscored: true,
});

module.exports = WebAuthnCredential;
