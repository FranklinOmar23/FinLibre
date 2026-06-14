const sequelize = require('../config/database');
const User = require('./User');
const Service = require('./Service');
const Debt = require('./Debt');
const Savings = require('./Savings');
const Goal = require('./Goal');
const PushSubscription = require('./PushSubscription');
const WebAuthnCredential = require('./WebAuthnCredential');
const RefreshToken = require('./RefreshToken');
const PasswordReset = require('./PasswordReset');
const LoginHistory = require('./LoginHistory');
const AnalysisHistory = require('./AnalysisHistory');

User.hasMany(Service, { foreignKey: 'user_id', as: 'services', onDelete: 'CASCADE' });
Service.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Debt, { foreignKey: 'user_id', as: 'debts', onDelete: 'CASCADE' });
Debt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Savings, { foreignKey: 'user_id', as: 'savings', onDelete: 'CASCADE' });
Savings.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Goal, { foreignKey: 'user_id', as: 'goals', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PushSubscription, { foreignKey: 'user_id', as: 'pushSubs', onDelete: 'CASCADE' });
PushSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(WebAuthnCredential, { foreignKey: 'user_id', as: 'webauthnCreds', onDelete: 'CASCADE' });
WebAuthnCredential.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PasswordReset, { foreignKey: 'user_id', as: 'passwordResets', onDelete: 'CASCADE' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'loginHistory', onDelete: 'CASCADE' });
LoginHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AnalysisHistory, { foreignKey: 'user_id', as: 'analysisHistory', onDelete: 'CASCADE' });
AnalysisHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Service, Debt, Savings, Goal, PushSubscription, WebAuthnCredential, RefreshToken, PasswordReset, LoginHistory, AnalysisHistory };
