const express = require('express');
const router = express.Router();
const { addComment, getComments, getReplies, updateComment, deleteComment, toggleCommentLike } = require('../controllers/comment.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

router.post('/:postId', protect, addComment);
router.get('/:postId', optionalAuth, getComments);
router.get('/:commentId/replies', getReplies);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleCommentLike);

module.exports = router;
