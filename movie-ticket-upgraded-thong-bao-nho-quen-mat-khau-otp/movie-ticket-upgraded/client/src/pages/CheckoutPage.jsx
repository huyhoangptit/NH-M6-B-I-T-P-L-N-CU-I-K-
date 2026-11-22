import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { api, getApiError } from '../services/api';
import { clearBooking } from '../store/bookingSlice';
import ErrorMessage from '../components/ErrorMessage';

const initialCustomer = { name: '', phone: '', email: '' };

export default function CheckoutPage() {
  const seats = useSelector((state) => state.booking.selectedSeats);
  const showtimeId = useSelector((state) => state.booking.showtimeId);
  const { user } = useAuth();
  const [customer, setCustomer] = useState(initialCustomer);
  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const total = useMemo(() => seats.reduce((sum, seat) => sum + seat.price, 0), [seats]);

  useEffect(() => {
    setCustomer((current) => ({
      ...current,
      name: current.name || user?.name || '',
      email: current.email || user?.email || ''
    }));
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!showtimeId) {
      setLoadingDetails(false);
      return () => { active = false; };
    }
    api.get(`/showtimes/${showtimeId}`)
      .then((response) => { if (active) setShowtime(response.data.data.showtime); })
      .catch((err) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoadingDetails(false); });
    return () => { active = false; };
  }, [showtimeId]);

  const updateCustomer = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const confirmBooking = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/bookings', {
        showtimeId,
        seats: seats.map((seat) => seat.code),
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim()
        }
      });
      dispatch(clearBooking());
      navigate('/history', {
        replace: true,
        state: { success: `Đặt vé thành công. Mã vé: ${response.data.data.booking.ticketCode}` }
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setError(`Một hoặc nhiều ghế đã được đặt: ${(err.response.data.conflictSeats || []).join(', ')}. Vui lòng quay lại chọn ghế khác.`);
      } else setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!seats.length || !showtimeId) {
    return <div className="flow-page"><div className="flow-topbar flow-topbar-centered"><Link to="/" className="flow-back">←</Link><h1>Xác Nhận Thanh Toán</h1></div><div className="container section-block"><div className="empty-state">Bạn chưa chọn ghế. <button className="text-button" onClick={() => navigate('/')}>Quay lại trang phim</button></div></div></div>;
  }

  return (
    <div className="flow-page checkout-page">
      <div className="flow-topbar flow-topbar-centered">
        <button type="button" className="flow-back" onClick={() => navigate(-1)} aria-label="Quay lại chọn ghế">←</button>
        <h1>Xác Nhận Thanh Toán</h1>
      </div>

      <form className="checkout-layout" onSubmit={confirmBooking}>
        <section className="checkout-customer-card">
          <h2>Thông tin người đặt</h2>
          <div className="checkout-fields">
            <label>
              Họ và Tên
              <input name="name" value={customer.name} onChange={updateCustomer} placeholder="Nhập họ tên của bạn" minLength="2" maxLength="80" required />
            </label>
            <label>
              Số điện thoại
              <input name="phone" value={customer.phone} onChange={updateCustomer} placeholder="Nhập số điện thoại" type="tel" inputMode="tel" pattern="[0-9+ .()-]{9,18}" required />
            </label>
            <label>
              Email (Nhận vé điện tử)
              <input name="email" value={customer.email} onChange={updateCustomer} placeholder="Nhập email" type="email" required />
            </label>
          </div>
        </section>

        <aside className="checkout-invoice-card">
          <h2>Hóa Đơn Của Bạn</h2>
          {loadingDetails ? <p className="muted">Đang tải thông tin suất chiếu...</p> : (
            <>
              <p><b>Phim:</b> {showtime?.movie?.title || '—'}</p>
              <p><b>Giờ chiếu:</b> {showtime ? new Date(showtime.startAt).toLocaleString('vi-VN') : '—'}</p>
              <p><b>Rạp:</b> HTH Cinema – {showtime?.room?.name || '—'}</p>
              <div className="invoice-divider" />
              <p><b>Ghế đã chọn:</b> <strong className="invoice-seats">{seats.map((seat) => seat.code).join(', ')}</strong></p>
              <p><b>Số lượng:</b> {seats.length} vé</p>
              <div className="invoice-divider" />
              <h3>Tổng thanh toán:</h3>
              <strong className="invoice-total">{total.toLocaleString('vi-VN')} VNĐ</strong>
            </>
          )}
          <ErrorMessage message={error} />
          <button className="checkout-confirm-button" type="submit" disabled={loading || loadingDetails || !showtime}>
            {loading ? 'Đang xác nhận...' : 'Xác Nhận Đặt Vé'}
          </button>
          <p className="checkout-note">Không yêu cầu thanh toán trực tuyến. Vé được xác nhận sau khi hệ thống lưu đặt vé thành công.</p>
        </aside>
      </form>
    </div>
  );
}
