import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidEmail } from '../middleware/validate.js';

const router = Router();
const OTP_EXPIRES_MINUTES = 10;
const RESET_TOKEN_EXPIRES_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_WAIT_MS = 60 * 1000;

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.' }
});

function createToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}
function publicUser(user) { return { id: user._id, name: user.name, email: user.email, role: user.role }; }
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function hashResetToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

function createMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new ApiError(500, 'Chưa cấu hình dịch vụ gửi email OTP. Vui lòng kiểm tra SMTP_HOST, SMTP_PORT, SMTP_USER và SMTP_PASS trong file server/.env.');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function sendPasswordOtp(user, otp) {
  const transporter = createMailTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Mã OTP đặt lại mật khẩu - HTH Cinema',
    text: `Xin chào ${user.name}, mã OTP đặt lại mật khẩu của bạn là ${otp}. Mã có hiệu lực trong ${OTP_EXPIRES_MINUTES} phút. Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#20232a">
        <h2 style="color:#c93228;margin:0 0 14px">HTH Cinema - Đặt lại mật khẩu</h2>
        <p>Xin chào <b>${String(user.name).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</b>,</p>
        <p>Mã xác thực OTP của bạn:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:10px;background:#f3f3f3;padding:18px;text-align:center;border-radius:10px">${otp}</div>
        <p>Mã có hiệu lực trong <b>${OTP_EXPIRES_MINUTES} phút</b> và chỉ sử dụng một lần.</p>
        <p style="color:#777;font-size:13px">Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      </div>`
  });
}

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || String(name).trim().length < 2 || !isValidEmail(email) || !password || password.length < 8) throw new ApiError(400, 'Vui lòng nhập họ tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự.');
  if (await User.exists({ email: normalizeEmail(email) })) throw new ApiError(409, 'Email đã được sử dụng.');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizeEmail(email), password: hash, role: 'user' });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: createToken(user) } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu.');
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');
  res.json({ success: true, data: { user: publicUser(user), token: createToken(user) } });
}));

// Always return the same public message for unknown email addresses to avoid account enumeration.
router.post('/forgot-password/request-otp', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) throw new ApiError(400, 'Vui lòng nhập địa chỉ email hợp lệ.');

  const user = await User.findOne({ email }).select('+passwordResetOtpRequestedAt');
  const genericMessage = 'Nếu email đã được đăng ký, mã OTP sẽ được gửi đến hộp thư của bạn.';
  if (!user) return res.json({ success: true, message: genericMessage });

  const now = Date.now();
  if (user.passwordResetOtpRequestedAt && now - user.passwordResetOtpRequestedAt.getTime() < OTP_RESEND_WAIT_MS) {
    const seconds = Math.ceil((OTP_RESEND_WAIT_MS - (now - user.passwordResetOtpRequestedAt.getTime())) / 1000);
    throw new ApiError(429, `Vui lòng đợi ${seconds} giây trước khi yêu cầu gửi mã OTP mới.`);
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
  user.passwordResetOtpExpiresAt = new Date(now + OTP_EXPIRES_MINUTES * 60 * 1000);
  user.passwordResetOtpRequestedAt = new Date(now);
  user.passwordResetOtpAttempts = 0;
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save();

  try {
    await sendPasswordOtp(user, otp);
  } catch (error) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpRequestedAt = undefined;
    await user.save();
    if (error instanceof ApiError) throw error;
    // Keep transport details on the server only; do not leak SMTP credentials or raw provider errors.
    console.error('Không gửi được email OTP:', error.message);
    throw new ApiError(500, 'Không gửi được email OTP. Hãy kiểm tra cấu hình SMTP trong server/.env và thử lại.');
  }

  res.json({ success: true, message: genericMessage });
}));

router.post('/forgot-password/verify-otp', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) throw new ApiError(400, 'Vui lòng nhập email hợp lệ và mã OTP gồm đúng 6 chữ số.');

  const user = await User.findOne({ email }).select('+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts');
  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
  if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpAttempts = 0;
    await user.save();
    throw new ApiError(400, 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi mã mới.');
  }

  const isCorrect = await bcrypt.compare(otp, user.passwordResetOtpHash);
  if (!isCorrect) {
    user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
    const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - user.passwordResetOtpAttempts);
    if (attemptsLeft === 0) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save();
      throw new ApiError(400, 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.');
    }
    await user.save();
    throw new ApiError(400, `Mã OTP không chính xác. Bạn còn ${attemptsLeft} lần thử.`);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetTokenHash = hashResetToken(resetToken);
  user.passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
  await user.save();

  res.json({ success: true, message: 'Xác thực OTP thành công.', data: { resetToken } });
}));

router.post('/forgot-password/reset-password', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const resetToken = String(req.body.resetToken || '');
  const newPassword = String(req.body.newPassword || '');
  if (!isValidEmail(email) || !resetToken || newPassword.length < 8) {
    throw new ApiError(400, 'Thông tin đặt lại mật khẩu không hợp lệ. Mật khẩu mới phải có ít nhất 8 ký tự.');
  }

  const user = await User.findOne({ email }).select('+password +passwordResetTokenHash +passwordResetTokenExpiresAt');
  if (!user || !user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) throw new ApiError(400, 'Phiên xác thực OTP không hợp lệ. Vui lòng thực hiện lại từ đầu.');
  if (user.passwordResetTokenExpiresAt.getTime() < Date.now() || hashResetToken(resetToken) !== user.passwordResetTokenHash) {
    throw new ApiError(400, 'Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng xác thực OTP lại.');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetOtpRequestedAt = undefined;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save();

  res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
}));

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } }));
export default router;
