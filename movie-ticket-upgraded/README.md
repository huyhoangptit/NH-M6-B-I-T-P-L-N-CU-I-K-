# CineTicket – Website đặt vé xem phim

Dự án mẫu được tổ chức theo kiến trúc **React (Vite) + React Router + Redux Toolkit + Node.js/Express + MongoDB**. Đây là bản nâng cấp/tái cấu trúc theo yêu cầu trong file đề tài cuối kỳ; do file gốc bạn gửi là RAR5 và môi trường không giải nén được, bản này không chứa nguyên các file HTML/CSS/ảnh cũ. Các poster SVG minh họa có thể thay bằng ảnh gốc của bạn.

## 1. Yêu cầu cài đặt

- Node.js 18 trở lên, npm.
- MongoDB local hoặc MongoDB Atlas.
- VS Code (khuyến nghị).

## 2. Cài đặt

Mở terminal tại thư mục gốc dự án:

```bash
cd server
npm install
```

Tạo file `server/.env` từ `.env.example` (PowerShell: `Copy-Item .env.example .env` khi đang đứng trong thư mục `server`), sau đó cập nhật `MONGODB_URI` và `JWT_SECRET`.

```bash
npm run seed
npm run dev
```

Mở terminal thứ hai. Trong PowerShell, tạo file môi trường bằng lệnh `Copy-Item .env.example .env` khi đang đứng trong thư mục `client`, sau đó chạy:

```bash
cd client
npm install
npm run dev
```

Truy cập URL Vite in ra terminal (thường là `http://localhost:5173`). Backend chạy ở `http://localhost:5000`.

## 3. Tài khoản demo

Script seed tạo tài khoản quản trị:

- Email: `admin@cineticket.local`
- Mật khẩu: `Admin123!`

Bạn nên đổi mật khẩu demo trước khi triển khai công khai. Người dùng thường có thể tự đăng ký tại trang Đăng ký.

## 4. Chức năng đã được xây dựng trong bản này

- Danh sách phim, tìm kiếm, lọc thể loại/trạng thái, phân trang ở server.
- Chi tiết phim, trailer YouTube, thời lượng, các suất chiếu.
- Đăng ký/đăng nhập JWT; mật khẩu mã hóa bcrypt; vai trò `user` và `admin`.
- React Router gồm route động, route lồng, Outlet, NavLink active, route bảo vệ và 404.
- Context API cho phiên đăng nhập; Redux Toolkit quản lý ghế được chọn.
- Sơ đồ ghế được sinh từ cấu hình phòng, hỗ trợ ghế thường/VIP/đã bán; giới hạn 8 ghế.
- Tổng tiền dùng `useMemo`; trang chọn ghế có bộ đếm 5 phút với cleanup.
- Server kiểm tra ghế trùng, trả HTTP 409 và tên ghế xung đột.
- Hủy vé chỉ được thực hiện khi còn ít nhất 2 giờ trước giờ chiếu.
- Admin thêm/sửa/xóa phim, phòng, suất chiếu; server chặn suất chiếu chồng giờ cùng phòng.
- Thống kê doanh thu theo phim và theo ngày bằng MongoDB Aggregation Pipeline.
- Tối thiểu 5 collection có quan hệ: users, movies, rooms, showtimes, bookings.
- Middleware xác thực, phân quyền, kiểm tra dữ liệu và xử lý lỗi tập trung.

## 5. Cấu trúc

```text
movie-ticket-upgraded/
├── client/                 # React + Vite
│   ├── public/posters/     # Poster SVG minh họa
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── store/
└── server/                 # Express + Mongoose
    ├── src/
    │   ├── config/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   └── utils/
    └── scripts/seed.js
```

## 6. Một số lưu ý nghiệp vụ

1. Website không tích hợp thanh toán thật, đúng theo đề bài: đặt vé xong là xác nhận.
2. Hệ thống dùng `Booking` với unique multikey index theo `showtime + seats.code` cho các vé đã xác nhận. Trường hợp hai người đồng thời đặt cùng ghế, database chỉ chấp nhận một thao tác; thao tác còn lại nhận mã 409.
3. Bộ đếm 5 phút hiện chạy ở giao diện chọn ghế theo yêu cầu đề. Đây không phải cơ chế khóa ghế tạm thời phía server; ghế chỉ chắc chắn được giữ khi API tạo booking thành công. Server luôn kiểm tra lại ghế ở thời điểm xác nhận.
4. Các API quản trị cần tài khoản admin. Không được coi việc ẩn nút trên giao diện là cơ chế phân quyền.
5. Để dùng lại ảnh cũ, chép các file `conan.jpg`, `doraemon.jpg`, `kungfupanda4.jpg`, `mai.jpg`, `nhiemvubatkhathi.jpg`, `yourname.jpg`, `Zootopia2.jpg` từ thư mục `images` của dự án cũ vào `client/public/posters/`. Sau đó cập nhật `posterUrl` tương ứng trong `server/scripts/seed.js` và chạy lại `npm run seed` (lệnh seed sẽ xóa dữ liệu hiện tại trong database `cineticket` trước khi tạo dữ liệu mẫu). Ảnh `avatar.jpg` không phải poster phim.

## 7. API chính

| Method | URL | Quyền | Mục đích |
|---|---|---|---|
| POST | `/api/auth/register` | Khách | Đăng ký |
| POST | `/api/auth/login` | Khách | Đăng nhập |
| GET | `/api/auth/me` | User/Admin | Thông tin hiện tại |
| GET | `/api/movies` | Công khai | Danh sách, tìm kiếm, lọc, phân trang |
| GET | `/api/movies/:id` | Công khai | Chi tiết phim |
| POST/PUT/DELETE | `/api/movies[/ :id]` | Admin | CRUD phim |
| GET | `/api/rooms` | Công khai | Danh sách phòng |
| POST/PUT/DELETE | `/api/rooms[/ :id]` | Admin | CRUD phòng |
| GET | `/api/showtimes` | Công khai | Danh sách suất chiếu |
| GET | `/api/showtimes/:id` | Công khai | Chi tiết suất chiếu và ghế đã bán |
| POST/PUT/DELETE | `/api/showtimes[/ :id]` | Admin | CRUD suất chiếu |
| POST | `/api/bookings` | User | Xác nhận đặt vé |
| GET | `/api/bookings/my` | User | Lịch sử vé của mình |
| PATCH | `/api/bookings/:id/cancel` | Chủ vé/Admin | Hủy vé đúng điều kiện |
| GET | `/api/admin/stats` | Admin | Thống kê doanh thu |

## 8. Trước khi nộp bài

- Chạy thử toàn bộ luồng trên máy của bạn, đặc biệt là hai trình duyệt cùng đặt một ghế.
- Thay poster SVG bằng poster/ảnh hợp lệ trong dự án gốc.
- Cập nhật mã nhóm, thành viên, phần trăm đóng góp và repository trong báo cáo.
- Không đưa `.env` hoặc mật khẩu thật lên GitHub.
- Bổ sung ảnh chụp màn hình máy tính/điện thoại, báo cáo PDF và video demo 5–10 phút theo yêu cầu giảng viên.
