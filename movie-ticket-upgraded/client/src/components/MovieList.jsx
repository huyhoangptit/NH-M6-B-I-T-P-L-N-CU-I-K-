import MovieCard from './MovieCard';
export default function MovieList({ movies = [] }) {
  if (!movies.length) return <div className="empty-state">Không tìm thấy phim phù hợp.</div>;
  return <div className="movie-grid">{movies.map((movie) => <MovieCard key={movie._id} movie={movie} />)}</div>;
}
