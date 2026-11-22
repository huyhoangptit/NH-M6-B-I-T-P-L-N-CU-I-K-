# CineTicket – Website đặt vé xem phim

Dự án được tổ chức theo kiến trúc **React (Vite) + React Router + Redux Toolkit + Node.js/Express + MongoDB**. Bản cập nhật này giữ lại phong cách giao diện HTH từ website gốc: header đen, logo đỏ, thanh tìm kiếm ở giữa, banner đỏ-đen và khung 4 poster. Các poster JPG gốc trong thư mục `images` của bạn đã được đưa vào `client/public/posters`; luồng API/đặt vé/Admin vẫn được giữ lại.

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

Nếu đây là database mới, chạy seed lần đầu (lệnh này xóa dữ liệu cũ trong database `cineticket` trước khi tạo dữ liệu mẫu):

```bash
npm run seed
```

Nếu bạn đã có database từ bản dự án trước và chỉ muốn bổ sung nhiều giờ chiếu, **không chạy lại `npm run seed`**. Dùng lệnh không xóa dữ liệu sau:

```bash
npm run seed:showtimes
```

Sau đó khởi động Backend:

```bash
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

Script seed tạo tài khoản quản trị và dữ liệu lịch chiếu mẫu (mỗi phim một phòng, 4 khung giờ/ngày trong 7 ngày):

- Email: `admin@cineticket.local`
- Mật khẩu: `Admin123!`

Bạn nên đổi mật khẩu demo trước khi triển khai công khai. Người dùng thường có thể tự đăng ký tại trang Đăng ký.

## 4. Chức năng đã được xây dựng trong bản này

- Giao diện trang chủ giữ phong cách HTH: logo đỏ, header đen, ô tìm kiếm, banner đỏ-đen, 4 poster mỗi trang và phân trang.
- Danh sách phim, tìm kiếm từ header, lọc thể loại/trạng thái/ngày chiếu và phân trang ở server.
- Chi tiết phim, trailer YouTube, thời lượng, các suất chiếu.
- Đăng ký/đăng nhập JWT; mật khẩu mã hóa bcrypt; vai trò `user` và `admin`.
- React Router gồm route động, route lồng, Outlet, NavLink active, route bảo vệ và 404.
- Context API cho phiên đăng nhập; Redux Toolkit quản lý ghế được chọn.
- Sơ đồ ghế được sinh từ cấu hình phòng, hỗ trợ ghế thường/VIP/đã bán; giới hạn 8 ghế.
- Tổng tiền dùng `useMemo`; trang chọn ghế có bộ đếm 5 phút với cleanup.
- Server kiểm tra ghế trùng, trả HTTP 409 và tên ghế xung đột.
- Hủy vé chỉ được thực hiện khi còn ít nhất 2 giờ trước giờ chiếu.
- Admin thêm/sửa/xóa phim, phòng, suất chiếu; server chặn suất chiếu chồng giờ cùng phòng và bắt buộc mỗi phim chỉ được gán một phòng duy nhất.
- Trang giới thiệu phim có chọn ngày và nhiều khung giờ; dữ liệu seed tạo 4 suất/ngày trong 7 ngày cho mỗi phim, tất cả nằm trong cùng một phòng.
- Trang chọn ghế dùng viền trắng phát sáng nhịp nhàng cho ghế đang chọn.
- Trang xác nhận đặt vé có thông tin người đặt (họ tên, số điện thoại, email); thông tin được lưu cùng booking trong MongoDB.
- Thống kê doanh thu theo phim và theo ngày bằng MongoDB Aggregation Pipeline.
- Tối thiểu 5 collection có quan hệ: users, movies, rooms, showtimes, bookings.
- Middleware xác thực, phân quyền, kiểm tra dữ liệu và xử lý lỗi tập trung.

## 5. Cấu trúc

```text
movie-ticket-upgraded/
├── client/                 # React + Vite
│   ├── public/posters/     # Poster JPG lấy từ dự án gốc và ảnh dự phòng SVG
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
5. Dữ liệu mẫu tạo 28 suất chiếu cho mỗi phim trong 7 ngày (09:00, 13:00, 17:00, 21:00). Mỗi phim chỉ sử dụng một phòng cố định; backend từ chối nếu quản trị viên cố gán phim đó sang phòng khác. Nếu database đã được seed từ bản trước, chạy `npm run seed:showtimes` để bổ sung lịch chiếu mà không xóa tài khoản, phim, phòng hoặc vé hiện có. Script chỉ bỏ qua các khung giờ trùng với suất đã tồn tại.
6. Các poster gốc đã được chép vào `client/public/posters/` và `server/scripts/seed.js` đã trỏ tới các ảnh này. Nếu chỉnh sửa dữ liệu mẫu, cập nhật `posterUrl` tương ứng. Chạy lại `npm run seed` sẽ xóa dữ liệu hiện tại trong database `cineticket` trước khi tạo dữ liệu mẫu.

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
| POST | `/api/bookings` | User | Xác nhận đặt vé (kèm họ tên, số điện thoại, email người đặt) |
| GET | `/api/bookings/my` | User | Lịch sử vé của mình |
| PATCH | `/api/bookings/:id/cancel` | Chủ vé/Admin | Hủy vé đúng điều kiện |
| GET | `/api/admin/stats` | Admin | Thống kê doanh thu |

## 8. Giao diện được giữ lại từ dự án gốc

