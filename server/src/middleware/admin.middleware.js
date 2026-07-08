/**
 * middleware/admin.middleware.js — Role-Based Access Control
 */

const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

/**
 * Restrict route to admin role only
 * Must be used AFTER protect middleware
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated.');
  }
  if (req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Access denied. Admin only.');
  }
  next();
};

/**
 * Restrict route to admin or moderator roles
 */
const moderatorOrAdmin = (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated.');
  }
  if (![ROLES.ADMIN, ROLES.MODERATOR].includes(req.user.role)) {
    throw ApiError.forbidden('Access denied. Insufficient permissions.');
  }
  next();
};

/**
 * Restrict to resource owner or admin
 * Requires req.resourceOwnerId to be set by the controller
 */
const ownerOrAdmin = (req, res, next) => {
  const isOwner = req.resourceOwnerId?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied. Not authorized to perform this action.');
  }
  next();
};

module.exports = { adminOnly, moderatorOrAdmin, ownerOrAdmin };
