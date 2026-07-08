const express = require('express');
const router = express.Router();
const { getAllUsers, toggleBlockUser, updateUserRole, deleteUser, getAllPosts, hardDeletePost, flagPost } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/posts', getAllPosts);
router.delete('/posts/:id', hardDeletePost);
router.put('/posts/:id/flag', flagPost);

module.exports = router;
