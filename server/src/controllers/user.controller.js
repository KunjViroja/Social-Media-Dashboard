/**
 * controllers/user.controller.js — User Profile Controller
 */

const User = require('../models/User.model');
const Follow = require('../models/Follow.model');
const Post = require('../models/Post.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { createNotification } = require('../services/notification.service');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { CLOUDINARY_FOLDERS, NOTIFICATION_TYPES } = require('../config/constants');

// ─────────────────────────────────────────────
// @route   GET /api/users/:username
// @access  Public
// ─────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) throw ApiError.notFound('User not found');

  // Check if current user follows this profile
  let isFollowing = false;
  if (req.user) {
    const follow = await Follow.findOne({ follower: req.user._id, following: user._id });
    isFollowing = !!follow;
  }

  return new ApiResponse(200, { user: user.toSafeObject(), isFollowing }).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/users/me
// @access  Private
// ─────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['fullName', 'bio', 'location', 'website', 'skills'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return new ApiResponse(200, { user: user.toSafeObject() }, 'Profile updated').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/users/me/avatar
// @access  Private
// ─────────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided');

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  // Upload new avatar
  const result = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDERS.AVATAR);

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, { avatar: user.avatar }, 'Avatar updated').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/users/me/cover
// @access  Private
// ─────────────────────────────────────────────
const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided');

  const user = await User.findById(req.user._id);

  if (user.coverImage?.publicId) {
    await deleteFromCloudinary(user.coverImage.publicId);
  }

  const result = await uploadToCloudinary(req.file.buffer, CLOUDINARY_FOLDERS.COVER);
  user.coverImage = { url: result.secure_url, publicId: result.public_id };
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, { coverImage: user.coverImage }, 'Cover image updated').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/users/:id/follow
// @access  Private
// ─────────────────────────────────────────────
const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot follow yourself');
  }

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
  if (existing) throw ApiError.conflict('Already following this user');

  await Follow.create({ follower: req.user._id, following: targetId });

  // Update counts atomically
  await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });

  // Create follow notification
  await createNotification({
    recipient: targetId,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.FOLLOW,
    text: `${req.user.username} started following you`,
  });

  return new ApiResponse(200, null, 'User followed').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/users/:id/unfollow
// @access  Private
// ─────────────────────────────────────────────
const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  const follow = await Follow.findOneAndDelete({ follower: req.user._id, following: targetId });
  if (!follow) throw ApiError.notFound('You are not following this user');

  await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
  await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });

  return new ApiResponse(200, null, 'User unfollowed').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/users/:id/followers
// @access  Public
// ─────────────────────────────────────────────
const getFollowers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const follows = await Follow.find({ following: req.params.id })
    .populate('follower', 'username fullName avatar bio followersCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Follow.countDocuments({ following: req.params.id });

  return new ApiResponse(200, {
    followers: follows.map((f) => f.follower),
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/users/:id/following
// @access  Public
// ─────────────────────────────────────────────
const getFollowing = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const follows = await Follow.find({ follower: req.params.id })
    .populate('following', 'username fullName avatar bio followersCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Follow.countDocuments({ follower: req.params.id });

  return new ApiResponse(200, {
    following: follows.map((f) => f.following),
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/users/suggestions
// @access  Private
// ─────────────────────────────────────────────
const getSuggestedUsers = asyncHandler(async (req, res) => {
  // Get list of users already followed
  const following = await Follow.find({ follower: req.user._id }).select('following');
  const followingIds = following.map((f) => f.following);
  followingIds.push(req.user._id); // exclude self

  // Find users not yet followed, sorted by follower count
  const suggestions = await User.find({
    _id: { $nin: followingIds },
    isBlocked: false,
    isVerified: true,
  })
    .select('username fullName avatar bio followersCount')
    .sort({ followersCount: -1 })
    .limit(10);

  return new ApiResponse(200, { suggestions }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/users/:username/posts
// @access  Public
// ─────────────────────────────────────────────
const getUserPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const user = await User.findOne({ username: req.params.username });
  if (!user) throw ApiError.notFound('User not found');

  const posts = await Post.find({ author: user._id })
    .populate('author', 'username fullName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({ author: user._id });

  return new ApiResponse(200, {
    posts,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

module.exports = {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadCover,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
  getUserPosts,
};
