const { ForbiddenError } = require('../utils/ApiError');
const DormGroup = require('../models/DormGroup');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Check if user has specific role
 * @param  {...String} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ForbiddenError('User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};

/**
 * Check if user is member of specific dorm group
 * Requires dormId in params or body
 */
const isDormMember = asyncHandler(async (req, res, next) => {
  const dormId = req.params.dormId || req.params.id || req.body.dormGroup;

  if (!dormId) {
    throw new ForbiddenError('Dorm group ID is required');
  }

  const dormGroup = await DormGroup.findById(dormId);

  if (!dormGroup) {
    throw new ForbiddenError('Dorm group not found');
  }

  const isMember = dormGroup.isUserMember(req.user._id);

  if (!isMember) {
    throw new ForbiddenError('You are not a member of this dorm group');
  }

  // Attach dorm group to request for use in controller
  req.dormGroup = dormGroup;
  next();
});

/**
 * Check if user is admin of specific dorm group
 * Requires dormId in params or body
 */
const isDormAdmin = asyncHandler(async (req, res, next) => {
  const dormId = req.params.dormId || req.params.id || req.body.dormGroup;

  if (!dormId) {
    throw new ForbiddenError('Dorm group ID is required');
  }

  const dormGroup = await DormGroup.findById(dormId);

  if (!dormGroup) {
    throw new ForbiddenError('Dorm group not found');
  }

  const isAdmin = dormGroup.isUserAdmin(req.user._id);

  if (!isAdmin) {
    throw new ForbiddenError('You must be an admin of this dorm group');
  }

  // Attach dorm group to request for use in controller
  req.dormGroup = dormGroup;
  next();
});

/**
 * Check if user owns the resource
 * Compares req.user._id with resource.user or resource.createdBy
 */
const isOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.resource) {
      throw new ForbiddenError('Resource not found');
    }

    const resourceOwnerId = req.resource[resourceField]?._id || req.resource[resourceField];

    if (!resourceOwnerId || !resourceOwnerId.equals(req.user._id)) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    next();
  };
};

module.exports = {
  authorize,
  isDormMember,
  isDormAdmin,
  isOwner,
};
