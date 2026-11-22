import 'dotenv/config';
import mongoose from 'mongoose';
import { Movie } from '../src/models/Movie.js';
import { Room } from '../src/models/Room.js';
import { Showtime } from '../src/models/Showtime.js';

await mongoose.connect(process.env.MONGODB_URI);

try {
  const movies = await Movie.find().sort({ _id: 1 });
  const rooms = await Room.find().sort({ name: 1 });
  const hours = [9, 13, 17, 21];
  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() + 1);
  firstDay.setHours(0, 0, 0, 0);
  let created = 0;
  let skipped = 0;

  if (!movies.length) throw new Error('Chưa có phim trong database. Hãy chạy npm run seed trước.');
  if (!rooms.length) throw new Error('Chưa có phòng chiếu trong database. Hãy chạy npm run seed trước.');

  for (const [movieIndex, movie] of movies.entries()) {
    const existingForMovie = await Showtime.find({ movie: movie._id, active: true }).sort({ startAt: 1 });
    const assignedRoomIds = [...new Set(existingForMovie.map((item) => item.room.toString()))];
    if (assignedRoomIds.length > 1) {
      throw new Error(`Phim "${movie.title}" hiện đang được gán nhiều phòng. Hãy kiểm tra lịch chiếu trước khi chạy script.`);
    }

    const assignedRoomId = movie.defaultRoom?.toString() || assignedRoomIds[0] || rooms[movieIndex % rooms.length]._id.toString();
    if (assignedRoomIds.some((id) => id !== assignedRoomId)) {
      throw new Error(`Phim \"${movie.title}\" có suất chiếu không cùng phòng đã gán.`);
    }
    if (!movie.defaultRoom) await Movie.updateOne({ _id: movie._id }, { $set: { defaultRoom: assignedRoomId } });
    const roomId = assignedRoomId;
    const roomExists = await Room.findById(roomId);
    if (!roomExists) throw new Error(`Không tìm thấy phòng của phim "${movie.title}".`);

    const referenceShowtime = existingForMovie[0];
    const priceNormal = referenceShowtime?.priceNormal ?? 80000;
    const priceVip = referenceShowtime?.priceVip ?? 110000;

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      for (const hour of hours) {
        const startAt = new Date(firstDay);
        startAt.setDate(firstDay.getDate() + dayOffset);
        startAt.setHours(hour, 0, 0, 0);
        const endAt = new Date(startAt.getTime() + (movie.durationMinutes + 15) * 60000);

        const exact = await Showtime.findOne({ movie: movie._id, startAt });
        if (exact) {
          if (exact.room.toString() !== roomId) {
            throw new Error(`Suất ${movie.title} lúc ${startAt.toLocaleString('vi-VN')} đang nằm ở phòng khác.`);
          }
          skipped += 1;
          continue;
        }

        const overlap = await Showtime.findOne({
          room: roomId,
          active: true,
          startAt: { $lt: endAt },
          endAt: { $gt: startAt }
        });
        if (overlap) {
          // Có thể database đã có một suất cũ nằm giữa 4 khung giờ mẫu.
          // Bỏ qua khung bị giao nhau thay vì xóa hoặc làm ảnh hưởng vé đã đặt.
          skipped += 1;
          continue;
        }

        await Showtime.create({
          movie: movie._id,
          room: roomId,
          startAt,
          endAt,
          priceNormal,
          priceVip,
          active: true
        });
        created += 1;
      }
    }
  }

  console.log(`Đã bổ sung ${created} suất chiếu; bỏ qua ${skipped} khung giờ đã tồn tại hoặc bị trùng.`);
  console.log('Mỗi phim tiếp tục sử dụng một phòng chiếu cố định. Không xóa tài khoản, phim, phòng hoặc vé đã đặt.');
} finally {
  await mongoose.disconnect();
}
