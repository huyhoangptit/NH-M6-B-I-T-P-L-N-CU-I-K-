import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Bạn cần đăng nhập để thực hiện chức năng này.');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'); }
  const user = await User.findById(payload.sub).select('-password');
  if (!user) throw new ApiError(401, 'Tài khoản không còn tồn tại.');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.'));
  next();
};
