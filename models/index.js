/**
 * Models Index
 * Central export point for all Mongoose models
 * 
 * Usage:
 * const { User, DormGroup, Debt, Transaction } = require('./models');
 */

const User = require('./User');
const DormGroup = require('./DormGroup');
const Debt = require('./Debt');
const Transaction = require('./Transaction');

module.exports = {
  User,
  DormGroup,
  Debt,
  Transaction,
};
