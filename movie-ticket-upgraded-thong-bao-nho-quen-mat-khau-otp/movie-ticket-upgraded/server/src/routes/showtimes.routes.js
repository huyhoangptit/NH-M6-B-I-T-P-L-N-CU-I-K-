import { Router } from 'express';
import mongoose from 'mongoose';
import { Showtime } from '../models/Showtime.js';
import { Movie } from '../models/Movie.js';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
async function calculateEndAt(movieId, startAt) {
  const movie = await Movie.findById(movieId);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim.');
  return new Date(new Date(startAt).getTime() + (movie.durationMinutes + 15) * 60000);
}

function validateEndAt(value, startAt) {
  const endAt = new Date(value);
  if (Number.isNaN(endAt.getTime()) || endAt <= new Date(startAt)) {
    throw new ApiError(400, 'Giờ kết thúc phải hợp lệ và sau giờ bắt đầu.');
  }
  return endAt;
}
async function checkRoomOverlap(roomId, startAt, endAt, excludeId = null) {
  const query = { room: roomId, startAt: { $lt: endAt }, endAt: { $gt: startAt }, active: true };
  if (excludeId) query._id = { $ne: excludeId };
  const overlap = await Showtime.findOne(query);
  if (overlap) throw new ApiError(409, 'Suất chiếu bị chồng giờ với một suất khác trong cùng phòng.');
}

async function ensureMovieRoom(movieId, roomId, excludeId = null) {
  const movie = await Movie.findById(movieId).select('defaultRoom');
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim.');

  const query = { movie: movieId, active: true };
  if (excludeId) query._id = { $ne: excludeId };
  const existingShowtime = await Showtime.findOne(query).select('room');
  const assignedRoomId = movie.defaultRoom?.toString() || existingShowtime?.room?.toString() || '';

  if (assignedRoomId && assignedRoomId !== roomId.toString()) {
    throw new ApiError(409, 'Mỗi phim chỉ được bố trí tại một phòng chiếu duy nhất. Hãy chọn đúng phòng đã gán cho phim.');
  }

  // Gán phòng bằng thao tác atomic để hai yêu cầu Admin đồng thời không thể
  // gán cùng một phim sang hai phòng khác nhau.
  if (!movie.defaultRoom) {
    const updatedMovie = await Movie.findOneAndUpdate(
      { _id: movieId, $or: [{ defaultRoom: null }, { defaultRoom: roomId }] },
      { $set: { defaultRoom: roomId } },
      { new: true }
    );
    if (!updatedMovie) {
      const latestMovie = await Movie.findById(movieId).select('defaultRoom');
      if (latestMovie?.defaultRoom?.toString() !== roomId.toString()) {
        throw new ApiError(409, 'Phim vừa được gán sang phòng khác. Hãy tải lại trang và chọn phòng đã gán.');
      }
    }
  }
}
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const filter = { active: true, startAt: { $gte: new Date() } };
  if (req.query.movieId) filter.movie = req.query.movieId;
  const [showtimes, total] = await Promise.all([Showtime.find(filter).populate('movie', 'title posterUrl durationMinutes').populate('room', 'name').sort({ startAt: 1 }).skip((page - 1) * limit).limit(limit), Showtime.countDocuments(filter)]);
  res.json({ success: true, data: { showtimes, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } } });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Mã suất chiếu không hợp lệ.');
  const showtime = await Showtime.findById(req.params.id).populate('movie').populate('room');
  if (!showtime) throw new ApiError(404, 'Không tìm thấy suất chiếu.');
  const occupied = await Booking.distinct('seats.code', { showtime: showtime._id, status: 'confirmed' });
  res.json({ success: true, data: { showtime, bookedSeats: occupied } });
}));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { movieId, roomId, startAt, endAt: requestedEndAt, priceNormal, priceVip } = req.body;
  if (!movieId || !roomId || !startAt || priceNormal === undefined || priceVip === undefined) throw new ApiError(400, 'Thiếu thông tin suất chiếu.');
  if (!mongoose.isValidObjectId(movieId) || !mongoose.isValidObjectId(roomId)) throw new ApiError(400, 'Phim hoặc phòng không hợp lệ.');
  const room = await Room.findById(roomId); if (!room) throw new ApiError(404, 'Không tìm thấy phòng.');
  const start = new Date(startAt); if (Number.isNaN(start.getTime()) || start <= new Date()) throw new ApiError(400, 'Thời gian chiếu phải là thời điểm trong tương lai.');
  const suggestedEnd = requestedEndAt ? requestedEndAt : await calculateEndAt(movieId, start);
  const end = validateEndAt(suggestedEnd, start);
  await ensureMovieRoom(movieId, roomId);
  await checkRoomOverlap(roomId, start, end);
  const showtime = await Showtime.create({ movie: movieId, room: roomId, startAt: start, endAt: end, priceNormal, priceVip });
  res.status(201).json({ success: true, data: { showtime } });
}));
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const current = await Showtime.findById(req.params.id); if (!current) throw new ApiError(404, 'Không tìm thấy suất chiếu.');
  const movieId = req.body.movieId || current.movie; const roomId = req.body.roomId || current.room; const start = new Date(req.body.startAt || current.startAt);
  if (Number.isNaN(start.getTime()) || start <= new Date()) throw new ApiError(400, 'Thời gian chiếu phải là thời điểm trong tương lai.');
  const suggestedEnd = req.body.endAt
    ? req.body.endAt
    : (req.body.startAt ? await calculateEndAt(movieId, start) : current.endAt);
  const end = validateEndAt(suggestedEnd, start);
  await ensureMovieRoom(movieId, roomId, current._id);
  await checkRoomOverlap(roomId, start, end, current._id);
  current.movie = movieId; current.room = roomId; current.startAt = start; current.endAt = end;
  if (req.body.priceNormal !== undefined) current.priceNormal = req.body.priceNormal;
  if (req.body.priceVip !== undefined) current.priceVip = req.body.priceVip;
  await current.save(); res.json({ success: true, data: { showtime: current } });
}));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => { const item = await Showtime.findByIdAndDelete(req.params.id); if (!item) throw new ApiError(404, 'Không tìm thấy suất chiếu.'); res.json({ success: true, message: 'Đã xóa suất chiếu.' }); }));
export default router;
