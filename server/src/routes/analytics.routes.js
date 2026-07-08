const express = require('express');
const router = express.Router();
const { getOverview, getUserAnalytics, getPostAnalytics, getEngagement } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

router.get('/overview', protect, adminOnly, getOverview);
router.get('/users', protect, adminOnly, getUserAnalytics);
router.get('/posts', protect, adminOnly, getPostAnalytics);
router.get('/engagement', protect, adminOnly, getEngagement);

module.exports = router;
