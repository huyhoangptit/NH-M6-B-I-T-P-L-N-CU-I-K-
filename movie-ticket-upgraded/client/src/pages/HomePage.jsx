import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import SearchBar from '../components/SearchBar';
import MovieFilter from '../components/MovieFilter';
import MovieList from '../components/MovieList';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function HomePage() {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [genre, setGenre] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await api.get('/movies', { params: { q: keyword, status, genre, date, page, limit: 8 } });
        if (active) { setMovies(response.data.data.movies); setPages(response.data.data.pagination.pages); }
      } catch (err) { if (active) setError(getApiError(err)); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [keyword, status, genre, date, page]);

  const changeFilter = (setter) => (value) => { setter(value); setPage(1); };
  return <>
    <section className="hero"><div className="container hero-content"><span className="eyebrow">RẠP PHIM TRỰC TUYẾN</span><h1>Chọn phim hay.<br/><span>Đặt ghế ngay.</span></h1><p>Khám phá lịch chiếu, chọn chỗ ngồi yêu thích và xác nhận vé chỉ với vài thao tác.</p><a className="btn btn-primary" href="#movies">Khám phá phim đang chiếu</a></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></section>
    <section className="container section-block" id="movies">{location.state?.message && <div className="alert alert-error">{location.state.message}</div>}<SectionTitle eyebrow="PHIM TẠI RẠP" title="Phim dành cho bạn" description="Tìm kiếm và lọc phim theo tên, thể loại hoặc trạng thái."/><div className="toolbar"><SearchBar value={keyword} onChange={changeFilter(setKeyword)} /><MovieFilter status={status} genre={genre} date={date} onStatusChange={changeFilter(setStatus)} onGenreChange={changeFilter(setGenre)} onDateChange={changeFilter(setDate)} /></div><ErrorMessage message={error}/>{loading ? <Loading/> : <MovieList movies={movies}/>}<div className="pagination"><button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trang trước</button><span>Trang {page}/{pages}</span><button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Trang sau</button></div></section>
  </>;
}
