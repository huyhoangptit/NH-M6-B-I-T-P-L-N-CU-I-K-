import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Movie } from '../src/models/Movie.js';
import { Room } from '../src/models/Room.js';
import { Showtime } from '../src/models/Showtime.js';
import { Booking } from '../src/models/Booking.js';

await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([User.init(), Movie.init(), Room.init(), Showtime.init(), Booking.init()]);
await Promise.all([Booking.deleteMany({}), Showtime.deleteMany({}), Room.deleteMany({}), Movie.deleteMany({}), User.deleteMany({})]);
const adminPassword = await bcrypt.hash('Admin123!', 12);
await User.create({ name: 'Quản trị viên', email: 'admin@cineticket.local', password: adminPassword, role: 'admin' });
const movies = await Movie.insertMany([
  { title: 'Thám Tử Lừng Danh Conan', description: 'Một vụ án bí ẩn mở ra hành trình truy tìm sự thật.', genre: ['Hành động', 'Phiêu lưu'], durationMinutes: 110, releaseDate: new Date('2026-04-10'), status: 'now', posterUrl: '/posters/conan.svg', trailerUrl: 'https://www.youtube.com/watch?v=aqxJ5W8Z1Yg' },
  { title: 'Doraemon: Nobita và cuộc phiêu lưu', description: 'Nobita cùng những người bạn bước vào chuyến phiêu lưu mới.', genre: ['Hoạt hình', 'Phiêu lưu'], durationMinutes: 105, releaseDate: new Date('2026-06-01'), status: 'now', posterUrl: '/posters/doraemon.svg' },
  { title: 'Kung Fu Panda 4', description: 'Po tiếp tục hành trình trở thành thủ lĩnh tinh thần.', genre: ['Hoạt hình', 'Hành động'], durationMinutes: 94, releaseDate: new Date('2026-05-01'), status: 'now', posterUrl: '/posters/kungfupanda4.svg' },
  { title: 'Mai', description: 'Câu chuyện tình cảm và những lựa chọn trong cuộc sống.', genre: ['Tình cảm', 'Tâm lý'], durationMinutes: 131, releaseDate: new Date('2026-12-10'), status: 'upcoming', posterUrl: '/posters/mai.svg' },
  { title: 'Nhiệm Vụ Bất Khả Thi', description: 'Một nhiệm vụ nguy hiểm với nhiều thử thách bất ngờ.', genre: ['Hành động', 'Phiêu lưu'], durationMinutes: 125, releaseDate: new Date('2026-11-25'), status: 'upcoming', posterUrl: '/posters/nhiemvubatkhathi.svg' },
  { title: 'Your Name', description: 'Hai con người xa lạ kết nối qua những giấc mơ kỳ lạ.', genre: ['Tình cảm', 'Hoạt hình'], durationMinutes: 106, releaseDate: new Date('2026-03-20'), status: 'now', posterUrl: '/posters/yourname.svg' },
  { title: 'Zootopia 2', description: 'Cặp đôi cảnh sát trở lại với vụ án mới tại thành phố động vật.', genre: ['Hoạt hình', 'Phiêu lưu'], durationMinutes: 108, releaseDate: new Date('2026-12-05'), status: 'upcoming', posterUrl: '/posters/zootopia2.svg' }
]);
const rooms = await Room.insertMany([
  { name: 'Phòng 1', rows: 6, seatsPerRow: 8, vipRows: ['E', 'F'] },
  { name: 'Phòng 2', rows: 5, seatsPerRow: 10, vipRows: ['D', 'E'] }
]);
const startBase = new Date(); startBase.setDate(startBase.getDate() + 1); startBase.setHours(14, 0, 0, 0);
const showtimes = [];
for (let i = 0; i < Math.min(5, movies.length); i += 1) {
  const startAt = new Date(startBase.getTime() + i * 3 * 60 * 60 * 1000);
  const room = rooms[i % rooms.length];
  showtimes.push({ movie: movies[i]._id, room: room._id, startAt, endAt: new Date(startAt.getTime() + (movies[i].durationMinutes + 15) * 60000), priceNormal: 80000, priceVip: 110000 });
}
await Showtime.insertMany(showtimes);
console.log('Seed thành công. Admin: admin@cineticket.local / Admin123!');
await mongoose.disconnect();
