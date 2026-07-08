/**
 * controllers/notification.controller.js — Notification Controller
 */

const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { markAllAsRead, getUnreadCount } = require('../services/notification.service');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

// ─────────────────────────────────────────────
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'username fullName avatar')
    .populate('post', 'content media')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient: req.user._id });
  const unreadCount = await getUnreadCount(req.user._id);

  return new ApiResponse(200, {
    notifications,
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  }).send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) throw ApiError.notFound('Notification not found');

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return new ApiResponse(200, null, 'Notification marked as read').send(res);
});

// ─────────────────────────────────────────────
// @route   PUT /api/notifications/read-all
// @access  Private
// ─────────────────────────────────────────────
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await markAllAsRead(req.user._id);
  return new ApiResponse(200, null, 'All notifications marked as read').send(res);
});

// ─────────────────────────────────────────────
// @route   DELETE /api/notifications/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  return new ApiResponse(200, null, 'Notification deleted').send(res);
});

module.exports = { getNotifications, markAsRead, markAllNotificationsAsRead, deleteNotification };
