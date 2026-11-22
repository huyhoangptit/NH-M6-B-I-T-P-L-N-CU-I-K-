import { Link } from 'react-router-dom';
export default function MovieCard({ movie }) {
  return <article className="movie-card"><Link to={`/movies/${movie._id}`} className="poster-wrap"><img src={movie.posterUrl || '/posters/placeholder.svg'} alt={`Poster ${movie.title}`} onError={(event) => { event.currentTarget.src = '/posters/placeholder.svg'; }} /><span className="poster-status">{movie.status === 'upcoming' ? 'Sắp chiếu' : 'Đang chiếu'}</span></Link><div className="movie-card-content"><h3><Link to={`/movies/${movie._id}`}>{movie.title}</Link></h3><p>{(movie.genre || []).join(' · ')} · {movie.durationMinutes} phút</p><Link className="text-link" to={`/movies/${movie._id}`}>Xem chi tiết <span aria-hidden="true">→</span></Link></div></article>;
}
