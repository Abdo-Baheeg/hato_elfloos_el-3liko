const mongoose = require('mongoose');

/**
 * DormGroup Schema
 * Represents a dorm or shared living group
 * 
 * Design Decisions:
 * - members array with roles for flexible permission management
 * - settings object for group-level configurations
 * - inviteCode for easy group joining
 * - statistics embedded for quick dashboard access
 * - Soft delete support with isActive flag
 * - Index on inviteCode for fast join operations
 */
const dormGroupSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [3, 'Group name must be at least 3 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },

    // Members Management
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        // Track when member left (for history)
        leftAt: {
          type: Date,
          default: null,
        },
      },
    ],

    // Group Settings
    settings: {
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        enum: ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'],
      },
      autoResolveDebts: {
        type: Boolean,
        default: false, // Whether to automatically simplify debts
      },
      requireApprovalForDebts: {
        type: Boolean,
        default: false, // Whether debts need creditor approval
      },
      allowPartialPayments: {
        type: Boolean,
        default: true,
      },
      reminderFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'never'],
        default: 'weekly',
      },
      debtDueDateDefault: {
        type: Number, // Days from creation
        default: 30,
        min: 1,
      },
    },

    // Invite System
    inviteCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
      index: true,
    },
    inviteExpiry: {
      type: Date,
      default: null, // null means never expires
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 2,
      max: 100,
    },

    // Statistics (denormalized for performance)
    statistics: {
      totalDebts: {
        type: Number,
        default: 0,
      },
      totalTransactions: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      settledAmount: {
        type: Number,
        default: 0,
      },
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
dormGroupSchema.index({ createdBy: 1, isActive: 1 });
dormGroupSchema.index({ 'members.user': 1, isActive: 1 });
dormGroupSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

// Virtual for active members count
dormGroupSchema.virtual('activeMembersCount').get(function () {
  return this.members.filter((m) => m.isActive).length;
});

// Virtual for admin count
dormGroupSchema.virtual('adminCount').get(function () {
  return this.members.filter((m) => m.role === 'admin' && m.isActive).length;
});

// Pre-save middleware to generate invite code
dormGroupSchema.pre('save', function (next) {
  if (this.isNew && !this.inviteCode) {
    // Generate a random 8-character invite code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.inviteCode = code;
  }
  next();
});

// Pre-save middleware to ensure at least one admin
dormGroupSchema.pre('save', function (next) {
  const activeAdmins = this.members.filter((m) => m.role === 'admin' && m.isActive);
  if (activeAdmins.length === 0 && this.members.length > 0) {
    next(new Error('Group must have at least one active admin'));
  } else {
    next();
  }
});

// Static method to find active groups
dormGroupSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Static method to find groups by user
dormGroupSchema.statics.findByUser = function (userId) {
  return this.find({
    'members.user': userId,
    'members.isActive': true,
    isActive: true,
  }).populate('members.user', 'username fullName email profilePicture');
};

// Instance method to add member
dormGroupSchema.methods.addMember = async function (userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(
    (m) => m.user.equals(userId) && m.isActive
  );

  if (existingMember) {
    throw new Error('User is already a member of this group');
  }

  // Check max members limit
  const activeMembers = this.members.filter((m) => m.isActive);
  if (activeMembers.length >= this.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }

  // Add new member
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    isActive: true,
  });

  // Update user's dormGroup field
  await mongoose.model('User').findByIdAndUpdate(userId, {
    dormGroup: this._id,
  });

  return this.save();
};

// Instance method to remove member
dormGroupSchema.methods.removeMember = async function (userId) {
  const member = this.members.find((m) => m.user.equals(userId) && m.isActive);

  if (!member) {
    throw new Error('User is not an active member of this group');
  }

  // Don't allow removing the last admin
  if (member.role === 'admin' && this.adminCount === 1) {
    throw new Error('Cannot remove the last admin from the group');
  }

  member.isActive = false;
  member.leftAt = new Date();

  // Update user's dormGroup field to null
  await mongoose.model('User').findByIdAndUpdate(userId, {
    dormGroup: null,
  });

  return this.save();
};

// Instance method to update member role
dormGroupSchema.methods.updateMemberRole = function (userId, newRole) {
  const member = this.members.find((m) => m.user.equals(userId) && m.isActive);

  if (!member) {
    throw new Error('User is not an active member of this group');
  }

  // Don't allow demoting the last admin
  if (member.role === 'admin' && newRole !== 'admin' && this.adminCount === 1) {
    throw new Error('Cannot demote the last admin of the group');
  }

  member.role = newRole;
  return this.save();
};

// Instance method to check if user is admin
dormGroupSchema.methods.isUserAdmin = function (userId) {
  const member = this.members.find((m) => m.user.equals(userId) && m.isActive);
  return member && member.role === 'admin';
};

// Instance method to check if user is member
dormGroupSchema.methods.isUserMember = function (userId) {
  const member = this.members.find((m) => m.user.equals(userId) && m.isActive);
  return !!member;
};

// Instance method to update statistics
dormGroupSchema.methods.updateStatistics = async function () {
  const Debt = mongoose.model('Debt');
  const Transaction = mongoose.model('Transaction');

  // Get all debts for this group
  const debts = await Debt.find({ dormGroup: this._id, isDeleted: false });
  const transactions = await Transaction.find({ dormGroup: this._id });

  this.statistics.totalDebts = debts.length;
  this.statistics.totalTransactions = transactions.length;
  this.statistics.totalAmount = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  this.statistics.settledAmount = debts
    .filter((d) => d.status === 'paid')
    .reduce((sum, debt) => sum + debt.originalAmount, 0);
  this.statistics.lastActivityAt = new Date();

  return this.save();
};

// Instance method to regenerate invite code
dormGroupSchema.methods.regenerateInviteCode = function (expiryDays = null) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  this.inviteCode = code;

  if (expiryDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    this.inviteExpiry = expiry;
  } else {
    this.inviteExpiry = null;
  }

  return this.save();
};

// Instance method to check if invite is valid
dormGroupSchema.methods.isInviteValid = function () {
  if (!this.inviteCode) return false;
  if (this.inviteExpiry && this.inviteExpiry < new Date()) return false;
  if (!this.isActive) return false;
  return true;
};

const DormGroup = mongoose.model('DormGroup', dormGroupSchema);

module.exports = DormGroup;
