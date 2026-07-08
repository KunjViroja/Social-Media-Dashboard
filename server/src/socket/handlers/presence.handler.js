/**
 * socket/handlers/presence.handler.js — Online Status & User Presence
 */

const { getRedisClient } = require('../../config/redis');
const { REDIS_KEYS } = require('../../config/constants');

const handlePresenceEvents = (io, socket) => {
  // ─── Get online users list ───────────────────
  socket.on('presence:get-online', async () => {
    try {
      const redis = getRedisClient();
      const onlineUsers = await redis.smembers(REDIS_KEYS.ONLINE_USERS);
      socket.emit('presence:online-users', { onlineUsers });
    } catch {
      socket.emit('presence:online-users', { onlineUsers: [] });
    }
  });

  // ─── Check if specific user is online ────────
  socket.on('presence:check', async ({ userId }) => {
    try {
      const redis = getRedisClient();
      const isOnline = await redis.sismember(REDIS_KEYS.ONLINE_USERS, userId);
      socket.emit('presence:status', { userId, isOnline: !!isOnline });
    } catch {
      socket.emit('presence:status', { userId, isOnline: false });
    }
  });

  // ─── Heartbeat (keep-alive) ──────────────────
  socket.on('presence:heartbeat', async () => {
    try {
      const redis = getRedisClient();
      await redis.set(
        `${REDIS_KEYS.USER_SOCKET}:${socket.user._id}`,
        socket.id,
        'EX',
        3600
      );
    } catch {}
  });
};

module.exports = { handlePresenceEvents };
