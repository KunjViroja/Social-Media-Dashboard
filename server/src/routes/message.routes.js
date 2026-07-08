const express = require('express');
const router = express.Router();
const { getConversations, getOrCreateConversation, getMessages, sendMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadMessageMedia } = require('../middleware/upload.middleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations/:id', protect, getMessages);
router.post('/conversations/:id', protect, uploadMessageMedia, sendMessage);

module.exports = router;
