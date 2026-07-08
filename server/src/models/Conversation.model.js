/**
 * models/Conversation.model.js — Chat Conversation Schema
 * Represents a 1:1 or group conversation thread
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: { type: Date, default: Date.now },

    // ── Unread counts per participant ─────────────
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    // ── Group conversation support (future) ───────
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, maxlength: 50 },
    groupAvatar: { type: String, default: '' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
