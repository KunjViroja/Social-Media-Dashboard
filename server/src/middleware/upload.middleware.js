/**
 * middleware/upload.middleware.js — Multer File Upload Configuration
 * Uses memory storage (buffer) so files go directly to Cloudinary
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { UPLOAD_LIMITS } = require('../config/constants');

// Use memory storage — files are held in buffer, uploaded to Cloudinary
const storage = multer.memoryStorage();

/**
 * File filter — validates file type
 */
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

/**
 * Avatar upload (single image, 5MB max)
 */
const uploadAvatar = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_SIZE },
  fileFilter: fileFilter(UPLOAD_LIMITS.ALLOWED_IMAGES),
}).single('avatar');

/**
 * Cover image upload (single image, 5MB max)
 */
const uploadCover = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_SIZE },
  fileFilter: fileFilter(UPLOAD_LIMITS.ALLOWED_IMAGES),
}).single('cover');

/**
 * Post media upload (up to 4 images OR 1 video)
 */
const uploadPostMedia = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.VIDEO_SIZE },
  fileFilter: fileFilter([
    ...UPLOAD_LIMITS.ALLOWED_IMAGES,
    ...UPLOAD_LIMITS.ALLOWED_VIDEOS,
  ]),
}).array('media', 4);

/**
 * Message attachment upload (single file)
 */
const uploadMessageMedia = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_SIZE },
  fileFilter: fileFilter([
    ...UPLOAD_LIMITS.ALLOWED_IMAGES,
    ...UPLOAD_LIMITS.ALLOWED_VIDEOS,
  ]),
}).single('attachment');

/**
 * Multer error handler wrapper
 * Wraps multer middleware to return proper ApiError on multer failures
 */
const handleMulterError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('File too large. Maximum size exceeded.'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(ApiError.badRequest('Too many files. Maximum 4 files allowed.'));
    }
    if (err instanceof multer.MulterError) {
      return next(ApiError.badRequest(`Upload error: ${err.message}`));
    }
    next(err);
  });
};

module.exports = {
  uploadAvatar: handleMulterError(uploadAvatar),
  uploadCover: handleMulterError(uploadCover),
  uploadPostMedia: handleMulterError(uploadPostMedia),
  uploadMessageMedia: handleMulterError(uploadMessageMedia),
};
