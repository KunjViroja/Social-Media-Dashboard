const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, uploadAvatar, uploadCover, followUser, unfollowUser, getFollowers, getFollowing, getSuggestedUsers, getUserPosts } = require('../controllers/user.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadAvatar: multerAvatar, uploadCover: multerCover } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');

router.get('/suggestions', protect, getSuggestedUsers);
router.get('/me', protect, (req, res) => res.json({ success: true, data: { user: req.user } }));
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, uploadLimiter, multerAvatar, uploadAvatar);
router.post('/me/cover', protect, uploadLimiter, multerCover, uploadCover);
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
