# Đối chiếu yêu cầu đề tài Đặt vé xem phim

Tài liệu này ghi lại các phần đã được cài đặt trong bản source React + Express.

## 1. Chín nhóm kỹ thuật chung

| Nhóm trong PDF | Phần triển khai trong source |
|---|---|
| Giao diện HTML/CSS, responsive | `client/src/components/Layout.jsx`, `client/src/styles.css`; dùng `header`, `nav`, `main`, `form`, `label` và media query |
| Quy chuẩn ES6 | Các file `.jsx`/`.js` dùng `const`, arrow function, destructuring, spread, template string, `async/await`; không dùng `var` |
| Component/Props/State | 17 component tái sử dụng trong `client/src/components`; danh sách dùng `key`; các form là controlled |
| React Hooks | `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`; custom hooks `useFetch` và `useLocalStorage`; timer/listener có cleanup |
| Routing SPA | `App.jsx` dùng React Router, nested route, `Outlet`, dynamic route, `useParams`, `NavLink`, `useNavigate`, `Navigate`, trang 404 |
| Quản lý state | Context API trong `AuthContext.jsx`; Redux Toolkit trong `bookingSlice.js` và `store.js` |
| REST API Express | Router tách theo tài nguyên; GET/POST/PUT/DELETE/PATCH; JSON; middleware xác thực, kiểm tra dữ liệu và xử lý lỗi |
| MongoDB | 5 collection liên kết: User, Movie, Room, Showtime, Booking; tìm kiếm regex, lọc `$in`/`$gte`, phân trang server, Aggregation Pipeline |
| Xác thực và bảo mật | JWT có thời hạn, bcrypt, role user/admin, middleware phân quyền, secret trong `.env` |

## 2. Chức năng riêng của Đề 1

| Yêu cầu | Triển khai |
|---|---|
| Khách xem phim, tìm kiếm và lọc theo thể loại/ngày | `HomePage.jsx`, `MovieFilter.jsx`, `movies.routes.js` |
| Chi tiết phim, trailer YouTube, thời lượng, suất chiếu | `MovieDetailPage.jsx`, `MovieTrailer.jsx`, `showtimes.routes.js` |
| Chọn ghế thường/VIP/đã bán, tối đa 8 ghế | `SeatMap.jsx`, `SeatButton.jsx`, `bookingSlice.js`, `bookings.routes.js` |
| Tổng tiền bằng useMemo | `BookingSummary.jsx` |
| Server ngăn đặt trùng ghế và trả 409 | `Booking.js` unique index và `bookings.routes.js` |
| Countdown 5 phút, cleanup và quay về trang phim | `BookingPage.jsx` |
| Hủy vé trước giờ chiếu 2 tiếng | `bookings.routes.js` và `HistoryPage.jsx` |
| Admin CRUD phim/phòng/suất chiếu | Các trang `Admin*Page.jsx` và `*.routes.js` tương ứng |
| Không cho suất chiếu chồng giờ trong cùng phòng | `showtimes.routes.js` kiểm tra khoảng thời gian ở server |
| Doanh thu theo phim/ngày bằng Aggregation Pipeline | `admin.routes.js` |

## 3. Những việc ngoài source code vẫn cần chuẩn bị khi nộp

- Cài dependencies, tạo `server/.env`, tạo `client/.env`, kết nối MongoDB và tự chạy thử ứng dụng trên máy.
- Chép poster gốc từ dự án cũ vào `client/public/posters` nếu muốn giữ nguyên hình ảnh cũ; bản này có SVG minh họa thay thế.
- Thay tài khoản/mật khẩu demo trước khi triển khai công khai.
- Viết báo cáo PDF tối đa 20 trang, quay video demo 5–10 phút và nộp link repository theo yêu cầu giảng viên.
- Triển khai Vercel/Netlify, Render/Railway và MongoDB Atlas nếu nhóm muốn lấy điểm khuyến khích.

## 4. Giới hạn kiểm thử của bản đóng gói

Đã kiểm tra cú pháp JavaScript phía server, phân tích cú pháp JSX phía client và đường dẫn import nội bộ. Chưa chạy `npm install`, chưa chạy Vite/Express với MongoDB thật trong môi trường tạo file này. Vì vậy, nhóm cần thực hiện kiểm thử tích hợp sau khi cài đặt dependencies và kết nối database.
