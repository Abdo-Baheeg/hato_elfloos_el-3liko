const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../middleware/validate');

/**
 * Auth Routes
 * All authentication and user management endpoints
 */

// Public routes
console.log('🔓 Auth routes loaded - register is PUBLIC');
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', AuthController.getMe);

router.patch(
  '/profile',
  validate(updateProfileSchema),
  AuthController.updateProfile
);

router.patch(
  '/password',
  validate(changePasswordSchema),
  AuthController.changePassword
);

router.post('/logout', AuthController.logout);

module.exports = router;
