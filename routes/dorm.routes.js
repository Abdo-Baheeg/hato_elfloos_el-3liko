const express = require('express');
const router = express.Router();
const DormGroupController = require('../controllers/dormGroupController');
const DebtResolutionController = require('../controllers/debtResolutionController');
const { protect } = require('../middleware/auth');
const { isDormMember, isDormAdmin } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  createGroupSchema,
  joinGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema
} = require('../middleware/validate');

/**
 * Dorm Group Routes
 * All dorm group management endpoints
 */

// All routes require authentication
router.use(protect);
router.use(apiLimiter);

// Create new group
router.post(
  '/',
  validate(createGroupSchema),
  DormGroupController.createGroup
);

// Join existing group
router.post(
  '/join',
  validate(joinGroupSchema),
  DormGroupController.joinGroup
);

// Get user's groups
router.get('/my-groups', DormGroupController.getUserGroups);

// Group-specific routes (require membership)
router.get(
  '/:id',
  isDormMember,
  DormGroupController.getGroupDetails
);

router.patch(
  '/:id',
  isDormAdmin,
  validate(updateGroupSchema),
  DormGroupController.updateGroup
);

router.delete(
  '/:id',
  isDormAdmin,
  DormGroupController.deleteGroup
);

// Member management
router.delete(
  '/:id/members/:userId',
  isDormAdmin,
  DormGroupController.removeMember
);

router.post(
  '/:id/leave',
  isDormMember,
  DormGroupController.leaveGroup
);

router.patch(
  '/:id/members/:userId/role',
  isDormAdmin,
  validate(updateMemberRoleSchema),
  DormGroupController.updateMemberRole
);

// Invite code management
router.post(
  '/:id/regenerate-code',
  isDormAdmin,
  DormGroupController.regenerateInviteCode
);

// Debt resolution endpoints
router.get(
  '/:id/resolve',
  isDormMember,
  DebtResolutionController.resolveGroupDebts
);

router.get(
  '/:id/summary',
  isDormMember,
  DebtResolutionController.getGroupSummary
);

module.exports = router;
