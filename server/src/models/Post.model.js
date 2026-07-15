/**
 * models/Post.model.js — Post Schema
 * Supports text, image, video posts with hashtags, mentions, visibility
 */

const mongoose = require('mongoose');
const { POST_VISIBILITY, MEDIA_TYPES } = require('../config/constants');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, enum: Object.values(MEDIA_TYPES), required: true },
  width: Number,
  height: Number,
  duration: Number, // for videos (seconds)
}, { _id: false });

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxlength: [2200, 'Post content cannot exceed 2200 characters'],
      default: '',
    },
    media: [mediaSchema],

    // ── Engagement ────────────────────────────────
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },

    // ── Tags & Discovery ─────────────────────────
    hashtags: [{ type: String, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Visibility ────────────────────────────────
    visibility: {
      type: String,
      enum: Object.values(POST_VISIBILITY),
      default: POST_VISIBILITY.PUBLIC,
    },

    // ── Shared Post Reference ────────────────────
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    // ── Moderation ────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ likesCount: -1, createdAt: -1 }); // Trending
postSchema.index({ isDeleted: 1, visibility: 1 });
postSchema.index({ content: 'text', hashtags: 'text' }); // Full-text search

// ─────────────────────────────────────────────
// Query Middleware — Exclude soft-deleted posts
// ─────────────────────────────────────────────
postSchema.pre(/^find/, function (next) {
  // Only apply filter if not explicitly overridden
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ─────────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────────

/** Check if a user has liked this post */
postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((id) => id.toString() === userId.toString());
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
