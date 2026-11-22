import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/stats', asyncHandler(async (req, res) => {
  const match = { status: 'confirmed' };
  const [summaryRows, byMovie, byDay] = await Promise.all([
    Booking.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' }, totalTickets: { $sum: { $size: '$seats' } } } }]),
    Booking.aggregate([{ $match: match }, { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } }, { $unwind: '$showtime' }, { $lookup: { from: 'movies', localField: 'showtime.movie', foreignField: '_id', as: 'movie' } }, { $unwind: '$movie' }, { $group: { _id: '$movie._id', title: { $first: '$movie.title' }, revenue: { $sum: '$total' }, tickets: { $sum: { $size: '$seats' } } } }, { $sort: { revenue: -1 } }]),
    Booking.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, revenue: { $sum: '$total' }, tickets: { $sum: { $size: '$seats' } } } }, { $sort: { _id: -1 } }, { $limit: 30 }])
  ]);
  res.json({ success: true, data: { summary: summaryRows[0] || { revenue: 0, totalTickets: 0 }, byMovie, byDay } });
}));
export default router;
