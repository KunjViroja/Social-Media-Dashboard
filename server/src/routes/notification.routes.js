const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllNotificationsAsRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllNotificationsAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
