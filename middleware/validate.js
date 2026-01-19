const Joi = require('joi');
const { ValidationError } = require('../utils/ApiError');

/**
 * Validation Middleware using Joi
 * Validates request body, params, or query against schema
 */

/**
 * Generic validation middleware
 * @param {Object} schema - Joi schema object
 * @param {String} source - Request property to validate (body, params, query)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new ValidationError('Validation failed', errors);
    }

    // Replace request source with validated value
    req[source] = value;
    next();
  };
};

// ==================== Auth Validation Schemas ====================

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
    'any.required': 'Username is required',
  }),
  fullName: Joi.string().max(100).required().messages({
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
});

const loginSchema = Joi.object({
  credential: Joi.string().required().messages({
    'any.required': 'Email or username is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

// ==================== Dorm Group Validation Schemas ====================

const createDormSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Group name must be at least 3 characters',
    'string.max': 'Group name cannot exceed 100 characters',
    'any.required': 'Group name is required',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
  settings: Joi.object({
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED').optional(),
    autoResolveDebts: Joi.boolean().optional(),
    requireApprovalForDebts: Joi.boolean().optional(),
    allowPartialPayments: Joi.boolean().optional(),
    reminderFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'never').optional(),
    debtDueDateDefault: Joi.number().min(1).optional(),
  }).optional(),
});

const joinDormSchema = Joi.object({
  inviteCode: Joi.string().length(8).required().messages({
    'string.length': 'Invite code must be 8 characters',
    'any.required': 'Invite code is required',
  }),
});

// ==================== Debt Validation Schemas ====================

const createDebtSchema = Joi.object({
  debtor: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid debtor ID',
    'string.length': 'Invalid debtor ID',
    'any.required': 'Debtor is required',
  }),
  dormGroup: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid dorm group ID',
    'string.length': 'Invalid dorm group ID',
    'any.required': 'Dorm group is required',
  }),
  originalAmount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  description: Joi.string().max(500).required().messages({
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required',
  }),
  category: Joi.string().valid(
    'food',
    'utilities',
    'rent',
    'groceries',
    'transportation',
    'entertainment',
    'supplies',
    'other'
  ).optional(),
  dueDate: Joi.date().iso().greater('now').optional().messages({
    'date.greater': 'Due date must be in the future',
  }),
});

const updateDebtSchema = Joi.object({
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid(
    'food',
    'utilities',
    'rent',
    'groceries',
    'transportation',
    'entertainment',
    'supplies',
    'other'
  ).optional(),
  dueDate: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'partial', 'paid', 'cancelled', 'disputed').optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const settleDebtSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Payment amount must be greater than 0',
  }),
  paymentMethod: Joi.string().valid(
    'cash',
    'bank_transfer',
    'mobile_payment',
    'credit_card',
    'debit_card',
    'paypal',
    'venmo',
    'other'
  ).optional(),
  notes: Joi.string().max(1000).optional(),
});

// ==================== Pagination/Query Schemas ====================

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  status: Joi.string().optional(),
  category: Joi.string().optional(),
});

const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid ID format',
    'string.length': 'Invalid ID format',
    'any.required': 'ID is required',
  }),
});

module.exports = {
  validate,
  // Schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createDormSchema,
  joinDormSchema,
  createDebtSchema,
  updateDebtSchema,
  settleDebtSchema,
  paginationSchema,
  objectIdSchema,
};
