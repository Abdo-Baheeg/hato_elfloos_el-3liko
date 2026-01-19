const mongoose = require('mongoose');

/**
 * Transaction Schema
 * Represents a payment/settlement transaction between users
 * 
 * Design Decisions:
 * - Tracks actual money movements (not just debt creation)
 * - Can be linked to one or multiple debts (for settlement optimization)
 * - Supports multiple payment methods
 * - Includes verification/confirmation workflow
 * - Stores proof of payment (receipts, transaction IDs)
 * - Maintains audit trail with status history
 * - Supports reversals and refunds
 * - Indexed for fast querying by payer, payee, and status
 */
const transactionSchema = new mongoose.Schema(
  {
    // Core Transaction Information
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
      index: true,
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payee is required'],
      index: true,
    },
    dormGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DormGroup',
      required: [true, 'Dorm group is required'],
      index: true,
    },

    // Amount Information
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      enum: ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'],
    },

    // Transaction Type
    type: {
      type: String,
      enum: ['payment', 'settlement', 'refund', 'adjustment'],
      default: 'payment',
      required: true,
    },

    // Related Debts
    // Array of debts this transaction settles (partially or fully)
    debts: [
      {
        debt: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Debt',
        },
        amountApplied: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Payment Method
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'bank_transfer',
        'mobile_payment',
        'credit_card',
        'debit_card',
        'paypal',
        'venmo',
        'other',
      ],
      default: 'cash',
    },
    paymentDetails: {
      // Flexible object for method-specific details
      transactionId: String, // External payment system transaction ID
      accountLast4: String, // Last 4 digits of card/account
      notes: String,
    },

    // Status Workflow
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'reversed'],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'reversed'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],

    // Verification
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },

    // Proof of Payment
    attachments: [
      {
        filename: String,
        url: String,
        type: {
          type: String,
          enum: ['receipt', 'screenshot', 'document', 'other'],
          default: 'receipt',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Transaction Details
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // Scheduled Transaction
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      endDate: Date,
      nextOccurrence: Date,
    },

    // Reversal Information
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    reversalReason: String,
    reversalTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    originalTransaction: {
      // If this is a reversal, reference to original
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },

    // Metadata
    ipAddress: String,
    userAgent: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
transactionSchema.index({ payer: 1, status: 1, isDeleted: 1 });
transactionSchema.index({ payee: 1, status: 1, isDeleted: 1 });
transactionSchema.index({ dormGroup: 1, status: 1, createdAt: -1 });
transactionSchema.index({ status: 1, scheduledDate: 1 }); // For scheduled transactions
transactionSchema.index({ createdAt: -1 }); // For recent transactions
transactionSchema.index({ 'debts.debt': 1 }); // For debt-based lookups

// Virtual for total amount applied to debts
transactionSchema.virtual('totalApplied').get(function () {
  return this.debts.reduce((sum, d) => sum + d.amountApplied, 0);
});

// Virtual for checking if fully applied
transactionSchema.virtual('isFullyApplied').get(function () {
  const totalApplied = this.debts.reduce((sum, d) => sum + d.amountApplied, 0);
  return Math.abs(totalApplied - this.amount) < 0.01; // Account for floating point precision
});

// Validation: payer and payee cannot be the same
transactionSchema.pre('validate', function (next) {
  if (this.payer && this.payee && this.payer.equals(this.payee)) {
    next(new Error('Payer and payee cannot be the same person'));
  } else {
    next();
  }
});

// Pre-save middleware to add status to history
transactionSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.confirmedBy || this.payer,
    });
  }
  next();
});

// Pre-save middleware to set confirmation timestamp
transactionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

// Static method to find active transactions
transactionSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

// Static method to find pending transactions
transactionSchema.statics.findPending = function (filter = {}) {
  return this.find({ ...filter, status: 'pending', isDeleted: false });
};

// Static method to calculate total transactions between two users
transactionSchema.statics.calculateTransactionsBetweenUsers = async function (
  user1Id,
  user2Id
) {
  const user1PaidUser2 = await this.aggregate([
    {
      $match: {
        payer: mongoose.Types.ObjectId(user1Id),
        payee: mongoose.Types.ObjectId(user2Id),
        status: 'confirmed',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const user2PaidUser1 = await this.aggregate([
    {
      $match: {
        payer: mongoose.Types.ObjectId(user2Id),
        payee: mongoose.Types.ObjectId(user1Id),
        status: 'confirmed',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    user1Paid: user1PaidUser2[0]?.total || 0,
    user2Paid: user2PaidUser1[0]?.total || 0,
    user1Count: user1PaidUser2[0]?.count || 0,
    user2Count: user2PaidUser1[0]?.count || 0,
    netAmount: (user1PaidUser2[0]?.total || 0) - (user2PaidUser1[0]?.total || 0),
  };
};

// Instance method to confirm transaction
transactionSchema.methods.confirm = async function (confirmerId) {
  if (this.status !== 'pending') {
    throw new Error('Only pending transactions can be confirmed');
  }

  this.status = 'confirmed';
  this.confirmedBy = confirmerId;
  this.confirmedAt = new Date();

  // Update related debts
  const Debt = mongoose.model('Debt');
  for (const debtItem of this.debts) {
    const debt = await Debt.findById(debtItem.debt);
    if (debt) {
      await debt.makePayment(debtItem.amountApplied);
      debt.transactions.push(this._id);
      await debt.save();
    }
  }

  return this.save();
};

// Instance method to reject transaction
transactionSchema.methods.reject = function (reason, rejectedBy) {
  if (this.status !== 'pending') {
    throw new Error('Only pending transactions can be rejected');
  }

  this.status = 'rejected';
  this.statusHistory.push({
    status: 'rejected',
    changedBy: rejectedBy,
    changedAt: new Date(),
    reason: reason,
  });

  return this.save();
};

// Instance method to reverse transaction
transactionSchema.methods.reverse = async function (reason, reversedBy) {
  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed transactions can be reversed');
  }

  if (this.isReversed) {
    throw new Error('Transaction is already reversed');
  }

  // Create reversal transaction
  const reversalTransaction = new this.constructor({
    payer: this.payee,
    payee: this.payer,
    dormGroup: this.dormGroup,
    amount: this.amount,
    currency: this.currency,
    type: 'refund',
    paymentMethod: this.paymentMethod,
    description: `Reversal of transaction ${this._id}`,
    status: 'confirmed',
    originalTransaction: this._id,
    debts: this.debts,
  });

  await reversalTransaction.save();

  // Update this transaction
  this.isReversed = true;
  this.reversedAt = new Date();
  this.reversalReason = reason;
  this.reversalTransaction = reversalTransaction._id;
  this.status = 'reversed';

  // Reverse debt updates
  const Debt = mongoose.model('Debt');
  for (const debtItem of this.debts) {
    const debt = await Debt.findById(debtItem.debt);
    if (debt) {
      debt.remainingAmount += debtItem.amountApplied;
      if (debt.status === 'paid') {
        debt.status = debt.remainingAmount < debt.originalAmount ? 'partial' : 'pending';
        debt.paidAt = null;
      }
      await debt.save();
    }
  }

  await this.save();
  return reversalTransaction;
};

// Instance method to add attachment
transactionSchema.methods.addAttachment = function (filename, url, type = 'receipt') {
  this.attachments.push({
    filename: filename,
    url: url,
    type: type,
    uploadedAt: new Date(),
  });
  return this.save();
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
