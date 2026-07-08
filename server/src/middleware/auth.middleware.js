/**
 * middleware/auth.middleware.js — JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User.model');

/**
 * Protect route — verifies JWT access token from cookie or Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Try cookie first (preferred — more secure)
  if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Fallback to Authorization header (for mobile/API clients)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Access denied. No token provided.');
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  // Fetch user (exclude password)
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw ApiError.unauthorized('User no longer exists.');
  }

  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been suspended.');
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Optional auth — attaches user if token exists, but doesn't fail if not
 * Useful for public routes that show extra data to logged-in users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.access_token || 
    (req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Silently ignore invalid token for optional auth
    }
  }
  next();
});

module.exports = { protect, optionalAuth };
