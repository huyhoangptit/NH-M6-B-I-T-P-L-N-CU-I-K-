import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidEmail } from '../middleware/validate.js';
const router = Router();
function createToken(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }); }
function publicUser(user) { return { id: user._id, name: user.name, email: user.email, role: user.role }; }
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || String(name).trim().length < 2 || !isValidEmail(email) || !password || password.length < 8) throw new ApiError(400, 'Vui lòng nhập họ tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự.');
  if (await User.exists({ email: String(email).toLowerCase() })) throw new ApiError(409, 'Email đã được sử dụng.');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hash, role: 'user' });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: createToken(user) } });
}));
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu.');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');
  res.json({ success: true, data: { user: publicUser(user), token: createToken(user) } });
}));
router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } }));
export default router;
