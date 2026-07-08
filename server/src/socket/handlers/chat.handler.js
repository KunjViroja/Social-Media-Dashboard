/**
 * socket/handlers/chat.handler.js — Real-Time Chat Events
 * Handles message send, typing indicator, and read receipts via Socket.IO
 */

const Message = require('../../models/Message.model');
const Conversation = require('../../models/Conversation.model');

const handleChatEvents = (io, socket) => {
  const userId = socket.user._id.toString();

  // ─── Join conversation room ──────────────────
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`${socket.user.username} joined conversation ${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // ─── Typing Indicator ────────────────────────
  socket.on('chat:typing', ({ conversationId, isTyping }) => {
    // Broadcast to all OTHER users in conversation
    socket.to(`conversation:${conversationId}`).emit('chat:typing', {
      userId,
      username: socket.user.username,
      conversationId,
      isTyping,
    });
  });

  // ─── New Message (real-time delivery) ───────
  // Note: Message is saved via REST API (/api/messages/conversations/:id)
  // This event is emitted from the controller after DB save
  // Here we handle client-side real-time delivery confirmation
  socket.on('chat:message:send', async ({ conversationId, messageId }) => {
    try {
      const message = await Message.findById(messageId)
        .populate('sender', 'username fullName avatar');

      if (!message) return;

      // Deliver to all participants in conversation
      io.to(`conversation:${conversationId}`).emit('chat:message:new', {
        message,
        conversationId,
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to deliver message' });
    }
  });

  // ─── Read Receipt ────────────────────────────
  socket.on('chat:message:read', async ({ messageId, conversationId }) => {
    try {
      await Message.findByIdAndUpdate(
        messageId,
        {
          $addToSet: {
            seenBy: { user: socket.user._id, seenAt: new Date() },
          },
        }
      );

      // Notify sender about read receipt
      socket.to(`conversation:${conversationId}`).emit('chat:message:seen', {
        messageId,
        seenBy: userId,
        seenAt: new Date(),
      });
    } catch (err) {
      console.error('Read receipt error:', err.message);
    }
  });

  // ─── Mark all messages in conversation as read ─
  socket.on('chat:conversation:read', async ({ conversationId }) => {
    try {
      // Reset unread count for this user
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCounts.${userId}`]: 0 },
      });

      socket.to(`conversation:${conversationId}`).emit('chat:conversation:read', {
        conversationId,
        readBy: userId,
      });
    } catch (err) {
      console.error('Conversation read error:', err.message);
    }
  });
};

module.exports = { handleChatEvents };
