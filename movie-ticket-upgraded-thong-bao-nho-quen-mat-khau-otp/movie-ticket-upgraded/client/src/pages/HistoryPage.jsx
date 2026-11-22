import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
export default function HistoryPage() {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const location = useLocation();
  const load = async () => { try { const response = await api.get('/bookings/my'); setBookings(response.data.data.bookings); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { if (!window.confirm('Bạn chắc chắn muốn hủy vé này?')) return; try { await api.patch(`/bookings/${id}/cancel`); await load(); } catch (err) { setError(getApiError(err)); } };
  return <div className="container section-block"><SectionTitle eyebrow="TÀI KHOẢN" title="Lịch sử vé" description="Vé đã xác nhận và trạng thái hủy của bạn."/>{location.state?.success && <div className="alert alert-success">{location.state.success}</div>}<ErrorMessage message={error}/>{loading ? <Loading/> : bookings.length ? <div className="ticket-list">{bookings.map((booking) => { const start = new Date(booking.showtime?.startAt); const canCancel = booking.status === 'confirmed' && start.getTime() - Date.now() >= 2 * 60 * 60 * 1000; return <article className="ticket-card" key={booking._id}><div><span className="eyebrow">MÃ VÉ {booking.ticketCode}</span><h3>{booking.showtime?.movie?.title || 'Phim'}</h3><p>{start.toLocaleString('vi-VN')} · {booking.showtime?.room?.name}</p><p>Ghế: {booking.seats.map((seat) => seat.code).join(', ')}</p></div><div className="ticket-side"><b>{booking.total.toLocaleString('vi-VN')} đ</b><span className={`status-pill ${booking.status}`}>{booking.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}</span>{canCancel && <button className="btn btn-danger btn-small" onClick={() => cancel(booking._id)}>Hủy vé</button>}</div></article>; })}</div> : <div className="empty-state">Bạn chưa có vé nào.</div>}</div>;
}
