import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  seats: [{ code: { type: String, required: true }, type: { type: String, enum: ['normal', 'vip'], required: true }, price: { type: Number, required: true } }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  ticketCode: { type: String, required: true, unique: true }
}, { timestamps: true });
// Unique multikey index: hai booking đang xác nhận không thể bán cùng một ghế trong một suất.
bookingSchema.index({ showtime: 1, 'seats.code': 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });
export const Booking = mongoose.model('Booking', bookingSchema);
