const sequelize = require('../db');
const Envelope = require('./envelope');
const Transaction = require('./transaction');

Envelope.hasMany(Transaction, {
  foreignKey: { name: 'envelopeId', allowNull: false },
  onDelete: 'CASCADE',
});
Transaction.belongsTo(Envelope, { foreignKey: 'envelopeId' });

module.exports = { sequelize, Envelope, Transaction };
