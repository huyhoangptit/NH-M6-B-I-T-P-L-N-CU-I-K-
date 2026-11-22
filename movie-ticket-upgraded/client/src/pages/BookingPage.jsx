import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api, getApiError } from '../services/api';
import { setShowtime, toggleSeat, clearBooking } from '../store/bookingSlice';
import SeatMap from '../components/SeatMap';
import BookingSummary from '../components/BookingSummary';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function BookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedSeats = useSelector((state) => state.booking.selectedSeats);
  const [showtime, setShowtimeData] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(300);
  const seatMapRef = useRef(null);

  useEffect(() => {
    let active = true;
    dispatch(setShowtime(showtimeId));
    api.get(`/showtimes/${showtimeId}`).then((response) => {
      if (!active) return;
      setShowtimeData(response.data.data.showtime);
      setBookedSeats(response.data.data.bookedSeats || []);
    }).catch((err) => { if (active) setError(getApiError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showtimeId, dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) { dispatch(clearBooking()); navigate('/', { replace: true, state: { message: 'Đã hết 5 phút chọn ghế. Vui lòng chọn suất chiếu lại.' } }); }
  }, [secondsLeft, dispatch, navigate]);

  const handleToggle = (seat) => {
    const exists = selectedSeats.some((item) => item.code === seat.code);
    if (!exists && selectedSeats.length >= 8) { setError('Bạn chỉ được chọn tối đa 8 ghế trong một lần.'); return; }
    const price = seat.type === 'vip' ? showtime.priceVip : showtime.priceNormal;
    dispatch(toggleSeat({ ...seat, price }));
    setError('');
  };
  useEffect(() => {
    if (showtime && seatMapRef.current) seatMapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [showtime]);

  const timer = useMemo(() => `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`, [secondsLeft]);
  if (loading) return <Loading/>;
  if (!showtime) return <div className="container section-block"><ErrorMessage message={error || 'Không tìm thấy suất chiếu.'}/></div>;
  return <div className="container section-block"><div className="booking-heading"><div><span className="eyebrow">CHỌN CHỖ NGỒI</span><h1>{showtime.movie.title}</h1><p className="muted">{showtime.room.name} · {new Date(showtime.startAt).toLocaleString('vi-VN')}</p></div><div className="timer-box"><small>Thời gian chọn ghế</small><strong>{timer}</strong></div></div><ErrorMessage message={error}/><div className="booking-layout"><div ref={seatMapRef}><SeatMap room={showtime.room} bookedSeats={bookedSeats} selectedSeats={selectedSeats} onToggle={handleToggle}/></div><BookingSummary selectedSeats={selectedSeats} showtime={showtime} onContinue={() => navigate('/checkout')}/></div></div>;
}
