const express = require('express');
const router = express.Router();
const DebtController = require('../controllers/debtController');
const DebtResolutionController = require('../controllers/debtResolutionController');
const { protect } = require('../middleware/auth');
const { isOwner } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { debtCreationLimiter, apiLimiter } = require('../middleware/rateLimiter');
const {
  createDebtSchema,
  updateDebtSchema,
  settleDebtSchema,
  addNoteSchema
} = require('../middleware/validate');

/**
 * Debt Routes
 * All debt management endpoints
 */

// All routes require authentication
router.use(protect);

// Get all debts (with pagination and filters)
router.get('/', apiLimiter, DebtController.getDebts);

// Get debt statistics
router.get('/statistics', apiLimiter, DebtController.getStatistics);

// Calculate net debt between two users
router.get(
  '/resolve/:user1Id/:user2Id',
  apiLimiter,
  DebtResolutionController.calculateDebtBetweenUsers
);

// Create new debt
router.post(
  '/',
  debtCreationLimiter,
  validate(createDebtSchema),
  DebtController.createDebt
);

// Get specific debt
router.get('/:id', apiLimiter, DebtController.getDebtById);

// Update debt (creditor only)
router.patch(
  '/:id',
  apiLimiter,
  isOwner('creditor'),
  validate(updateDebtSchema),
  DebtController.updateDebt
);

// Settle debt (create payment transaction)
router.post(
  '/:id/settle',
  apiLimiter,
  validate(settleDebtSchema),
  DebtController.settleDebt
);

// Add note to debt
router.post(
  '/:id/notes',
  apiLimiter,
  validate(addNoteSchema),
  DebtController.addNote
);

// Delete debt (soft delete)
router.delete(
  '/:id',
  apiLimiter,
  isOwner('creditor'),
  DebtController.deleteDebt
);

module.exports = router;
