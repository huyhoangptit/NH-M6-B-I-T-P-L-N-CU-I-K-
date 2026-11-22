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

// Danh sách phim giữ đúng tên, thứ tự và poster từ website HTML/CSS/JS gốc.
const movies = await Movie.insertMany([
  {
    title: 'Thám tử lừng danh Conan movie 28: Dư ảnh của độc nhãn',
    description: 'Conan cùng cảnh sát Nagano điều tra một vụ án bí ẩn tại vùng núi tuyết, nơi những sự kiện hiện tại liên quan đến một vụ án trong quá khứ.',
    genre: ['Hoạt hình', 'Trinh thám', 'Phiêu lưu'], durationMinutes: 110,
    director: 'Katsuya Shigehara', cast: 'Minami Takayama, Rikiya Koyama, Yuji Takada',
    releaseDate: new Date('2026-11-28'), status: 'now', posterUrl: '/posters/conan.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Conan+movie+28+trailer'
  },
  {
    title: 'Your Name',
    description: 'Mitsuha và Taki là hai người trẻ sống ở hai nơi khác nhau. Họ bất ngờ hoán đổi cơ thể trong giấc ngủ và dần tìm cách gặp được nhau.',
    genre: ['Hoạt hình', 'Tình cảm', 'Giả tưởng'], durationMinutes: 106,
    director: 'Makoto Shinkai', cast: 'Ryunosuke Kamiki, Mone Kamishiraishi, Masami Nagasawa',
    releaseDate: new Date('2026-11-27'), status: 'now', posterUrl: '/posters/yourname.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Your+Name+official+trailer'
  },
  {
    title: 'Mai',
    description: 'Bộ phim tâm lý – tình cảm kể về Mai, một người phụ nữ mang nhiều tổn thương và hành trình tìm kiếm tình yêu, sự cảm thông và hạnh phúc.',
    genre: ['Tình cảm', 'Tâm lý'], durationMinutes: 131,
    director: 'Trấn Thành', cast: 'Phương Anh Đào, Tuấn Trần, Trấn Thành',
    releaseDate: new Date('2026-11-26'), status: 'now', posterUrl: '/posters/mai.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Mai+Tran+Thanh+trailer'
  },
  {
    title: 'Nobita và Cuộc Phiêu Lưu Vào Thế Giới Trong Tranh',
    description: 'Doraemon, Nobita và những người bạn bước vào thế giới bên trong một bức tranh, khám phá vương quốc kỳ lạ với nhiều bí mật và thử thách.',
    genre: ['Hoạt hình', 'Gia đình', 'Phiêu lưu'], durationMinutes: 105,
    director: 'Yukiyo Teramoto', cast: 'Wasabi Mizuta, Megumi Oohara, Yumi Kakazu',
    releaseDate: new Date('2026-11-25'), status: 'now', posterUrl: '/posters/doraemon.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Doraemon+world+of+art+trailer'
  },
  {
    title: 'Kung Fu Panda 4',
    description: 'Po tiếp tục hành trình trở thành Thần Long Đại Hiệp và phải đối đầu với một phù thủy nguy hiểm có khả năng biến hình.',
    genre: ['Hoạt hình', 'Hành động', 'Hài'], durationMinutes: 94,
    director: 'Mike Mitchell', cast: 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman',
    releaseDate: new Date('2026-11-24'), status: 'now', posterUrl: '/posters/kungfupanda4.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Kung+Fu+Panda+4+official+trailer'
  },
  {
    title: 'Nhiệm vụ: Bất khả thi - Nghiệp báo cuối cùng',
    description: 'Ethan Hunt và đội IMF bước vào nhiệm vụ nguy hiểm nhằm ngăn chặn một mối đe dọa có thể gây hỗn loạn toàn cầu.',
    genre: ['Hành động', 'Phiêu lưu', 'Giật gân'], durationMinutes: 169,
    director: 'Christopher McQuarrie', cast: 'Tom Cruise, Hayley Atwell, Ving Rhames, Simon Pegg',
    releaseDate: new Date('2026-11-23'), status: 'upcoming', posterUrl: '/posters/nhiemvubatkhathi.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Mission+Impossible+Final+Reckoning+trailer'
  },
  {
    title: 'Phi Vụ Động Trời 2',
    description: 'Judy Hopps và Nick Wilde trở lại với một vụ án mới tại thành phố Zootopia, nơi họ phải phối hợp để khám phá những bí mật bất ngờ.',
    genre: ['Hoạt hình', 'Hài', 'Phiêu lưu'], durationMinutes: 108,
    director: 'Jared Bush', cast: 'Ginnifer Goodwin, Jason Bateman',
    releaseDate: new Date('2026-11-22'), status: 'upcoming', posterUrl: '/posters/Zootopia2.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Zootopia+2+official+trailer'
  },
  {
    title: 'Avatar: Lửa Và Tro Tàn',
    description: 'Jake Sully và Neytiri tiếp tục đối mặt với những thử thách mới cùng một bộ tộc Na’vi gắn liền với lửa.',
    genre: ['Khoa học viễn tưởng', 'Phiêu lưu', 'Hành động'], durationMinutes: 192,
    director: 'James Cameron', cast: 'Sam Worthington, Zoe Saldaña, Sigourney Weaver, Kate Winslet',
    releaseDate: new Date('2026-11-21'), status: 'upcoming', posterUrl: '/posters/avatar.jpg',
    trailerUrl: 'https://www.youtube.com/results?search_query=Avatar+Fire+and+Ash+official+trailer'
  }
]);

// Mỗi phim được gán cố định một phòng. Trong 7 ngày tiếp theo,
// mỗi phim có 4 khung giờ/ngày: 09:00, 13:00, 17:00 và 21:00.
// Khoảng cách 4 tiếng bảo đảm không chồng giờ kể cả phim dài 192 phút.
const rooms = await Room.insertMany(Array.from({ length: movies.length }, (_, index) => ({
  name: `Phòng ${index + 1}`, rows: 6, seatsPerRow: 7, vipRows: ['C', 'D']
})));
await Promise.all(movies.map((movie, index) => Movie.updateOne({ _id: movie._id }, { $set: { defaultRoom: rooms[index]._id } })));
const dailyHours = [9, 13, 17, 21];
const firstDay = new Date();
firstDay.setDate(firstDay.getDate() + 1);
firstDay.setHours(0, 0, 0, 0);
const showtimes = [];

movies.forEach((movie, movieIndex) => {
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    dailyHours.forEach((hour) => {
      const startAt = new Date(firstDay);
      startAt.setDate(firstDay.getDate() + dayOffset);
      startAt.setHours(hour, 0, 0, 0);
      showtimes.push({
        movie: movie._id,
        room: rooms[movieIndex]._id,
        startAt,
        endAt: new Date(startAt.getTime() + (movie.durationMinutes + 15) * 60000),
        priceNormal: 80000,
        priceVip: 110000
      });
    });
  }
});
await Showtime.insertMany(showtimes);
console.log('Seed thành công. Admin: admin@cineticket.local / Admin123!');
await mongoose.disconnect();
