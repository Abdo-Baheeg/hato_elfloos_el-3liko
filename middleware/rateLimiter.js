const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and abuse
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    return ApiResponse.error(res, 429, 'Too many requests, please try again later');
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter (stricter)
 * 5 login attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      429,
      'Too many authentication attempts from this IP, please try again after 15 minutes'
    );
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create debt rate limiter
 * 20 debt creations per hour
 */
const debtCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many debts created, please try again later',
  handler: (req, res) => {
    return ApiResponse.error(res, 429, 'You have reached the debt creation limit for this hour');
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  debtCreationLimiter,
};
