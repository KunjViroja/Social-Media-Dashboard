const express = require('express');
const router = express.Router();
const { searchUsers, searchPosts, searchByHashtag, getTrendingHashtags } = require('../controllers/search.controller');

router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/hashtag', searchByHashtag);
router.get('/trending-hashtags', getTrendingHashtags);

module.exports = router;
