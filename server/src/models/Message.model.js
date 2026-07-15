/**
 * models/Message.model.js — Direct Message Schema
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },

    // ── Attachment ───────────────────────────────
    attachment: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', 'file', ''], default: '' },
      name: { type: String, default: '' },
    },

    // ── Read receipts ────────────────────────────
    seenBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    isDelivered: { type: Boolean, default: false },

    // ── Soft delete ───────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

// ─────────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────────

/** Check if a user has seen this message */
messageSchema.methods.isSeenBy = function (userId) {
  return this.seenBy.some((s) => s.user.toString() === userId.toString());
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
