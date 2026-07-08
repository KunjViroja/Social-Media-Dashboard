/**
 * controllers/comment.controller.js — Nested Comment System
 */

const Comment = require('../models/Comment.model');
const Post = require('../models/Post.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notification.service');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { NOTIFICATION_TYPES } = require('../config/constants');

// ─────────────────────────────────────────────
// @route   POST /api/comments/:postId
// @access  Private
// ─────────────────────────────────────────────
const addComment = asyncHandler(async (req, res) => {
  const { content, parentId } = req.body;
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');

  let depth = 0;
  let parentComment = null;

  // Handle reply to comment
  if (parentId) {
    parentComment = await Comment.findById(parentId);
    if (!parentComment) throw ApiError.notFound('Parent comment not found');
    if (parentComment.depth >= 3) throw ApiError.badRequest('Maximum comment nesting depth reached');
    depth = parentComment.depth + 1;
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content,
    parent: parentId || null,
    depth,
  });

  // Update counts
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentId, { $inc: { repliesCount: 1 } });
  }

  await comment.populate('author', 'username fullName avatar');

  // Notify post author (comment) or parent comment author (reply)
  const notifyRecipient = parentId ? parentComment.author : post.author;
  const notifType = parentId ? NOTIFICATION_TYPES.REPLY : NOTIFICATION_TYPES.COMMENT;
  const notifText = parentId
    ? `${req.user.username} replied to your comment`
    : `${req.user.username} commented on your post`;

  await createNotification({
    recipient: notifyRecipient,
    sender: req.user._id,
    type: notifType,
    post: postId,
    comment: comment._id,
    text: notifText,
  });

  return new ApiResponse(201, { comment }, 'Comment added').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/comments/:postId
// @access  Public
// ─────────────────────────────────────────────
const getComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { postId } = req.params;

  // Get top-level comments first
  const comments = await Comment.find({ post: postId, parent: null })
    .populate('author', 'username fullName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // For each comment, fetch up to 3 replies
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.find({ parent: comment._id })
        .populate('author', 'username fullName avatar')
        .sort({ createdAt: 1 })
        .limit(3);
      return { ...comment.toObject(), replies };
    })
  );

  const total = await Comment.countDocuments({ post: postId, parent: null });

  return new ApiResponse(200, {
    comments: commentsWithReplies,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/comments/:commentId/replies
// @access  Public
// ─────────────────────────────────────────────
const getReplies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const replies = await Comment.find({ parent: req.params.commentId })
    .populate('author', 'username fullName avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Comment.countDocuments({ parent: req.params.commentId });

  return new ApiResponse(200, {
    replies,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/comments/:id
// @access  Private (owner)
// ─────────────────────────────────────────────
const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  comment.content = req.body.content;
  await comment.save();

  return new ApiResponse(200, { comment }, 'Comment updated').send(res);
});

// ─────────────────────────────────────────────
// @route   DELETE /api/comments/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized');
  }

  comment.isDeleted = true;
  comment.deletedAt = new Date();
  await comment.save();

  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

  return new ApiResponse(200, null, 'Comment deleted').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/comments/:id/like
// @access  Private
// ─────────────────────────────────────────────
const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');

  const userId = req.user._id;
  const isLiked = comment.likes.some((id) => id.toString() === userId.toString());

  if (isLiked) {
    comment.likes.pull(userId);
    comment.likesCount = Math.max(0, comment.likesCount - 1);
  } else {
    comment.likes.push(userId);
    comment.likesCount += 1;
  }

  await comment.save();
  return new ApiResponse(200, { isLiked: !isLiked, likesCount: comment.likesCount }).send(res);
});

module.exports = { addComment, getComments, getReplies, updateComment, deleteComment, toggleCommentLike };
