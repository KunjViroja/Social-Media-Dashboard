/**
 * server.js — Application Entry Point
 * Initializes HTTP server, Socket.IO, and starts listening
 */

const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket/socket');
const connectDB = require('./src/config/db');
const connectRedis = require('./src/config/redis');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server (shared between Express and Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO on the same server
initSocket(server);

// Boot sequence
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Start listening
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode`);
      console.log(`📡 HTTP: http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO ready`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

startServer();
