import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import MovieTrailer from '../components/MovieTrailer';
import SectionTitle from '../components/SectionTitle';

function getDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit'
  });
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/movies/${id}`);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');

  const movie = data?.movie;
  const showtimes = data?.showtimes || [];
  const dateGroups = useMemo(() => {
    const grouped = new Map();
    showtimes.forEach((showtime) => {
      const key = getDateKey(showtime.startAt);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(showtime);
    });
    return Array.from(grouped.entries()).map(([key, items]) => ({
      key,
      date: items[0].startAt,
      showtimes: items.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    }));
  }, [showtimes]);

  useEffect(() => {
    if (!dateGroups.length) {
      setSelectedDate('');
      setSelectedShowtimeId('');
      return;
    }
    const firstDate = dateGroups[0];
    if (!dateGroups.some((group) => group.key === selectedDate)) {
      setSelectedDate(firstDate.key);
      setSelectedShowtimeId(firstDate.showtimes[0]?._id || '');
    }
  }, [dateGroups, selectedDate]);

  const currentGroup = dateGroups.find((group) => group.key === selectedDate) || dateGroups[0];
  const selectedShowtime = currentGroup?.showtimes.find((item) => item._id === selectedShowtimeId)
    || currentGroup?.showtimes[0];
  const roomName = showtimes[0]?.room?.name || selectedShowtime?.room?.name || 'Phòng chiếu';

  const chooseDate = (group) => {
    setSelectedDate(group.key);
    setSelectedShowtimeId(group.showtimes[0]?._id || '');
  };

  if (loading) return <Loading />;
  if (error || !movie) return <div className="container section-block"><ErrorMessage message={error || 'Không tìm thấy phim.'} /></div>;

  return (
    <div className="flow-page movie-detail-page">
      <div className="flow-topbar flow-back-only">
        <Link to="/" className="flow-back" aria-label="Quay lại trang chủ">←</Link>
      </div>

      <section className="detail-panel">
        <img className="detail-poster" src={movie.posterUrl || '/posters/placeholder.svg'} alt={movie.title} />
        <div className="detail-content">
          <span className="eyebrow">{movie.status === 'upcoming' ? 'PHIM SẮP CHIẾU' : 'PHIM ĐANG CHIẾU'}</span>
          <h1>{movie.title}</h1>
          <div className="detail-description-box">
            <span>NỘI DUNG PHIM:</span>
            <p>{movie.description}</p>
          </div>
          <div className="detail-meta-lines">
            {movie.cast && <p><b>Diễn viên:</b> {movie.cast}</p>}
            {movie.director && <p><b>Đạo diễn:</b> {movie.director}</p>}
            <p><b>Thời lượng:</b> {movie.durationMinutes} phút</p>
            <p><b>Khởi chiếu:</b> {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}</p>
            <p><b>Thể loại:</b> {(movie.genre || []).join(', ')}</p>
          </div>

          <div className="detail-showtimes-block">
            <div className="detail-date-tabs" aria-label="Chọn ngày chiếu">
              {dateGroups.map((group) => (
                <button
                  type="button"
                  key={group.key}
                  className={`detail-date-tab ${selectedDate === group.key ? 'active' : ''}`}
                  onClick={() => chooseDate(group)}
                >
                  {formatDate(group.date)}
                </button>
              ))}
            </div>
            <div className="detail-showtime-shell">
              {currentGroup?.showtimes.length ? currentGroup.showtimes.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`detail-showtime-pill ${selectedShowtimeId === item._id ? 'active' : ''}`}
                  onClick={() => setSelectedShowtimeId(item._id)}
                >
                  <b>{formatTime(item.startAt)}</b>
                  <span>{item.room?.name || roomName}</span>
                </button>
              )) : <span className="muted">Chưa có suất chiếu trong ngày này.</span>}
            </div>
            <p className="detail-room-note">Các suất chiếu của phim này được bố trí tại <b>{roomName}</b>.</p>
          </div>

          <button
            type="button"
            className="detail-book-button"
            disabled={!selectedShowtime}
            onClick={() => selectedShowtime && navigate(`/booking/${selectedShowtime._id}`)}
          >
            Đặt Vé Ngay
          </button>
        </div>
      </section>

      <section className="detail-trailer-section">
        <SectionTitle title="Trailer phim" description="Xem trước nội dung phim trước khi đặt vé." />
        <MovieTrailer url={movie.trailerUrl} />
      </section>
    </div>
  );
}
