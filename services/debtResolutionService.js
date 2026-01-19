const Debt = require('../models/Debt');
const DormGroup = require('../models/DormGroup');
const mongoose = require('mongoose');
const { NotFoundError, ForbiddenError } = require('../utils/ApiError');

/**
 * Debt Resolution Service
 * Implements algorithms to simplify multi-party debts
 * 
 * Algorithm:
 * 1. Calculate net balance for each user in the group
 * 2. Separate users into creditors (positive balance) and debtors (negative balance)
 * 3. Use greedy algorithm to match largest debtor with largest creditor
 * 4. Continue until all debts are resolved
 * 
 * This minimizes the number of transactions needed to settle all debts
 */

class DebtResolutionService {
  /**
   * Resolve debts for a dorm group
   * @param {String} groupId - Dorm group ID
   * @param {String} userId - Requesting user ID
   * @returns {Object} { currentDebts, netBalances, optimizedTransactions, savings }
   */
  static async resolveGroupDebts(groupId, userId) {
    // Verify group exists and user is a member
    const group = await DormGroup.findById(groupId).populate('members.user', 'username fullName email');

    if (!group) {
      throw new NotFoundError('Dorm group not found');
    }

    if (!group.isUserMember(userId)) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get all active debts in the group
    const debts = await Debt.find({
      dormGroup: groupId,
      status: { $in: ['pending', 'partial'] },
      isDeleted: false,
    }).populate('creditor debtor', 'username fullName email');

    // Calculate net balances for all group members
    const netBalances = this.calculateNetBalances(debts, group.members);

    // Generate optimized transactions
    const optimizedTransactions = this.generateOptimizedTransactions(netBalances);

    // Calculate savings
    const currentTransactionCount = debts.length;
    const optimizedTransactionCount = optimizedTransactions.length;
    const savings = {
      currentTransactions: currentTransactionCount,
      optimizedTransactions: optimizedTransactionCount,
      transactionsSaved: currentTransactionCount - optimizedTransactionCount,
      percentageSaved: currentTransactionCount > 0 
        ? Math.round(((currentTransactionCount - optimizedTransactionCount) / currentTransactionCount) * 100)
        : 0,
    };

    return {
      currentDebts: debts,
      netBalances: Object.entries(netBalances)
        .filter(([_, balance]) => Math.abs(balance.amount) > 0.01) // Filter out zero balances
        .map(([userId, balance]) => balance)
        .sort((a, b) => b.amount - a.amount),
      optimizedTransactions,
      savings,
      currency: group.settings.currency,
    };
  }

  /**
   * Calculate net balance for each user
   * Net balance = Total owed to user - Total user owes
   * Positive = user should receive money
   * Negative = user should pay money
   * 
   * @param {Array} debts - Array of debt documents
   * @param {Array} members - Group members
   * @returns {Object} User ID mapped to net balance
   */
  static calculateNetBalances(debts, members) {
    const balances = {};

    // Initialize balances for all members
    members.forEach((member) => {
      if (member.isActive) {
        const userId = member.user._id.toString();
        balances[userId] = {
          userId,
          username: member.user.username,
          fullName: member.user.fullName,
          email: member.user.email,
          amount: 0,
        };
      }
    });

    // Calculate net balances
    debts.forEach((debt) => {
      const creditorId = debt.creditor._id.toString();
      const debtorId = debt.debtor._id.toString();
      const amount = debt.remainingAmount;

      // Creditor receives money (positive)
      if (balances[creditorId]) {
        balances[creditorId].amount += amount;
      }

      // Debtor owes money (negative)
      if (balances[debtorId]) {
        balances[debtorId].amount -= amount;
      }
    });

    return balances;
  }

