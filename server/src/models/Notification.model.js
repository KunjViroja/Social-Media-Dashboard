/**
 * models/Notification.model.js — Notification Schema
 * Stores persistent notifications in MongoDB
 * Unread counts are also cached in Redis for speed
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },

    // ── Context references (optional) ────────────
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // ── Status ────────────────────────────────────
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    // ── Display text ─────────────────────────────
    text: { type: String, maxlength: 200 }, // e.g., "liked your post"
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL: 30 days

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
