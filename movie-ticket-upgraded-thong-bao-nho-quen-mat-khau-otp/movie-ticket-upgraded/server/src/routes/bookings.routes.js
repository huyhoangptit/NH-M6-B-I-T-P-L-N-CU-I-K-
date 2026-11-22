import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { Booking } from '../models/Booking.js';
import { Showtime } from '../models/Showtime.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(requireAuth);
router.post('/', asyncHandler(async (req, res) => {
  const { showtimeId, seats, customer } = req.body;
  if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 2 || typeof customer.phone !== 'string' || !/^[0-9+ .()\-]{9,18}$/.test(customer.phone.trim()) || typeof customer.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    throw new ApiError(400, 'Vui lòng nhập họ tên, số điện thoại và email hợp lệ của người đặt.');
  }
  if (!showtimeId || !Array.isArray(seats) || !seats.length) throw new ApiError(400, 'Vui lòng chọn suất chiếu và ít nhất một ghế.');
  if (seats.length > 8) throw new ApiError(400, 'Mỗi lần chỉ được đặt tối đa 8 ghế.');
  if (new Set(seats).size !== seats.length || seats.some((seat) => typeof seat !== 'string')) throw new ApiError(400, 'Danh sách ghế không hợp lệ.');
  const showtime = await Showtime.findById(showtimeId).populate('room').populate('movie');
  if (!showtime || !showtime.active) throw new ApiError(404, 'Không tìm thấy suất chiếu.');
  if (showtime.startAt <= new Date()) throw new ApiError(400, 'Suất chiếu đã bắt đầu hoặc đã qua.');
  const rowNames = Array.from({ length: showtime.room.rows }, (_, index) => String.fromCharCode(65 + index));
  const valid = new Set(rowNames.flatMap((row) => Array.from({ length: showtime.room.seatsPerRow }, (_, index) => `${row}${index + 1}`)));
  const invalidSeats = seats.filter((seat) => !valid.has(seat));
  if (invalidSeats.length) throw new ApiError(400, `Ghế không tồn tại: ${invalidSeats.join(', ')}`);
  const occupied = await Booking.distinct('seats.code', { showtime: showtime._id, status: 'confirmed', 'seats.code': { $in: seats } });
  if (occupied.length) { res.status(409).json({ success: false, message: 'Một số ghế đã được người khác đặt.', conflictSeats: occupied }); return; }
  const seatDetails = seats.map((code) => {
    const row = code[0]; const type = showtime.room.vipRows.includes(row) ? 'vip' : 'normal';
    return { code, type, price: type === 'vip' ? showtime.priceVip : showtime.priceNormal };
  });
  const total = seatDetails.reduce((sum, seat) => sum + seat.price, 0);
  try {
    const booking = await Booking.create({ user: req.user._id, showtime: showtime._id, customer: { name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim().toLowerCase() }, seats: seatDetails, total, status: 'confirmed', ticketCode: `CT-${randomBytes(4).toString('hex').toUpperCase()}` });
    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    if (error.code === 11000) {
      const latest = await Booking.distinct('seats.code', { showtime: showtime._id, status: 'confirmed', 'seats.code': { $in: seats } });
      res.status(409).json({ success: false, message: 'Ghế vừa được người khác đặt. Vui lòng chọn ghế khác.', conflictSeats: latest });
      return;
    }
    throw error;
  }
}));
router.get('/my', asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate({ path: 'showtime', populate: [{ path: 'movie', select: 'title posterUrl' }, { path: 'room', select: 'name' }] }).sort({ createdAt: -1 });
  res.json({ success: true, data: { bookings } });
}));
router.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('showtime');
  if (!booking) throw new ApiError(404, 'Không tìm thấy vé.');
  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Bạn không có quyền hủy vé này.');
  if (booking.status !== 'confirmed') throw new ApiError(400, 'Vé này đã được hủy.');
  const twoHours = 2 * 60 * 60 * 1000;
  if (booking.showtime.startAt.getTime() - Date.now() < twoHours) throw new ApiError(400, 'Chỉ được hủy vé trước giờ chiếu ít nhất 2 tiếng.');
  booking.status = 'cancelled'; await booking.save();
  res.json({ success: true, data: { booking }, message: 'Đã hủy vé.' });
}));
export default router;