- Logo `HTH`, thanh tìm kiếm, đường viền đỏ dưới header và khu vực tài khoản được dựng lại theo ảnh giao diện bạn gửi.
- Banner giữ tiêu đề “Phim Chiếu Rạp Hot Nhất Tuần” và dòng ưu đãi.
- Danh sách phim giữ bố cục bốn poster trên một hàng ở màn hình lớn, thứ tự poster giống trang chủ HTML gốc.
- Poster JPG được lấy trực tiếp từ thư mục `images` của file RAR ban đầu.
- Các màn hình chi tiết, chọn ghế, thanh toán, lịch sử và quản trị vẫn dùng chung tông màu đen-đỏ để đồng bộ với trang chủ.

## 9. Trước khi nộp bài

- Chạy thử toàn bộ luồng trên máy của bạn, đặc biệt là hai trình duyệt cùng đặt một ghế.
- Kiểm tra các đường dẫn poster trong `server/scripts/seed.js` nếu bạn thay ảnh.
- Cập nhật mã nhóm, thành viên, phần trăm đóng góp và repository trong báo cáo.
- Không đưa `.env` hoặc mật khẩu thật lên GitHub.
- Bổ sung ảnh chụp màn hình máy tính/điện thoại, báo cáo PDF và video demo 5–10 phút theo yêu cầu giảng viên.

## 10. Bộ lọc quản trị, giờ kết thúc và thông báo HTTP

- Trang quản lý phim: tìm theo tên/thể loại, lọc trạng thái đang chiếu/sắp chiếu và lọc thể loại.
- Trang quản lý phòng: tìm theo tên phòng, kích thước/số ghế, hàng VIP; lọc theo sức chứa.
- Trang quản lý suất chiếu: tìm theo tên phim hoặc phòng, lọc phòng, khoảng ngày và khoảng giờ bắt đầu.
- Form quản lý suất chiếu có cả giờ bắt đầu và giờ kết thúc. Khi chọn phim và giờ bắt đầu, hệ thống gợi ý giờ kết thúc theo thời lượng phim + 15 phút; Admin có thể chỉnh lại. Backend kiểm tra giờ kết thúc phải sau giờ bắt đầu và dùng giờ kết thúc đó để chặn suất chiếu chồng lấn.
- Khung giờ đang được chọn ở trang chi tiết phim có nền đỏ, đồng bộ với giao diện HTH tham chiếu.
- Mỗi phản hồi HTTP từ Axios hiển thị toast ở góc trên bên phải: 200, 201, 400, 401, 403, 404, 500 (các mã khác như 409 cũng hiển thị mã thực tế). Lỗi mất kết nối được ghi là NET vì không có mã HTTP khi server không phản hồi.
- Bộ lọc được xử lý trên danh sách đã tải ở trình duyệt, không tạo request mới cho mỗi ký tự nhập. Toast HTTP chỉ xuất hiện khi có phản hồi thực sự từ server.

## Thông báo kết quả thao tác (HTTP Toast)

- Các thao tác ghi/sửa/xóa thành công (POST, PUT, PATCH, DELETE) hiển thị thông báo nền xanh ở góc trên bên phải.
- Các phản hồi lỗi HTTP hiển thị hộp nền đỏ, kèm mã HTTP, tên thao tác và thông điệp lỗi cụ thể do API trả về.
- Lỗi đặt vé trùng ghế hiển thị thêm mã ghế xung đột.
- Lỗi mất kết nối Backend hiển thị thông báo riêng.
- Các request GET tải dữ liệu thành công không bật thông báo để tránh nhiều toast khi người dùng mở trang; lỗi GET vẫn hiển thị thông báo đỏ.

## Quên mật khẩu bằng OTP email

Chức năng quên mật khẩu gửi mã OTP 6 chữ số đến **email đã đăng ký tài khoản**. Mã có hiệu lực 10 phút, tối đa 5 lần nhập sai; yêu cầu gửi lại được giới hạn tối thiểu 60 giây và có rate limit theo IP. Sau khi OTP hợp lệ, người dùng có 10 phút để đặt mật khẩu mới. Mật khẩu mới được mã hóa bằng bcrypt trước khi lưu.

### Cấu hình gửi email bằng Gmail

1. Dùng một tài khoản Gmail dành cho ứng dụng. Bật Xác minh 2 bước cho tài khoản Google.
2. Tạo **App Password** trong phần bảo mật tài khoản Google (không dùng mật khẩu Gmail thông thường).
3. Sao chép `server/.env.example` thành `server/.env` nếu chưa có.
4. Điền các biến SMTP trong `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=dia-chi-gmail-cua-ban@gmail.com
SMTP_PASS=mat-khau-ung-dung-16-ky-tu
SMTP_FROM=HTH Cinema <dia-chi-gmail-cua-ban@gmail.com>
```

5. Lưu `.env`, khởi động lại Backend bằng `npm run dev` trong thư mục `server`.
6. Đăng ký tài khoản bằng email bạn có thể truy cập, sau đó dùng email đó ở màn hình đăng nhập → **Quên mật khẩu?**.

Không đưa file `.env` hoặc App Password lên GitHub. Nếu chưa cấu hình SMTP, API sẽ trả lỗi dễ hiểu và không thể gửi email OTP.

### Luồng sử dụng

1. Nhập email tài khoản và chọn **Gửi mã OTP đến email**.
2. Nhập 6 chữ số nhận được trong email (có thể dán cả 6 số cùng lúc).
3. Khi OTP đúng, giao diện nhập mật khẩu mới sẽ xuất hiện.
4. Nhập mật khẩu mới và xác nhận lại. Mật khẩu phải có ít nhất 8 ký tự.
5. Quay lại đăng nhập bằng mật khẩu mới.

