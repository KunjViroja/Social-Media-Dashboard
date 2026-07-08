/**
 * controllers/auth.controller.js — Authentication Controller
 * Handles register, login, logout, token refresh, email verify, password reset
 */

const crypto = require('crypto');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } = require('../utils/generateToken');
const { generateSecureToken, hashToken } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS, REDIS_TTL } = require('../config/constants');

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  // Check if user exists
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw existing.email === email
      ? ApiError.conflict('Email already registered')
      : ApiError.conflict('Username already taken');
  }

  // Generate email verification token
  const verifyToken = generateSecureToken();
  const hashedToken = hashToken(verifyToken);

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    emailVerifyToken: hashedToken,
    emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  // Send verification email
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  try {
    await sendVerificationEmail(email, username, verifyUrl);
  } catch (err) {
    console.error('Email send failed:', err.message);
    // Don't fail registration if email fails
  }

  return new ApiResponse(201, { userId: user._id }, 'Registration successful! Please check your email to verify your account.').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user with password field
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been suspended. Contact support.');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store hashed refresh token in DB
  user.refreshToken = hashToken(refreshToken);
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Update last seen
  return new ApiResponse(200, {
    user: user.toSafeObject(),
    accessToken, // also return in body for mobile clients
  }, 'Login successful').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  clearTokenCookies(res);
  return new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/refresh-token
// @access  Public (uses refresh token cookie)
// ─────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) throw ApiError.unauthorized('No refresh token');

  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Issue new tokens (token rotation)
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  return new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ─────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired verification link');

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, null, 'Email verified successfully!').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always respond 200 to prevent email enumeration
  if (!user) {
    return new ApiResponse(200, null, 'If an account exists with that email, a reset link has been sent.').send(res);
  }

  const resetToken = generateSecureToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendPasswordResetEmail(user.email, user.username, resetUrl);

  return new ApiResponse(200, null, 'If an account exists with that email, a reset link has been sent.').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired reset link');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  clearTokenCookies(res);
  return new ApiResponse(200, null, 'Password reset successfully. Please log in.').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, { user: req.user }, 'User fetched').send(res);
});

module.exports = { register, login, logout, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe };
