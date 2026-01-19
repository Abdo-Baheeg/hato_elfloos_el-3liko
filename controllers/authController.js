const AuthService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  static register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);

    return ApiResponse.success(res, 201, 'User registered successfully', result);
  });

  /**
   * @route   POST /api/auth/login
   * @desc    Login user
   * @access  Public
   */
  static login = asyncHandler(async (req, res) => {
    const { credential, password } = req.body;
    const result = await AuthService.login(credential, password);

    return ApiResponse.success(res, 200, 'Login successful', result);
  });

  /**
   * @route   POST /api/auth/refresh-token
   * @desc    Refresh access token
   * @access  Public
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);

    return ApiResponse.success(res, 200, 'Token refreshed successfully', result);
  });

  /**
   * @route   GET /api/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  static getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user._id);

    return ApiResponse.success(res, 200, 'User profile retrieved successfully', { user });
  });

  /**
   * @route   PUT /api/auth/me
   * @desc    Update current user profile
   * @access  Private
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const user = await AuthService.updateProfile(req.user._id, req.body);

    return ApiResponse.success(res, 200, 'Profile updated successfully', { user });
  });

  /**
   * @route   PUT /api/auth/change-password
   * @desc    Change user password
   * @access  Private
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user._id, currentPassword, newPassword);

    return ApiResponse.success(res, 200, 'Password changed successfully');
  });

  /**
   * @route   POST /api/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  static logout = asyncHandler(async (req, res) => {
    await AuthService.logout();

    return ApiResponse.success(res, 200, 'Logged out successfully');
  });
}

module.exports = AuthController;
