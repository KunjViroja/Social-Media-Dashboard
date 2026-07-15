/**
 * middleware/rateLimit.middleware.js — API Rate Limiting
 * Uses express-rate-limit to prevent abuse and brute-force attacks
 */

const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const isDev = process.env.NODE_ENV === 'development';

/**
 * General rate limiter — applies to all /api routes
 * 100 requests per 15 minutes per IP (scaled to 5000 in development)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many requests. Please try again later.'));
  },
});

/**
 * Strict limiter for auth routes (login/register)
 * 5 requests per 15 minutes per IP (scaled to 200 in development)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many login attempts. Please try again in 15 minutes.'));
  },
});

/**
 * Email limiter — for forgot password / resend verification
 * 3 requests per hour per IP (scaled to 100 in development)
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 100 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many email requests. Please try again in an hour.'));
  },
});

/**
 * Upload limiter — for file upload endpoints
 * 20 uploads per hour per IP (scaled to 500 in development)
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Upload limit exceeded. Please try again later.'));
  },
});

module.exports = { generalLimiter, authLimiter, emailLimiter, uploadLimiter };
