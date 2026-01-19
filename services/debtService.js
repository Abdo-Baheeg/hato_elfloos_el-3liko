const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');
const DormGroup = require('../models/DormGroup');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require('../utils/ApiError');

/**
 * Debt Service
 * Handles all debt-related business logic
 */

class DebtService {
  /**
   * Create a new debt
   * @param {String} creditorId - User creating the debt (who is owed)
   * @param {Object} debtData - Debt data
   * @returns {Object} created debt
   */
  static async createDebt(creditorId, debtData) {
    const { debtor, dormGroup, originalAmount, description, category, dueDate } = debtData;

    // Verify debtor and creditor are different
    if (debtor === creditorId.toString()) {
      throw new BadRequestError('You cannot create a debt to yourself');
    }

    // Verify both users are members of the dorm group
    const group = await DormGroup.findById(dormGroup);
    if (!group) {
      throw new NotFoundError('Dorm group not found');
    }

    if (!group.isUserMember(creditorId)) {
      throw new ForbiddenError('You are not a member of this dorm group');
    }

    if (!group.isUserMember(debtor)) {
      throw new ForbiddenError('Debtor is not a member of this dorm group');
    }

    // Create debt
    const debt = await Debt.create({
      creditor: creditorId,
      debtor,
      dormGroup,
      originalAmount,
      remainingAmount: originalAmount,
      currency: group.settings.currency,
      description,
      category: category || 'other',
      dueDate: dueDate || new Date(Date.now() + group.settings.debtDueDateDefault * 24 * 60 * 60 * 1000),
    });

    await debt.populate('creditor', 'username fullName email');
    await debt.populate('debtor', 'username fullName email');

    // Update group statistics
    await group.updateStatistics();

    return debt;
  }

  /**
   * Get debts for a user
   * @param {String} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Object} { debts, pagination }
   */
  static async getDebts(userId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      dormGroup,
      type, // 'owed' (as creditor) or 'owing' (as debtor) or 'all'
      sort = '-createdAt',
    } = filters;

    const query = { isDeleted: false };

    // Filter by user role (creditor or debtor)
    if (type === 'owed') {
      query.creditor = userId;
    } else if (type === 'owing') {
      query.debtor = userId;
    } else {
      query.$or = [{ creditor: userId }, { debtor: userId }];
    }

    // Additional filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (dormGroup) query.dormGroup = dormGroup;

    const skip = (page - 1) * limit;

    const [debts, total] = await Promise.all([
      Debt.find(query)
        .populate('creditor', 'username fullName email')
        .populate('debtor', 'username fullName email')
        .populate('dormGroup', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Debt.countDocuments(query),
    ]);

    return {
      debts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single debt by ID
   * @param {String} debtId - Debt ID
   * @param {String} userId - Requesting user ID
   * @returns {Object} debt
   */
  static async getDebtById(debtId, userId) {
    const debt = await Debt.findById(debtId)
      .populate('creditor', 'username fullName email profilePicture')
      .populate('debtor', 'username fullName email profilePicture')
      .populate('dormGroup', 'name')
      .populate('notes.user', 'username fullName')
      .populate('transactions');

    if (!debt || debt.isDeleted) {
      throw new NotFoundError('Debt not found');
    }

    // Check if user is involved in the debt
    if (!debt.creditor._id.equals(userId) && !debt.debtor._id.equals(userId)) {
      throw new ForbiddenError('You are not authorized to view this debt');
    }

    return debt;
  }

  /**
   * Update debt
   * @param {String} debtId - Debt ID
   * @param {String} userId - Requesting user ID
   * @param {Object} updateData - Data to update
   * @returns {Object} updated debt
   */
  static async updateDebt(debtId, userId, updateData) {
    const debt = await Debt.findById(debtId);

    if (!debt || debt.isDeleted) {
      throw new NotFoundError('Debt not found');
    }

    // Only creditor can update debt details
    if (!debt.creditor.equals(userId)) {
      throw new ForbiddenError('Only the creditor can update debt details');
    }

    // Prevent updating if debt is already paid
    if (debt.status === 'paid') {
      throw new BadRequestError('Cannot update a paid debt');
    }

    // Update allowed fields
    const allowedUpdates = ['description', 'category', 'dueDate', 'status'];
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        debt[key] = updateData[key];
      }
    });

    await debt.save();
    await debt.populate('creditor debtor', 'username fullName email');

