/**
 * services/email.service.js — Email Service using Resend
 * Centralizes all transactional email sending
 */

const { Resend } = require('resend');

// Lazy init — dotenv is loaded by the time any email is actually sent
let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

const getFrom = () => process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_NAME = 'Social Media Dashboard';

/**
 * Send email verification link
 */
const sendVerificationEmail = async (to, username, verifyUrl) => {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to ${APP_NAME}, ${username}! 🎉</h2>
        <p>Thanks for signing up. Please verify your email to get started.</p>
        <a href="${verifyUrl}" 
           style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 13px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        <p style="color: #666; font-size: 12px;">Or copy this link: ${verifyUrl}</p>
      </div>
    `,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, username, resetUrl) => {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>Hi ${username}, we received a request to reset your password.</p>
        <a href="${resetUrl}"
           style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email — your password is safe.</p>
        <p style="color: #666; font-size: 12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
