/**
 * controllers/admin.controller.js — Admin Panel Controller
 */

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

// ─────────────────────────────────────────────
// @route   GET /api/admin/users
// @access  Admin
// ─────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, status } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status === 'blocked') filter.isBlocked = true;
  if (status === 'verified') filter.isVerified = true;

  const users = await User.find(filter)
    .select('username email fullName avatar role isVerified isBlocked postsCount followersCount createdAt lastSeen')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  return new ApiResponse(200, {
    users,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/block
// @access  Admin
// ─────────────────────────────────────────────
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot block admin users');

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, {
    isBlocked: user.isBlocked,
  }, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/role
// @access  Admin
// ─────────────────────────────────────────────
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'moderator', 'admin'].includes(role)) {
    throw ApiError.badRequest('Invalid role');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('username email role');

  if (!user) throw ApiError.notFound('User not found');

  return new ApiResponse(200, { user }, 'User role updated').send(res);
});

// ─────────────────────────────────────────────
// @route   DELETE /api/admin/users/:id
// @access  Admin
// ─────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot delete admin users');

  // Soft-block instead of hard delete to preserve data integrity
  user.isBlocked = true;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, null, 'User account deactivated').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/admin/posts
// @access  Admin
// ─────────────────────────────────────────────
const getAllPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { flagged } = req.query;

  const filter = {};
  if (flagged === 'true') filter.isFlagged = true;

  const posts = await Post.find(filter).setOptions({ includeDeleted: true })
    .populate('author', 'username email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(filter).setOptions({ includeDeleted: true });

  return new ApiResponse(200, {
    posts,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   DELETE /api/admin/posts/:id
// @access  Admin
// ─────────────────────────────────────────────
const hardDeletePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!post) throw ApiError.notFound('Post not found');

  return new ApiResponse(200, null, 'Post removed').send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/admin/posts/:id/flag
// @access  Admin
// ─────────────────────────────────────────────
const flagPost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { isFlagged: true, flagReason: req.body.reason || 'Violates community guidelines' },
    { new: true }
  );
  if (!post) throw ApiError.notFound('Post not found');

  return new ApiResponse(200, { post }, 'Post flagged for review').send(res);
});

module.exports = { getAllUsers, toggleBlockUser, updateUserRole, deleteUser, getAllPosts, hardDeletePost, flagPost };