  /**
   * Generate optimized transactions using greedy algorithm
   * Matches largest creditors with largest debtors
   * 
   * @param {Object} netBalances - Net balances for all users
   * @returns {Array} Optimized transactions
   */
  static generateOptimizedTransactions(netBalances) {
    const transactions = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = Object.values(netBalances)
      .filter((user) => user.amount > 0.01)
      .sort((a, b) => b.amount - a.amount); // Sort descending

    const debtors = Object.values(netBalances)
      .filter((user) => user.amount < -0.01)
      .sort((a, b) => a.amount - b.amount); // Sort ascending (most negative first)

    let i = 0; // Creditor index
    let j = 0; // Debtor index

    // Greedy algorithm: Match largest creditor with largest debtor
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Calculate transaction amount (minimum of what creditor is owed and debtor owes)
      const amount = Math.min(creditor.amount, Math.abs(debtor.amount));

      // Only create transaction if amount is significant (> 0.01 to avoid floating point issues)
      if (amount > 0.01) {
        transactions.push({
          from: {
            userId: debtor.userId,
            username: debtor.username,
            fullName: debtor.fullName,
          },
          to: {
            userId: creditor.userId,
            username: creditor.username,
            fullName: creditor.fullName,
          },
          amount: parseFloat(amount.toFixed(2)),
        });

        // Update balances
        creditor.amount -= amount;
        debtor.amount += amount;
      }

      // Move to next creditor if current one is settled
      if (creditor.amount < 0.01) {
        i++;
      }

      // Move to next debtor if current one is settled
      if (Math.abs(debtor.amount) < 0.01) {
        j++;
      }
    }

    return transactions;
  }

  /**
   * Calculate debt between two specific users
   * @param {String} user1Id - First user ID
   * @param {String} user2Id - Second user ID
   * @returns {Object} Net debt between users
   */
  static async calculateDebtBetweenUsers(user1Id, user2Id) {
    const result = await Debt.calculateDebtBetweenUsers(
      mongoose.Types.ObjectId(user1Id),
      mongoose.Types.ObjectId(user2Id)
    );

    return {
      user1: {
        userId: user1Id,
        owes: result.user1Owes,
      },
      user2: {
        userId: user2Id,
        owes: result.user2Owes,
      },
      netDebt: result.netDebt,
      netDirection: result.netDebt > 0 ? 'user1_owes_user2' : 'user2_owes_user1',
      netAmount: Math.abs(result.netDebt),
    };
  }

  /**
   * Get debt summary for entire group
   * @param {String} groupId - Dorm group ID
   * @param {String} userId - Requesting user ID
   * @returns {Object} Group debt summary
   */
  static async getGroupSummary(groupId, userId) {
    const group = await DormGroup.findById(groupId).populate('members.user', 'username fullName');

    if (!group) {
      throw new NotFoundError('Dorm group not found');
    }

    if (!group.isUserMember(userId)) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Get all active debts
    const debts = await Debt.find({
      dormGroup: groupId,
      status: { $in: ['pending', 'partial'] },
      isDeleted: false,
    });

    // Calculate totals
    const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const debtsByCategory = debts.reduce((acc, debt) => {
      acc[debt.category] = (acc[debt.category] || 0) + debt.remainingAmount;
      return acc;
    }, {});

    // Get overdue debts
    const overdueDebts = debts.filter((debt) => debt.dueDate && debt.dueDate < new Date());

    // Get most active users (by debt count)
    const userDebtCounts = {};
    debts.forEach((debt) => {
      const creditorId = debt.creditor.toString();
      const debtorId = debt.debtor.toString();

      userDebtCounts[creditorId] = (userDebtCounts[creditorId] || 0) + 1;
      userDebtCounts[debtorId] = (userDebtCounts[debtorId] || 0) + 1;
    });

    return {
      group: {
        id: group._id,
        name: group.name,
        memberCount: group.activeMembersCount,
        currency: group.settings.currency,
      },
      summary: {
        totalDebts: debts.length,
        totalAmount: parseFloat(totalDebtAmount.toFixed(2)),
        overdueDebts: overdueDebts.length,
        overdueAmount: parseFloat(
          overdueDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0).toFixed(2)
        ),
        debtsByCategory: Object.entries(debtsByCategory).map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
        })),
      },
    };
  }
}

module.exports = DebtResolutionService;
