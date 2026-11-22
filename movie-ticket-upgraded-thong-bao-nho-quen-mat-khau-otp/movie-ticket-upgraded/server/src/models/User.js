import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Password-reset values are excluded from normal queries and never returned to clients.
  passwordResetOtpHash: { type: String, select: false },
  passwordResetOtpExpiresAt: { type: Date, select: false },
  passwordResetOtpRequestedAt: { type: Date, select: false },
  passwordResetOtpAttempts: { type: Number, default: 0, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetTokenExpiresAt: { type: Date, select: false }
}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