    return debt;
  }

  /**
   * Settle (pay) a debt
   * @param {String} debtId - Debt ID
   * @param {String} payerId - User making payment
   * @param {Object} paymentData - Payment details
   * @returns {Object} { debt, transaction }
   */
  static async settleDebt(debtId, payerId, paymentData) {
    const debt = await Debt.findById(debtId);

    if (!debt || debt.isDeleted) {
      throw new NotFoundError('Debt not found');
    }

    // Only debtor can settle the debt
    if (!debt.debtor.equals(payerId)) {
      throw new ForbiddenError('Only the debtor can settle this debt');
    }

    // Check if debt is already paid
    if (debt.status === 'paid') {
      throw new BadRequestError('This debt is already paid');
    }

    const { amount, paymentMethod = 'cash', notes } = paymentData;

    // Determine payment amount
    const paymentAmount = amount || debt.remainingAmount;

    if (paymentAmount > debt.remainingAmount) {
      throw new BadRequestError('Payment amount exceeds remaining debt');
    }

    // Create transaction
    const transaction = await Transaction.create({
      payer: debt.debtor,
      payee: debt.creditor,
      dormGroup: debt.dormGroup,
      amount: paymentAmount,
      currency: debt.currency,
      type: 'payment',
      paymentMethod,
      notes,
      status: 'pending', // Pending creditor confirmation
      debts: [
        {
          debt: debt._id,
          amountApplied: paymentAmount,
        },
      ],
      description: `Payment for: ${debt.description}`,
    });

    await debt.populate('creditor debtor', 'username fullName email');

    return {
      debt,
      transaction,
      message: 'Payment recorded. Waiting for creditor confirmation',
    };
  }

  /**
   * Add note to debt
   * @param {String} debtId - Debt ID
   * @param {String} userId - User adding note
   * @param {String} content - Note content
   * @returns {Object} updated debt
   */
  static async addNote(debtId, userId, content) {
    const debt = await Debt.findById(debtId);

    if (!debt || debt.isDeleted) {
      throw new NotFoundError('Debt not found');
    }

    // Check if user is involved in the debt
    if (!debt.creditor.equals(userId) && !debt.debtor.equals(userId)) {
      throw new ForbiddenError('You are not authorized to add notes to this debt');
    }

    await debt.addNote(userId, content);
    await debt.populate('notes.user', 'username fullName');

    return debt;
  }

  /**
   * Delete (soft delete) a debt
   * @param {String} debtId - Debt ID
   * @param {String} userId - Requesting user ID
   */
  static async deleteDebt(debtId, userId) {
    const debt = await Debt.findById(debtId);

    if (!debt || debt.isDeleted) {
      throw new NotFoundError('Debt not found');
    }

    // Only creditor can delete debt
    if (!debt.creditor.equals(userId)) {
      throw new ForbiddenError('Only the creditor can delete this debt');
    }

    // Cannot delete if there are confirmed transactions
    const confirmedTransactions = await Transaction.countDocuments({
      'debts.debt': debtId,
      status: 'confirmed',
    });

    if (confirmedTransactions > 0) {
      throw new BadRequestError('Cannot delete a debt with confirmed payments');
    }

    // Soft delete
    debt.isDeleted = true;
    debt.deletedAt = new Date();
    debt.deletedBy = userId;
    await debt.save();

    return { message: 'Debt deleted successfully' };
  }

  /**
   * Get debt statistics for user
   * @param {String} userId - User ID
   * @returns {Object} statistics
   */
  static async getDebtStatistics(userId) {
    const [totalOwed, totalOwing, overdueDebts] = await Promise.all([
      // Total amount owed to user (as creditor)
      Debt.aggregate([
        {
          $match: {
            creditor: userId,
            status: { $in: ['pending', 'partial'] },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainingAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Total amount user owes (as debtor)
      Debt.aggregate([
        {
          $match: {
            debtor: userId,
            status: { $in: ['pending', 'partial'] },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainingAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Overdue debts count
      Debt.countDocuments({
        debtor: userId,
        status: { $in: ['pending', 'partial'] },
        dueDate: { $lt: new Date() },
        isDeleted: false,
      }),
    ]);

    return {
      owed: {
        amount: totalOwed[0]?.total || 0,
        count: totalOwed[0]?.count || 0,
      },
      owing: {
        amount: totalOwing[0]?.total || 0,
        count: totalOwing[0]?.count || 0,
      },
      overdue: overdueDebts,
    };
  }
}

module.exports = DebtService;
