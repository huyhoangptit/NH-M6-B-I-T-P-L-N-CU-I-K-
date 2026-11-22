import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { api, getApiError } from '../services/api';
import MovieFilter from '../components/MovieFilter';
import MovieList from '../components/MovieList';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function HomePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('');
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { setPage(1); }, [keyword, status, genre, date]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/movies', { params: { q: keyword, status, genre, date, page, limit: 4 } })
      .then((response) => {
        if (!active) return;
        setMovies(response.data.data.movies || []);
        setPages(response.data.data.pagination.pages || 1);
      })
      .catch((err) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [keyword, status, genre, date, page]);

  const resetPage = (setter) => (value) => { setter(value); setPage(1); };

  return (
    <>
      <section className="hero-banner" aria-labelledby="home-heading">
        <h1 id="home-heading">Phim Chiếu Rạp Hot Nhất Tuần</h1>
        <p>Đặt vé ngay để nhận ưu đãi lên đến 50%</p>
      </section>

      <div className="home-main" id="movies">
        <section className="movie-carousel-wrapper" aria-label="Danh sách phim">
          {location.state?.message && <div className="alert alert-error">{location.state.message}</div>}
          <ErrorMessage message={error} />
          {loading ? <Loading /> : <MovieList movies={movies} />}

          <details className="movie-filter-details">
            <summary>Lọc phim theo thể loại, trạng thái và ngày chiếu</summary>
            <MovieFilter
              status={status}
              genre={genre}
              date={date}
              onStatusChange={resetPage(setStatus)}
              onGenreChange={resetPage(setGenre)}
              onDateChange={resetPage(setDate)}
            />
          </details>

          {pages > 1 && (
            <nav className="pagination home-pagination" aria-label="Phân trang phim">
              {Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={`page-btn ${page === pageNumber ? 'active' : ''}`}
                  aria-current={page === pageNumber ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >{pageNumber}</button>
              ))}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
