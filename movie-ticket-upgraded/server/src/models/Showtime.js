import mongoose from 'mongoose';
const showtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  priceNormal: { type: Number, required: true, min: 0 },
  priceVip: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
showtimeSchema.index({ room: 1, startAt: 1, endAt: 1 });
export const Showtime = mongoose.model('Showtime', showtimeSchema);
