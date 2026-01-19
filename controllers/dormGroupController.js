const DormGroupService = require('../services/dormGroupService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Dorm Group Controller
 * Handles HTTP requests for dorm group endpoints
 */

class DormGroupController {
  /**
   * @route   POST /api/dorms
   * @desc    Create a new dorm group
   * @access  Private
   */
  static createGroup = asyncHandler(async (req, res) => {
    const group = await DormGroupService.createGroup(req.user._id, req.body);

    return ApiResponse.success(res, 201, 'Dorm group created successfully', { group });
  });

  /**
   * @route   POST /api/dorms/join
   * @desc    Join a dorm group using invite code
   * @access  Private
   */
  static joinGroup = asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;
    const group = await DormGroupService.joinGroup(req.user._id, inviteCode);

    return ApiResponse.success(res, 200, 'Joined group successfully', { group });
  });

  /**
   * @route   GET /api/dorms/:id
   * @desc    Get dorm group details
   * @access  Private (members only)
   */
  static getGroupDetails = asyncHandler(async (req, res) => {
    const group = await DormGroupService.getGroupDetails(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, 'Group details retrieved successfully', { group });
  });

  /**
   * @route   GET /api/dorms
   * @desc    Get all groups for current user
   * @access  Private
   */
  static getUserGroups = asyncHandler(async (req, res) => {
    const groups = await DormGroupService.getUserGroups(req.user._id);

    return ApiResponse.success(res, 200, 'Groups retrieved successfully', { groups });
  });

  /**
   * @route   PUT /api/dorms/:id
   * @desc    Update dorm group
   * @access  Private (admin only)
   */
  static updateGroup = asyncHandler(async (req, res) => {
    const group = await DormGroupService.updateGroup(req.params.id, req.user._id, req.body);

    return ApiResponse.success(res, 200, 'Group updated successfully', { group });
  });

  /**
   * @route   DELETE /api/dorms/:id/members/:memberId
   * @desc    Remove member from group
   * @access  Private (admin only)
   */
  static removeMember = asyncHandler(async (req, res) => {
    const result = await DormGroupService.removeMember(
      req.params.id,
      req.user._id,
      req.params.memberId
    );

    return ApiResponse.success(res, 200, result.message);
  });

  /**
   * @route   POST /api/dorms/:id/leave
   * @desc    Leave group (self-removal)
   * @access  Private (members only)
   */
  static leaveGroup = asyncHandler(async (req, res) => {
    const result = await DormGroupService.leaveGroup(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, result.message);
  });

  /**
   * @route   DELETE /api/dorms/:id
   * @desc    Delete (archive) dorm group
   * @access  Private (admin only)
   */
  static deleteGroup = asyncHandler(async (req, res) => {
    const result = await DormGroupService.deleteGroup(req.params.id, req.user._id);

    return ApiResponse.success(res, 200, result.message);
  });

  /**
   * @route   POST /api/dorms/:id/regenerate-invite
   * @desc    Regenerate invite code
   * @access  Private (admin only)
   */
  static regenerateInviteCode = asyncHandler(async (req, res) => {
    const { expiryDays } = req.body;
    const result = await DormGroupService.regenerateInviteCode(
      req.params.id,
      req.user._id,
      expiryDays
    );

    return ApiResponse.success(res, 200, 'Invite code regenerated successfully', result);
  });

  /**
   * @route   PATCH /api/dorms/:id/members/:memberId/role
   * @desc    Update member role
   * @access  Private (admin only)
   */
  static updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const result = await DormGroupService.updateMemberRole(
      req.params.id,
      req.user._id,
      req.params.memberId,
      role
    );

    return ApiResponse.success(res, 200, result.message);
  });
}

module.exports = DormGroupController;
