/**
 * socket/handlers/notification.handler.js — Live Notification Push
 * Provides helper to push real-time notifications to connected clients
 */

/**
 * Push a live notification to a connected user
 * Called by controllers after creating a notification in DB
 * @param {string} recipientId
 * @param {Object} notification - The notification document
 */
const pushNotification = async (recipientId, notification) => {
  // Lazy require to avoid circular dependency (socket.js → this → socket.js)
  const { emitToUser } = require('../socket');
  await emitToUser(recipientId, 'notification:new', { notification });
};

const handleNotificationEvents = (io, socket) => {
  // Client can request notification badge count
  socket.on('notification:get-count', async () => {
    const { getUnreadCount } = require('../../services/notification.service');
    try {
      const count = await getUnreadCount(socket.user._id);
      socket.emit('notification:count', { count });
    } catch {
      socket.emit('notification:count', { count: 0 });
    }
  });
};

module.exports = { handleNotificationEvents, pushNotification };
