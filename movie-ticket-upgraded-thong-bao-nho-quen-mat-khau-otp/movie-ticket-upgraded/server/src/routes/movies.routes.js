import { Router } from 'express';
import mongoose from 'mongoose';
import { Movie } from '../models/Movie.js';
import { Showtime } from '../models/Showtime.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 8));
  const filter = {};
  if (req.query.q) {
    const escaped = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escaped, $options: 'i' };
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.genre) filter.genre = { $in: [String(req.query.genre)] };
  if (req.query.date) {
    const day = new Date(`${req.query.date}T00:00:00+07:00`);
    if (Number.isNaN(day.getTime())) throw new ApiError(400, 'Ngày lọc không hợp lệ.');
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const movieIds = await Showtime.distinct('movie', { startAt: { $gte: day, $lt: nextDay }, active: true });
    filter._id = { $in: movieIds };
  }
  const [movies, total] = await Promise.all([Movie.find(filter).sort({ _id: 1 }).skip((page - 1) * limit).limit(limit), Movie.countDocuments(filter)]);
  res.json({ success: true, data: { movies, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } } });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Mã phim không hợp lệ.');
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim.');
  const showtimes = await Showtime.find({ movie: movie._id, active: true, startAt: { $gte: new Date() } }).populate('room', 'name').sort({ startAt: 1 });
  res.json({ success: true, data: { movie, showtimes } });
}));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { title, description, genre, durationMinutes, releaseDate } = req.body;
  if (!title || !description || !Array.isArray(genre) || !durationMinutes || !releaseDate) throw new ApiError(400, 'Thiếu thông tin phim bắt buộc.');
  const movie = await Movie.create(req.body);
  res.status(201).json({ success: true, data: { movie } });
}));
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim.');
  res.json({ success: true, data: { movie } });
}));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim.');
  res.json({ success: true, message: 'Đã xóa phim.' });
}));
export default router;
