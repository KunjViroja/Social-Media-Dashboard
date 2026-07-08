/**
 * utils/helpers.js — Shared Utility Functions
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token
 * Used for email verification and password reset
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a plain token for secure storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Parse pagination parameters from query string
 * @returns {{ page, limit, skip }}
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata for API responses
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

/**
 * Sanitize a username: lowercase, alphanumeric + underscores only
 */
const sanitizeUsername = (username) => {
  return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

/**
 * Extract hashtags from post content
 * @param {string} content
 * @returns {string[]}
 */
const extractHashtags = (content) => {
  const regex = /#[a-zA-Z0-9_]+/g;
  const matches = content.match(regex) || [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
};

/**
 * Extract @mentions from post content
 * @param {string} content
 * @returns {string[]}
 */
const extractMentions = (content) => {
  const regex = /@[a-zA-Z0-9_]+/g;
  const matches = content.match(regex) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

module.exports = {
  generateSecureToken,
  hashToken,
  getPagination,
  buildPaginationMeta,
  sanitizeUsername,
  extractHashtags,
  extractMentions,
};
