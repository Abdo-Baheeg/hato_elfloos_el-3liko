const DebtService = require('../services/debtService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Debt Controller
 * Handles HTTP requests for debt endpoints
 */

class DebtController {
  /**
   * @route   POST /api/debts
   * @desc    Create a new debt
   * @access  Private
   */
  static createDebt = asyncHandler(async (req, res) => {
    const debt = await DebtService.createDebt(req.user._id, req.body);

    return ApiResponse.success(res, 201, 'Debt created successfully', { debt });
  });

  /**
   * @route   GET /api/debts
   * @desc    Get debts for current user
   * @access  Private
   */
  static getDebts = asyncHandler(async (req, res) => {
    const result = await DebtService.getDebts(req.user._id, req.query);

    return ApiResponse.paginated(
      res,
      200,
      'Debts retrieved successfully',
      result.debts,
      result.pagination
    );
  });

  /**
   * @route   GET /api/debts/:id
   * @desc    Get single debt by ID
   * @access  Private
   */
  static getDebtById = asyncHandler(async (req, res) => {
    const debt = await DebtService.getDebtById(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, 'Debt retrieved successfully', { debt });
  });

  /**
   * @route   PUT /api/debts/:id
   * @desc    Update debt
   * @access  Private (creditor only)
   */
  static updateDebt = asyncHandler(async (req, res) => {
    const debt = await DebtService.updateDebt(req.params.id, req.user._id, req.body);

    return ApiResponse.success(res, 200, 'Debt updated successfully', { debt });
  });

  /**
   * @route   PATCH /api/debts/:id/settle
   * @desc    Settle (pay) a debt
   * @access  Private (debtor only)
   */
  static settleDebt = asyncHandler(async (req, res) => {
    const result = await DebtService.settleDebt(req.params.id, req.user._id, req.body);

    return ApiResponse.success(res, 200, result.message, {
      debt: result.debt,
      transaction: result.transaction,
    });
  });

  /**
   * @route   POST /api/debts/:id/notes
   * @desc    Add note to debt
   * @access  Private (creditor or debtor)
   */
  static addNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const debt = await DebtService.addNote(req.params.id, req.user._id, content);

    return ApiResponse.success(res, 200, 'Note added successfully', { debt });
  });

  /**
   * @route   DELETE /api/debts/:id
   * @desc    Delete (soft delete) a debt
   * @access  Private (creditor only)
   */
  static deleteDebt = asyncHandler(async (req, res) => {
    const result = await DebtService.deleteDebt(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, result.message);
  });

  /**
   * @route   GET /api/debts/statistics/me
   * @desc    Get debt statistics for current user
   * @access  Private
   */
  static getStatistics = asyncHandler(async (req, res) => {
    const statistics = await DebtService.getDebtStatistics(req.user._id);

    return ApiResponse.success(res, 200, 'Statistics retrieved successfully', { statistics });
  });
}

module.exports = DebtController;
