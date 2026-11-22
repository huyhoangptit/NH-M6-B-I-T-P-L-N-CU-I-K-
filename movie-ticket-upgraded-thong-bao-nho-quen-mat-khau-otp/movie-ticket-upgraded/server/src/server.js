import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
const PORT = process.env.PORT || 5000;
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET phải có ít nhất 32 ký tự.');
  await connectDB();
  app.listen(PORT, () => console.log(`CineTicket API listening on port ${PORT}`));
} catch (error) {
  console.error('Không thể khởi động server:', error.message);
  process.exit(1);
}
