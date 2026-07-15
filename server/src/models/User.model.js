/**
 * models/User.model.js — User Schema
 * Core user document with profile, auth, and social data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },

    // ── Profile ─────────────────────────────────
    fullName: {
      type: String,
      trim: true,
      maxlength: [60, 'Full name cannot exceed 60 characters'],
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: '',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    location: { type: String, maxlength: 100, default: '' },
    website: { type: String, maxlength: 100, default: '' },
    skills: [{ type: String, maxlength: 30 }],

    // ── Social Counts (denormalized for performance) ──
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postsCount: { type: Number, default: 0, min: 0 },

    // ── Auth & Security ──────────────────────────
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastPasswordChange: { type: Date, default: Date.now },

    // ── Refresh Token (stored hashed) ────────────
    refreshToken: { type: String, select: false },

    // ── Activity ─────────────────────────────────
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────
// username and email indexes are created automatically by unique:true on the field
// email index is created automatically by unique:true
userSchema.index({ createdAt: -1 });
userSchema.index({ isBlocked: 1, isVerified: 1 });
// Full-text search index
userSchema.index({ username: 'text', fullName: 'text', bio: 'text' });

// ─────────────────────────────────────────────
// Pre-save Hook — Hash password before saving
// ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.lastPasswordChange = Date.now();
  next();
});

// ─────────────────────────────────────────────
// Instance Methods
// ─────────────────────────────────────────────

/** Compare plain password with hashed */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Return safe user object (no sensitive fields) */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
