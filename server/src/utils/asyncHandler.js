/**
 * utils/asyncHandler.js — Async Route Handler Wrapper
 * Eliminates try/catch boilerplate in every controller
 */

/**
 * Wraps an async Express route handler and forwards errors to next()
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
