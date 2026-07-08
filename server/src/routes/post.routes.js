const express = require('express');
const router = express.Router();
const { createPost, getFeed, getTrending, getPost, updatePost, deletePost, toggleLike, toggleBookmark, getBookmarks } = require('../controllers/post.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadPostMedia } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');

router.get('/feed', protect, getFeed);
router.get('/trending', optionalAuth, getTrending);
router.get('/bookmarks', protect, getBookmarks);
router.post('/', protect, uploadLimiter, uploadPostMedia, createPost);
router.get('/:id', optionalAuth, getPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
