import { useMemo } from 'react';

export default function BookingSummary({ selectedSeats, showtime, onContinue }) {
  const total = useMemo(() => selectedSeats.reduce((sum, seat) => sum + seat.price, 0), [selectedSeats]);
  return (
    <aside className="booking-summary booking-summary-bottom">
      <p>Số ghế đã chọn: <b>{selectedSeats.length}</b></p>
      <strong className="booking-summary-total">Tổng tiền: {total.toLocaleString('vi-VN')} VNĐ</strong>
      <button className="btn btn-primary" disabled={!selectedSeats.length} onClick={onContinue}>Tiếp Tục Thanh Toán</button>
      <small>Giá vé thường: {showtime.priceNormal.toLocaleString('vi-VN')} đ · Ghế VIP: {showtime.priceVip.toLocaleString('vi-VN')} đ</small>
    </aside>
  );
}
