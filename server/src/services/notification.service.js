/**
 * services/notification.service.js — Notification Business Logic
 * Creates notifications in DB and caches unread count in Redis
 */

const Notification = require('../models/Notification.model');
const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS, REDIS_TTL, NOTIFICATION_TYPES } = require('../config/constants');

/**
 * Create a notification in MongoDB and increment unread count in Redis
 * @param {Object} options
 */
const createNotification = async ({ recipient, sender, type, post, comment, message, text }) => {
  // Don't notify yourself
  if (recipient.toString() === sender.toString()) return null;

  // Create in DB
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post: post || null,
    comment: comment || null,
    message: message || null,
    text,
  });

  // Increment unread count in Redis
  try {
    const redis = getRedisClient();
    const key = `${REDIS_KEYS.NOTIFICATION}:${recipient}:unread`;
    await redis.incr(key);
    await redis.expire(key, REDIS_TTL.NOTIFICATION);
  } catch {
    // Redis unavailable — degrade gracefully
  }

  return notification;
};

/**
 * Get unread notification count from Redis (fast)
 * Falls back to MongoDB count if Redis is unavailable
 */
const getUnreadCount = async (userId) => {
  try {
    const redis = getRedisClient();
    const key = `${REDIS_KEYS.NOTIFICATION}:${userId}:unread`;
    const count = await redis.get(key);
    if (count !== null) return parseInt(count);
  } catch {
    // Redis miss — fall through to DB
  }

  // Fallback: count from MongoDB
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark notifications as read and reset Redis counter
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Reset Redis unread counter
  try {
    const redis = getRedisClient();
    await redis.del(`${REDIS_KEYS.NOTIFICATION}:${userId}:unread`);
  } catch {}
};

module.exports = { createNotification, getUnreadCount, markAllAsRead };
