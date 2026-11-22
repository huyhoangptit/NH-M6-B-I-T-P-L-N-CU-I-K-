import mongoose from 'mongoose';
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  genre: { type: [String], default: [] },
  durationMinutes: { type: Number, required: true, min: 1 },
  releaseDate: { type: Date, required: true },
  status: { type: String, enum: ['now', 'upcoming'], default: 'now' },
  posterUrl: { type: String, default: '/posters/placeholder.svg' },
  trailerUrl: { type: String, default: '' }
}, { timestamps: true });
movieSchema.index({ title: 'text' });
export const Movie = mongoose.model('Movie', movieSchema);
