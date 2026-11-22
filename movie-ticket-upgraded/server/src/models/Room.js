import mongoose from 'mongoose';
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  rows: { type: Number, required: true, min: 1, max: 26 },
  seatsPerRow: { type: Number, required: true, min: 1, max: 30 },
  vipRows: { type: [String], default: [] }
}, { timestamps: true });
export const Room = mongoose.model('Room', roomSchema);
