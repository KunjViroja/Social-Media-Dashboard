const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, emailLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
