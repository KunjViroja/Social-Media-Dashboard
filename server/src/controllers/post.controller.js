/**
 * controllers/post.controller.js — Post CRUD + Feed + Trending
 */

const Post = require('../models/Post.model');
const User = require('../models/User.model');
const Follow = require('../models/Follow.model');
const Bookmark = require('../models/Bookmark.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { createNotification } = require('../services/notification.service');
const { getPagination, buildPaginationMeta, extractHashtags, extractMentions } = require('../utils/helpers');
const { CLOUDINARY_FOLDERS, NOTIFICATION_TYPES, POST_VISIBILITY } = require('../config/constants');

// ─────────────────────────────────────────────
// @route   POST /api/posts
// @access  Private
// ─────────────────────────────────────────────
const createPost = asyncHandler(async (req, res) => {
  const { content, visibility } = req.body;

  if (!content && (!req.files || req.files.length === 0)) {
    throw ApiError.badRequest('Post must have content or media');
  }

  // Upload media files to Cloudinary
  const mediaItems = [];
  if (req.files?.length > 0) {
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const result = await uploadToCloudinary(
        file.buffer,
        CLOUDINARY_FOLDERS.POST,
        isVideo ? 'video' : 'image'
      );
      mediaItems.push({
        url: result.secure_url,
        publicId: result.public_id,
        type: isVideo ? 'video' : 'image',
        width: result.width,
        height: result.height,
        duration: result.duration || null,
      });
    }
  }

  // Extract hashtags and mentions
  const hashtags = content ? extractHashtags(content) : [];
  const mentionUsernames = content ? extractMentions(content) : [];

  // Resolve mention usernames to user IDs
  let mentionIds = [];
  if (mentionUsernames.length > 0) {
    const mentionedUsers = await User.find({ username: { $in: mentionUsernames } }).select('_id');
    mentionIds = mentionedUsers.map((u) => u._id);
  }

  const post = await Post.create({
    author: req.user._id,
    content: content || '',
    media: mediaItems,
    hashtags,
    mentions: mentionIds,
    visibility: visibility || POST_VISIBILITY.PUBLIC,
  });

  // Increment user post count
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

  // Notify mentioned users
  for (const mentionId of mentionIds) {
    await createNotification({
      recipient: mentionId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.MENTION,
      post: post._id,
      text: `${req.user.username} mentioned you in a post`,
    });
  }

  const populated = await post.populate('author', 'username fullName avatar');

  return new ApiResponse(201, { post: populated }, 'Post created').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/posts/feed
// @access  Private
// ─────────────────────────────────────────────
const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  // Get IDs of users followed by current user
  const following = await Follow.find({ follower: req.user._id }).select('following');
  const followingIds = following.map((f) => f.following);
  followingIds.push(req.user._id); // include own posts

  const posts = await Post.find({
    author: { $in: followingIds },
    visibility: { $in: [POST_VISIBILITY.PUBLIC, POST_VISIBILITY.FOLLOWERS] },
  })
    .populate('author', 'username fullName avatar isVerified')
    .populate('sharedFrom')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({ author: { $in: followingIds } });

  // Attach isLiked and isBookmarked flags for current user
  const bookmarks = await Bookmark.find({ user: req.user._id }).select('post');
  const bookmarkedIds = new Set(bookmarks.map((b) => b.post.toString()));

  const enrichedPosts = posts.map((post) => ({
    ...post.toObject(),
    isLiked: post.isLikedBy(req.user._id),
    isBookmarked: bookmarkedIds.has(post._id.toString()),
  }));

  return new ApiResponse(200, {
    posts: enrichedPosts,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/posts/trending
// @access  Public
// ─────────────────────────────────────────────
const getTrending = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  // Trending = most likes in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await Post.find({
    visibility: POST_VISIBILITY.PUBLIC,
    createdAt: { $gte: sevenDaysAgo },
  })
    .populate('author', 'username fullName avatar isVerified')
    .sort({ likesCount: -1, commentsCount: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({
    visibility: POST_VISIBILITY.PUBLIC,
    createdAt: { $gte: sevenDaysAgo },
  });

  return new ApiResponse(200, {
    posts,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/posts/:id
// @access  Public
// ─────────────────────────────────────────────
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username fullName avatar isVerified');

  if (!post) throw ApiError.notFound('Post not found');

  // Increment view count
  await Post.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

  const isLiked = req.user ? post.isLikedBy(req.user._id) : false;
  const isBookmarked = req.user
    ? !!(await Bookmark.findOne({ user: req.user._id, post: post._id }))
    : false;

  return new ApiResponse(200, { post: { ...post.toObject(), isLiked, isBookmarked } }).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/posts/:id
// @access  Private (owner only)
// ─────────────────────────────────────────────
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  if (post.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to edit this post');
  }

  const { content, visibility } = req.body;
  if (content !== undefined) {
    post.content = content;
    post.hashtags = extractHashtags(content);
  }
  if (visibility) post.visibility = visibility;

  await post.save();
  return new ApiResponse(200, { post }, 'Post updated').send(res);
});

// ─────────────────────────────────────────────
// @route   DELETE /api/posts/:id
// @access  Private (owner only)
// ─────────────────────────────────────────────
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to delete this post');
  }

  // Delete media from Cloudinary
  for (const media of post.media) {
    await deleteFromCloudinary(media.publicId, media.type);
  }

  // Soft delete
  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();

  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

  return new ApiResponse(200, null, 'Post deleted').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/posts/:id/like
// @access  Private
// ─────────────────────────────────────────────
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const userId = req.user._id;
  const isLiked = post.isLikedBy(userId);

  if (isLiked) {
    post.likes.pull(userId);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(userId);
    post.likesCount += 1;

    // Notify post author
    await createNotification({
      recipient: post.author,
      sender: userId,
      type: NOTIFICATION_TYPES.LIKE,
      post: post._id,
      text: `${req.user.username} liked your post`,
    });
  }

  await post.save();

  return new ApiResponse(200, {
    isLiked: !isLiked,
    likesCount: post.likesCount,
  }, isLiked ? 'Post unliked' : 'Post liked').send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/posts/:id/bookmark
// @access  Private
// ─────────────────────────────────────────────
const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const existing = await Bookmark.findOne({ user: req.user._id, post: post._id });

  if (existing) {
    await existing.deleteOne();
    await Post.findByIdAndUpdate(post._id, { $inc: { bookmarksCount: -1 } });
    return new ApiResponse(200, { isBookmarked: false }, 'Bookmark removed').send(res);
  }

  await Bookmark.create({ user: req.user._id, post: post._id });
  await Post.findByIdAndUpdate(post._id, { $inc: { bookmarksCount: 1 } });
  return new ApiResponse(200, { isBookmarked: true }, 'Post bookmarked').send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/posts/bookmarks
// @access  Private
// ─────────────────────────────────────────────
const getBookmarks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate({
      path: 'post',
      populate: { path: 'author', select: 'username fullName avatar' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Bookmark.countDocuments({ user: req.user._id });

  return new ApiResponse(200, {
    bookmarks: bookmarks.map((b) => b.post),
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

module.exports = {
  createPost,
  getFeed,
  getTrending,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  getBookmarks,
};
