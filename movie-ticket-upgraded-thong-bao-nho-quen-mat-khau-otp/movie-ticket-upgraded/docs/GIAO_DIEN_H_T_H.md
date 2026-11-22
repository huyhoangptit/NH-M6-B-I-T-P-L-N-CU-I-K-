# Cập nhật giao diện HTH

Bản này dùng lại poster JPG trong thư mục `images` của dự án gốc. Trang chủ React được bố trí theo giao diện HTH: header đen, logo đỏ, ô tìm kiếm ở giữa, tài khoản bên phải, banner đỏ-đen và khung phim có bốn poster mỗi hàng.

Các file được chỉnh sửa chính:
- `client/src/components/Header.jsx`: logo, ô tìm kiếm, tài khoản và menu người dùng.
- `client/src/pages/HomePage.jsx`: banner, danh sách phim, bộ lọc thu gọn và phân trang.
- `client/src/styles.css`: màu sắc và kích thước giao diện HTH.
- `client/public/posters/*.jpg`: ảnh poster gốc.
- `server/scripts/seed.js`: dữ liệu phim và đường dẫn poster gốc.

Chạy `npm run seed` trong thư mục `server` sau khi MongoDB đã hoạt động để nạp lại dữ liệu mẫu. Lưu ý lệnh seed xóa dữ liệu trong database `cineticket` trước khi tạo dữ liệu mới.

## Các màn hình quy trình đặt vé được cập nhật

- Chi tiết phim: bố cục poster trái, nội dung phim và lịch chiếu bên phải; chọn ngày trước rồi chọn giờ.
- Chọn ghế: bố cục dọc ở giữa trang; ghế đã chọn có viền sáng nhấp nháy.
- Xác nhận thanh toán: chia thành khối thông tin người đặt và hóa đơn; yêu cầu họ tên, số điện thoại, email.
- Mỗi phim dùng cố định một phòng; các khung giờ trong ngày thuộc cùng phòng đó.
