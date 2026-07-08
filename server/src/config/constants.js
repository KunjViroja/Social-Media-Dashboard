/**
 * config/constants.js — App-Wide Constants
 */

module.exports = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,

  // JWT
  ACCESS_TOKEN_COOKIE: 'access_token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',

  // Redis key prefixes
  REDIS_KEYS: {
    NOTIFICATION: 'notif',       // notif:<userId>
    ONLINE_USERS: 'online_users', // Set of online userIds
    USER_SOCKET: 'user_socket',   // user_socket:<userId> -> socketId
    RATE_LIMIT: 'rl',            // Rate limit keys
    EMAIL_VERIFY: 'email_verify', // email_verify:<token>
    RESET_PASSWORD: 'reset_pass', // reset_pass:<token>
    REFRESH_TOKEN: 'refresh',    // refresh:<userId>
  },

  // Redis TTLs (in seconds)
  REDIS_TTL: {
    NOTIFICATION: 60 * 60 * 24 * 7,   // 7 days
    EMAIL_VERIFY: 60 * 60 * 24,        // 24 hours
    RESET_PASSWORD: 60 * 60,           // 1 hour
    REFRESH_TOKEN: 60 * 60 * 24 * 7,   // 7 days
  },

  // User roles
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // Notification types
  NOTIFICATION_TYPES: {
    LIKE: 'like',
    COMMENT: 'comment',
    REPLY: 'reply',
    FOLLOW: 'follow',
    MESSAGE: 'message',
    MENTION: 'mention',
    SHARE: 'share',
  },

  // Post visibility
  POST_VISIBILITY: {
    PUBLIC: 'public',
    FOLLOWERS: 'followers',
    PRIVATE: 'private',
  },

  // Media types
  MEDIA_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
  },

  // Cloudinary folders
  CLOUDINARY_FOLDERS: {
    AVATAR: 'avatars',
    COVER: 'covers',
    POST: 'posts',
    MESSAGE: 'messages',
  },

  // Upload limits
  UPLOAD_LIMITS: {
    IMAGE_SIZE: 5 * 1024 * 1024,   // 5MB
    VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
};
