const mongoose = require('mongoose');

/**
 * Debt Schema
 * Represents a single debt between two users
 * 
 * Design Decisions:
 * - creditor (to) and debtor (from) are ObjectId references for data integrity
 * - dormGroup reference for group-level debt queries and filtering
 * - status field tracks debt lifecycle (pending, partial, paid, cancelled)
 * - originalAmount preserved for history, while remainingAmount tracks current balance
 * - category field for expense categorization and reporting
 * - attachments array for receipts/proof of purchase
 * - isDeleted for soft delete (maintain history)
 * - Compound indexes on creditor+status and debtor+status for fast queries
 */
const debtSchema = new mongoose.Schema(
  {
    // Core Debt Information
    creditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creditor (who is owed) is required'],
      index: true,
    },
    debtor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Debtor (who owes) is required'],
      index: true,
    },
    dormGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DormGroup',
      required: [true, 'Dorm group is required'],
      index: true,
    },

    // Amount Information
    originalAmount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: [0, 'Remaining amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      enum: ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'], // Add currencies as needed
    },

    // Debt Details
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: [
        'food',
        'utilities',
        'rent',
        'groceries',
        'transportation',
        'entertainment',
        'supplies',
        'other',
      ],
      default: 'other',
    },

    // Status and Lifecycle
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'cancelled', 'disputed'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // Attachments and Proof
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Related Transactions
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],

    // Notes and Communication
    notes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dispute Information
    dispute: {
      isDisputed: {
        type: Boolean,
        default: false,
      },
      reason: String,
      disputedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      disputedAt: Date,
      resolvedAt: Date,
      resolution: String,
    },

    // Metadata
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

    // Reminder Settings
    reminderSent: {
      type: Boolean,
      default: false,
    },
    lastReminderDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
debtSchema.index({ creditor: 1, status: 1, isDeleted: 1 });
debtSchema.index({ debtor: 1, status: 1, isDeleted: 1 });
debtSchema.index({ dormGroup: 1, status: 1, isDeleted: 1 });
debtSchema.index({ status: 1, dueDate: 1 }); // For overdue debt queries
debtSchema.index({ createdAt: -1 }); // For recent debts

// Virtual for checking if debt is overdue
debtSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  return this.dueDate < new Date();
});

// Virtual for payment progress percentage
debtSchema.virtual('paymentProgress').get(function () {
  if (this.originalAmount === 0) return 0;
  return ((this.originalAmount - this.remainingAmount) / this.originalAmount) * 100;
});

// Validation: creditor and debtor cannot be the same
debtSchema.pre('validate', function (next) {
  if (this.creditor && this.debtor && this.creditor.equals(this.debtor)) {
    next(new Error('Creditor and debtor cannot be the same person'));
  } else {
    next();
  }
});

// Pre-save middleware to set remainingAmount on creation
debtSchema.pre('save', function (next) {
  if (this.isNew && !this.remainingAmount) {
    this.remainingAmount = this.originalAmount;
  }
  next();
});

// Pre-save middleware to update status based on remaining amount
debtSchema.pre('save', function (next) {
  if (this.remainingAmount === 0 && this.status !== 'paid' && this.status !== 'cancelled') {
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (
    this.remainingAmount > 0 &&
    this.remainingAmount < this.originalAmount &&
    this.status === 'pending'
  ) {
    this.status = 'partial';
  }
  next();
});

// Static method to find active debts
debtSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

// Static method to find overdue debts
debtSchema.statics.findOverdue = function () {
  return this.find({
    isDeleted: false,
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: new Date() },
  });
};

// Static method to calculate total debt between two users
debtSchema.statics.calculateDebtBetweenUsers = async function (user1Id, user2Id) {
  const user1OwesUser2 = await this.aggregate([
    {
      $match: {
        creditor: mongoose.Types.ObjectId(user2Id),
        debtor: mongoose.Types.ObjectId(user1Id),
        status: { $in: ['pending', 'partial'] },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$remainingAmount' },
      },
    },
  ]);

  const user2OwesUser1 = await this.aggregate([
    {
      $match: {
        creditor: mongoose.Types.ObjectId(user1Id),
        debtor: mongoose.Types.ObjectId(user2Id),
        status: { $in: ['pending', 'partial'] },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$remainingAmount' },
      },
    },
  ]);

  const debt1 = user1OwesUser2[0]?.total || 0;
  const debt2 = user2OwesUser1[0]?.total || 0;

  return {
    netDebt: debt1 - debt2,
    user1Owes: debt1,
    user2Owes: debt2,
  };
};

// Instance method to add a note
debtSchema.methods.addNote = function (userId, content) {
  this.notes.push({
    user: userId,
    content: content,
    createdAt: new Date(),
  });
  return this.save();
};

// Instance method to mark as paid
debtSchema.methods.markAsPaid = function () {
  this.status = 'paid';
  this.remainingAmount = 0;
  this.paidAt = new Date();
  return this.save();
};

// Instance method to make a partial payment
debtSchema.methods.makePayment = function (amount) {
  if (amount > this.remainingAmount) {
    throw new Error('Payment amount exceeds remaining debt');
  }
  this.remainingAmount -= amount;
  if (this.remainingAmount === 0) {
    this.status = 'paid';
    this.paidAt = new Date();
  } else {
    this.status = 'partial';
  }
  return this.save();
};

const Debt = mongoose.model('Debt', debtSchema);

module.exports = Debt;
