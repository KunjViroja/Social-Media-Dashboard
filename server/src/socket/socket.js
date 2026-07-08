/**
 * socket/socket.js — Socket.IO Server Setup
 * Central Socket.IO initialization with authentication, rooms, and event routing
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { getRedisClient } = require('../config/redis');
const { REDIS_KEYS } = require('../config/constants');
const { handleChatEvents } = require('./handlers/chat.handler');
const { handlePresenceEvents } = require('./handlers/presence.handler');
const { handleNotificationEvents } = require('./handlers/notification.handler');

let io;

/**
 * Initialize Socket.IO on the HTTP server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware ───────────────────────────
  io.use(async (socket, next) => {
    try {
      // Token from handshake auth or cookie header
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('_id username fullName avatar');

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ────────────────────────
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // Store socket ID in Redis for targeted delivery
    try {
      const redis = getRedisClient();
      await redis.set(`${REDIS_KEYS.USER_SOCKET}:${userId}`, socket.id, 'EX', 3600);
      await redis.sadd(REDIS_KEYS.ONLINE_USERS, userId);
    } catch {}

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status to followers (rooms)
    socket.broadcast.emit('user:online', { userId, username: socket.user.username });

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    // ── Register Event Handlers ────────────────
    handleChatEvents(io, socket);
    handlePresenceEvents(io, socket);
    handleNotificationEvents(io, socket);

    // ── Disconnect Handler ─────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username}`);

      try {
        const redis = getRedisClient();
        await redis.del(`${REDIS_KEYS.USER_SOCKET}:${userId}`);
        await redis.srem(REDIS_KEYS.ONLINE_USERS, userId);
      } catch {}

      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

/**
 * Get the Socket.IO instance (for use in controllers)
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

/**
 * Emit event to a specific user by their user ID
 * Uses Redis to find their socket ID if they're connected
 */
const emitToUser = async (userId, event, data) => {
  try {
    const redis = getRedisClient();
    const socketId = await redis.get(`${REDIS_KEYS.USER_SOCKET}:${userId}`);
    if (socketId && io) {
      io.to(socketId).emit(event, data);
    }
  } catch {
    // Fallback: emit to the personal room
    if (io) io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToUser };
