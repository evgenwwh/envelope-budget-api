const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Envelope = sequelize.define('Envelope', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    get() {
      return Number(this.getDataValue('budget'));
    },
  },
}, {
  tableName: 'envelopes',
  timestamps: false,
});

module.exports = Envelope;
