/**
 * models/Comment.model.js — Comment Schema
 * Supports nested comments (replies) via parent reference
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },

    // ── Nesting ───────────────────────────────────
    // null = top-level comment; ObjectId = reply to comment
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
      max: 3, // Limit nesting to 3 levels deep
    },
    repliesCount: { type: Number, default: 0, min: 0 },

    // ── Engagement ────────────────────────────────
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0, min: 0 },

    // ── Mentions ─────────────────────────────────
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Moderation ────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
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
commentSchema.index({ post: 1, parent: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isDeleted: 1 });

// ─────────────────────────────────────────────
// Query Middleware — Exclude soft-deleted
// ─────────────────────────────────────────────
commentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
