/**
 * controllers/message.controller.js — Real-Time Messaging REST Layer
 */

const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../config/cloudinary');
const { createNotification } = require('../services/notification.service');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { NOTIFICATION_TYPES, CLOUDINARY_FOLDERS } = require('../config/constants');

// ─────────────────────────────────────────────
// @route   GET /api/messages/conversations
// @access  Private
// ─────────────────────────────────────────────
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'username fullName avatar isOnline lastSeen')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
    .sort({ lastMessageAt: -1 });

  // Attach unread count for current user
  const enriched = conversations.map((conv) => ({
    ...conv.toObject(),
    unreadCount: conv.unreadCounts?.get(req.user._id.toString()) || 0,
  }));

  return new ApiResponse(200, { conversations: enriched }).send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/messages/conversations
// @access  Private — Start or get existing conversation
// ─────────────────────────────────────────────
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  if (!recipientId) throw ApiError.badRequest('recipientId is required');

  const recipient = await User.findById(recipientId);
  if (!recipient) throw ApiError.notFound('User not found');

  // Find existing 1:1 conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    isGroup: false,
  }).populate('participants', 'username fullName avatar isOnline');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, recipientId],
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar isOnline');
  }

  return new ApiResponse(200, { conversation }).send(res);
});

// ─────────────────────────────────────────────
// @route   GET /api/messages/conversations/:id
// @access  Private
// ─────────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { id: conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');

  // Ensure user is participant
  if (!conversation.participants.includes(req.user._id)) {
    throw ApiError.forbidden('Not part of this conversation');
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'username fullName avatar')
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit);

  const total = await Message.countDocuments({ conversation: conversationId });

  // Reset unread count for current user
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCounts.${req.user._id}`]: 0 },
  });

  return new ApiResponse(200, {
    messages: messages.reverse(), // chronological order
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   POST /api/messages/conversations/:id
// @access  Private
// ─────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { content } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!conversation.participants.includes(req.user._id)) {
    throw ApiError.forbidden('Not part of this conversation');
  }

  if (!content && !req.file) throw ApiError.badRequest('Message content or attachment required');

  // Handle file attachment
  let attachment = {};
  if (req.file) {
    const isVideo = req.file.mimetype.startsWith('video/');
    const result = await uploadToCloudinary(
      req.file.buffer,
      CLOUDINARY_FOLDERS.MESSAGE,
      isVideo ? 'video' : 'image'
    );
    attachment = {
      url: result.secure_url,
      publicId: result.public_id,
      type: isVideo ? 'video' : 'image',
      name: req.file.originalname,
    };
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    content: content || '',
    attachment,
  });

  // Update conversation's lastMessage
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageAt: new Date(),
    // Increment unread for all OTHER participants
    ...conversation.participants
      .filter((p) => p.toString() !== req.user._id.toString())
      .reduce((acc, p) => {
        acc[`unreadCounts.${p}`] = (conversation.unreadCounts?.get(p.toString()) || 0) + 1;
        return acc;
      }, {}),
  });

  await message.populate('sender', 'username fullName avatar');

  // Notify other participants
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: participantId,
        sender: req.user._id,
        type: NOTIFICATION_TYPES.MESSAGE,
        message: message._id,
        text: `${req.user.username} sent you a message`,
      });
    }
  }

  return new ApiResponse(201, { message }, 'Message sent').send(res);
});

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage };
