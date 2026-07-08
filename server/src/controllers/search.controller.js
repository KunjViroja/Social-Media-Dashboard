/**
 * controllers/search.controller.js — Search Users, Posts, Hashtags
 */

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

// ─────────────────────────────────────────────
// @route   GET /api/search/users?q=query
// @access  Public
// ─────────────────────────────────────────────
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  if (!q || q.trim().length < 2) {
    return new ApiResponse(200, { users: [], pagination: null }).send(res);
  }

  // Use text index for full-text search, fall back to regex
  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
    ],
    isBlocked: false,
  })
    .select('username fullName avatar bio followersCount isVerified')
    .sort({ followersCount: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
    ],
    isBlocked: false,
  });

  return new ApiResponse(200, {
    users,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/search/posts?q=query
// @access  Public
// ─────────────────────────────────────────────
const searchPosts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  if (!q || q.trim().length < 2) {
    return new ApiResponse(200, { posts: [], pagination: null }).send(res);
  }

  const posts = await Post.find({
    $or: [
      { content: { $regex: q, $options: 'i' } },
      { hashtags: { $regex: q.replace('#', ''), $options: 'i' } },
    ],
    visibility: 'public',
  })
    .populate('author', 'username fullName avatar')
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({
    content: { $regex: q, $options: 'i' },
    visibility: 'public',
  });

  return new ApiResponse(200, {
    posts,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/search/hashtags?q=tag
// @access  Public
// ─────────────────────────────────────────────
const searchByHashtag = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const tag = q?.replace('#', '').toLowerCase();
  if (!tag) return new ApiResponse(200, { posts: [] }).send(res);

  const posts = await Post.find({ hashtags: tag, visibility: 'public' })
    .populate('author', 'username fullName avatar')
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({ hashtags: tag });

  return new ApiResponse(200, {
    posts,
    hashtag: `#${tag}`,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/search/trending-hashtags
// @access  Public
// ─────────────────────────────────────────────
const getTrendingHashtags = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const trending = await Post.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, visibility: 'public' } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { hashtag: '$_id', count: 1, _id: 0 } },
  ]);

  return new ApiResponse(200, { trending }).send(res);
});

module.exports = { searchUsers, searchPosts, searchByHashtag, getTrendingHashtags };
