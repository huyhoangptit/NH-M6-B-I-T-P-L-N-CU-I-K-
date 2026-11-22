import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api, getApiError } from '../services/api';
import { clearBooking } from '../store/bookingSlice';
import ErrorMessage from '../components/ErrorMessage';
export default function CheckoutPage() {
  const seats = useSelector((state) => state.booking.selectedSeats);
  const showtimeId = useSelector((state) => state.booking.showtimeId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const total = seats.reduce((sum, seat) => sum + seat.price, 0);
  const confirmBooking = async () => {
    setLoading(true); setError('');
    try {
      const response = await api.post('/bookings', { showtimeId, seats: seats.map((seat) => seat.code) });
      dispatch(clearBooking());
      navigate('/history', { replace: true, state: { success: `Đặt vé thành công. Mã vé: ${response.data.data.booking.ticketCode}` } });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) setError(`Một hoặc nhiều ghế đã được đặt: ${(err.response.data.conflictSeats || []).join(', ')}. Vui lòng quay lại chọn ghế khác.`);
      else setError(getApiError(err));
    } finally { setLoading(false); }
  };
  if (!seats.length || !showtimeId) return <div className="container section-block"><div className="empty-state">Bạn chưa chọn ghế. <button className="text-button" onClick={() => navigate('/')}>Quay lại trang phim</button></div></div>;
  return <div className="container narrow section-block"><span className="eyebrow">XÁC NHẬN</span><h1>Hoàn tất đặt vé</h1><p className="muted">Đề bài không yêu cầu thanh toán thật. Khi xác nhận, vé sẽ được ghi vào cơ sở dữ liệu với trạng thái đã xác nhận.</p><div className="panel"><div className="summary-line"><span>Ghế</span><b>{seats.map((seat) => seat.code).join(', ')}</b></div><div className="summary-total"><span>Tổng tiền</span><strong>{total.toLocaleString('vi-VN')} đ</strong></div><ErrorMessage message={error}/><button className="btn btn-primary btn-block" disabled={loading} onClick={confirmBooking}>{loading ? 'Đang xác nhận...' : 'Xác nhận đặt vé'}</button><button className="btn btn-ghost btn-block" onClick={() => navigate(-1)}>Quay lại chọn ghế</button></div></div>;
}
