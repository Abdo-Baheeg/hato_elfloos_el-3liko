const DebtResolutionService = require('../services/debtResolutionService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Debt Resolution Controller
 * Handles HTTP requests for debt resolution endpoints
 */

class DebtResolutionController {
  /**
   * @route   GET /api/dorms/:id/resolve
   * @desc    Get optimized debt resolution for group
   * @access  Private (members only)
   */
  static resolveGroupDebts = asyncHandler(async (req, res) => {
    const result = await DebtResolutionService.resolveGroupDebts(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, 'Debt resolution calculated successfully', result);
  });

  /**
   * @route   GET /api/debts/resolve/:user1Id/:user2Id
   * @desc    Calculate net debt between two users
   * @access  Private
   */
  static calculateDebtBetweenUsers = asyncHandler(async (req, res) => {
    const { user1Id, user2Id } = req.params;
    const result = await DebtResolutionService.calculateDebtBetweenUsers(user1Id, user2Id);

    return ApiResponse.success(res, 200, 'Net debt calculated successfully', result);
  });

  /**
   * @route   GET /api/dorms/:id/summary
   * @desc    Get debt summary for group
   * @access  Private (members only)
   */
  static getGroupSummary = asyncHandler(async (req, res) => {
    const summary = await DebtResolutionService.getGroupSummary(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, 'Group summary retrieved successfully', summary);
  });
}

module.exports = DebtResolutionController;
