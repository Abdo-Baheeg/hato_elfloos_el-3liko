const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/ApiError');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new UnauthorizedError('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from token (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new ForbiddenError('Your account is temporarily locked. Please try again later');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      throw new UnauthorizedError('Token is invalid or has expired');
    }
    throw error;
  }
});

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
