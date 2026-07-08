/**
 * controllers/analytics.controller.js — Dashboard Analytics
 * Aggregates platform-wide statistics for the analytics dashboard
 */

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');
const Message = require('../models/Message.model');
const Follow = require('../models/Follow.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// ─────────────────────────────────────────────
// @route   GET /api/analytics/overview
// @access  Private (admin)
// ─────────────────────────────────────────────
const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalPosts, totalComments] = await Promise.all([
    User.countDocuments({ isBlocked: false }),
    Post.countDocuments(),
    Comment.countDocuments(),
  ]);

  // Daily active users (logged in last 24h)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dau = await User.countDocuments({ lastSeen: { $gte: dayAgo } });

  // Total likes across all posts
  const likesAgg = await Post.aggregate([
    { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
  ]);
  const totalLikes = likesAgg[0]?.totalLikes || 0;

  // Total messages
  const totalMessages = await Message.countDocuments();

  return new ApiResponse(200, {
    totalUsers,
    dau,
    totalPosts,
    totalLikes,
    totalComments,
    totalMessages,
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/analytics/users
// @access  Private (admin)
// ─────────────────────────────────────────────
const getUserAnalytics = asyncHandler(async (req, res) => {
  // New users per day for the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const dailySignups = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  // Most active users (by post count)
  const mostActive = await User.find()
    .select('username fullName avatar postsCount followersCount')
    .sort({ postsCount: -1 })
    .limit(10);

  // Follower growth — top users by followers gained in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const followerGrowth = await Follow.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$following', newFollowers: { $sum: 1 } } },
    { $sort: { newFollowers: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $project: { username: '$user.username', avatar: '$user.avatar', newFollowers: 1 } },
  ]);

  return new ApiResponse(200, { dailySignups, mostActive, followerGrowth }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/analytics/posts
// @access  Private (admin)
// ─────────────────────────────────────────────
const getPostAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Posts per day
  const dailyPosts = await Post.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        posts: { $sum: 1 },
        likes: { $sum: '$likesCount' },
        comments: { $sum: '$commentsCount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', posts: 1, likes: 1, comments: 1, _id: 0 } },
  ]);

  // Top posts by engagement
  const topPosts = await Post.find({ visibility: 'public' })
    .populate('author', 'username fullName avatar')
    .sort({ likesCount: -1, commentsCount: -1 })
    .limit(10)
    .select('content media likesCount commentsCount viewsCount createdAt author');

  return new ApiResponse(200, { dailyPosts, topPosts }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/analytics/engagement
// @access  Private (admin)
// ─────────────────────────────────────────────
const getEngagement = asyncHandler(async (req, res) => {
  // Weekly engagement (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weekly = await Post.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        posts: { $sum: 1 },
        likes: { $sum: '$likesCount' },
        comments: { $sum: '$commentsCount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = weekly.map((d) => ({
    day: dayNames[d._id - 1],
    posts: d.posts,
    likes: d.likes,
    comments: d.comments,
  }));

  // Monthly engagement (12 months)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const monthly = await Post.aggregate([
    { $match: { createdAt: { $gte: oneYearAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        posts: { $sum: 1 },
        likes: { $sum: '$likesCount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { month: '$_id', posts: 1, likes: 1, _id: 0 } },
  ]);

  return new ApiResponse(200, { weekly: weeklyData, monthly }).send(res);
});

module.exports = { getOverview, getUserAnalytics, getPostAnalytics, getEngagement };
