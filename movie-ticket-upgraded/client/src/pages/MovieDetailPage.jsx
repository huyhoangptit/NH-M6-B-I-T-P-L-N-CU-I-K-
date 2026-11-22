import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import MovieTrailer from '../components/MovieTrailer';
import ShowtimeCard from '../components/ShowtimeCard';
import SectionTitle from '../components/SectionTitle';
export default function MovieDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/movies/${id}`);
  if (loading) return <Loading/>;
  if (error || !data?.movie) return <div className="container section-block"><ErrorMessage message={error || 'Không tìm thấy phim.'}/></div>;
  const { movie, showtimes } = data;
  return <div className="container section-block"><div className="detail-hero"><img className="detail-poster" src={movie.posterUrl || '/posters/placeholder.svg'} alt={movie.title}/><div><span className="eyebrow">{movie.status === 'upcoming' ? 'SẮP CHIẾU' : 'ĐANG CHIẾU'}</span><h1>{movie.title}</h1><p className="muted">{(movie.genre || []).join(' · ')} · {movie.durationMinutes} phút</p><p>{movie.description}</p><p><b>Khởi chiếu:</b> {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}</p></div></div><SectionTitle title="Trailer phim"/><MovieTrailer url={movie.trailerUrl}/><SectionTitle title="Lịch chiếu" description="Chọn suất chiếu để tiếp tục chọn ghế."/><div className="showtime-grid">{showtimes?.length ? showtimes.map((item) => <ShowtimeCard key={item._id} showtime={item}/>) : <div className="empty-state">Chưa có suất chiếu.</div>}</div></div>;
}
