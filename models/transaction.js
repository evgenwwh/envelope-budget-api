const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Transaction = sequelize.define('Transaction', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      return Number(this.getDataValue('amount'));
    },
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'transactions',
  timestamps: false,
});

module.exports = Transaction;
