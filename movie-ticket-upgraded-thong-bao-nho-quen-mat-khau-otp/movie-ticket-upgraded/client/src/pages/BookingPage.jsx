import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
    }).catch((err) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showtimeId, dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      dispatch(clearBooking());
      navigate('/', { replace: true, state: { message: 'Đã hết 5 phút chọn ghế. Vui lòng chọn suất chiếu lại.' } });
    }
  }, [secondsLeft, dispatch, navigate]);

  const handleToggle = (seat) => {
    const exists = selectedSeats.some((item) => item.code === seat.code);
    if (!exists && selectedSeats.length >= 8) {
      setError('Bạn chỉ được chọn tối đa 8 ghế trong một lần.');
      return;
    }
    const price = seat.type === 'vip' ? showtime.priceVip : showtime.priceNormal;
    dispatch(toggleSeat({ ...seat, price }));
    setError('');
  };

  useEffect(() => {
    if (showtime && seatMapRef.current) seatMapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [showtime]);

  const timer = useMemo(() => `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`, [secondsLeft]);
  if (loading) return <Loading />;
  if (!showtime) return <div className="container section-block"><ErrorMessage message={error || 'Không tìm thấy suất chiếu.'} /></div>;

  return (
    <div className="flow-page booking-page">
      <div className="flow-topbar flow-topbar-centered">
        <Link to={`/movies/${showtime.movie._id}`} className="flow-back" aria-label="Quay lại giới thiệu phim">←</Link>
        <h1>Chọn Ghế</h1>
      </div>
      <div className="booking-info-strip">
        <span>🎬 PHIM <b>{showtime.movie.title}</b></span>
        <i />
        <span>◷ GIỜ CHIẾU <b>{new Date(showtime.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b></span>
        <i />
        <span>▣ PHÒNG CHIẾU <b>{showtime.room.name}</b></span>
        <i />
        <span className="booking-time-left">Còn lại <b>{timer}</b></span>
      </div>
      <div className="booking-flow-column">
        <ErrorMessage message={error} />
        <div ref={seatMapRef}>
          <SeatMap room={showtime.room} bookedSeats={bookedSeats} selectedSeats={selectedSeats} onToggle={handleToggle} />
        </div>
        <BookingSummary selectedSeats={selectedSeats} showtime={showtime} onContinue={() => navigate('/checkout')} />
      </div>
    </div>
  );
}
