const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} = require('../utils/ApiError');

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} { user, tokens }
   */
  static async register(userData) {
    const { email, username, password, fullName, phoneNumber } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username already taken');
      }
    }

    // Create user (password will be hashed automatically by pre-save middleware)
    const user = await User.create({
      email,
      username,
      password,
      fullName,
      phoneNumber,
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens,
    };
  }

  /**
   * Login user
   * @param {String} credential - Email or username
   * @param {String} password - User password
   * @returns {Object} { user, tokens }
   */
  static async login(credential, password) {
    // Find user by email or username (password field is explicitly selected)
    const user = await User.findByCredential(credential);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedError(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later'
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens,
    };
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} { accessToken }
   */
  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedError('User no longer exists');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account has been deactivated');
      }

      // Generate new access token
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      const { generateAccessToken } = require('../utils/jwt');
      const accessToken = generateAccessToken(payload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Get current user profile
   * @param {String} userId - User ID
   * @returns {Object} user
   */
  static async getMe(userId) {
    const user = await User.findById(userId).populate('dormGroup', 'name inviteCode');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} updated user
   */
  static async updateProfile(userId, updateData) {
    const allowedUpdates = ['fullName', 'phoneNumber', 'profilePicture', 'notificationSettings'];
    const updates = {};

    // Filter allowed updates
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Logout (client-side token deletion)
   * Note: In a real-world app, you might want to implement token blacklisting
   */
  static async logout() {
    // In JWT-based auth, logout is typically handled client-side by deleting tokens
    // For additional security, you could implement token blacklisting here
    return { message: 'Logged out successfully' };
  }
}

module.exports = AuthService;
