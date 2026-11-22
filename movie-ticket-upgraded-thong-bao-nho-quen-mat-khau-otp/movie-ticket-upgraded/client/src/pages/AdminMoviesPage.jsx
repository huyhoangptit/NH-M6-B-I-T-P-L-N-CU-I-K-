import { useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import ErrorMessage from '../components/ErrorMessage';

const blankForm = {
  title: '', description: '', genre: 'Hành động', durationMinutes: 110,
  releaseDate: '', status: 'now', posterUrl: '/posters/placeholder.svg', trailerUrl: ''
};

export default function AdminMoviesPage() {
  const [form, setForm] = useState(blankForm);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');

  const load = async () => {
    const response = await api.get('/movies', { params: { limit: 100 } });
    setMovies(response.data.data.movies || []);
  };

  useEffect(() => { load().catch((err) => setError(getApiError(err))); }, []);

  const genres = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.genre || []))].sort((a, b) => a.localeCompare(b, 'vi')),
    [movies]
  );

  const filteredMovies = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('vi');
    return movies.filter((movie) => {
      const matchesKeyword = !normalized
        || movie.title?.toLocaleLowerCase('vi').includes(normalized)
        || (movie.genre || []).some((genre) => genre.toLocaleLowerCase('vi').includes(normalized));
      const matchesStatus = statusFilter === 'all' || movie.status === statusFilter;
      const matchesGenre = genreFilter === 'all' || (movie.genre || []).includes(genreFilter);
      return matchesKeyword && matchesStatus && matchesGenre;
    });
  }, [movies, keyword, statusFilter, genreFilter]);

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        genre: form.genre.split(',').map((item) => item.trim()).filter(Boolean)
      };
      if (editingId) await api.put(`/movies/${editingId}`, payload);
      else await api.post('/movies', payload);
      setForm(blankForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const edit = (movie) => {
    setEditingId(movie._id);
    setForm({
      title: movie.title,
      description: movie.description,
      genre: (movie.genre || []).join(', '),
      durationMinutes: movie.durationMinutes,
      releaseDate: new Date(movie.releaseDate).toISOString().slice(0, 10),
      status: movie.status,
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa phim này?')) return;
    try {
      await api.delete(`/movies/${id}`);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const resetFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setGenreFilter('all');
  };

  return (
    <div className="container section-block">
      <SectionTitle title="Quản lý phim" description="Thêm, sửa, xóa và lọc danh sách phim nhanh chóng." />
      <ErrorMessage message={error} />

      <form className="panel admin-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Tên phim<input name="title" value={form.title} onChange={update} required /></label>
          <label>Thể loại<input name="genre" value={form.genre} onChange={update} placeholder="Hành động, Hoạt hình" required /></label>
          <label>Thời lượng (phút)<input name="durationMinutes" type="number" min="1" value={form.durationMinutes} onChange={update} required /></label>
          <label>Ngày khởi chiếu<input name="releaseDate" type="date" value={form.releaseDate} onChange={update} required /></label>
          <label>Trạng thái<select name="status" value={form.status} onChange={update}><option value="now">Đang chiếu</option><option value="upcoming">Sắp chiếu</option></select></label>
          <label>Poster URL<input name="posterUrl" value={form.posterUrl} onChange={update} /></label>
          <label className="wide">Trailer YouTube URL<input name="trailerUrl" value={form.trailerUrl} onChange={update} /></label>
          <label className="wide">Mô tả<textarea name="description" value={form.description} onChange={update} rows="3" required /></label>
        </div>
        <button className="btn btn-primary">{editingId ? 'Lưu thay đổi' : 'Thêm phim'}</button>
        {editingId && <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(blankForm); }}>Hủy sửa</button>}
      </form>

      <section className="panel admin-filter-panel" aria-label="Bộ lọc phim">
        <div className="admin-filter-heading">
          <div><h3>Lọc phim</h3><p>Tìm theo tên, thể loại hoặc trạng thái.</p></div>
          <span>{filteredMovies.length}/{movies.length} phim</span>
        </div>
        <div className="admin-filter-grid">
          <label className="filter-search">Tìm tên phim<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nhập tên phim hoặc thể loại..." /></label>
          <label>Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="now">Đang chiếu</option><option value="upcoming">Sắp chiếu</option></select></label>
          <label>Thể loại<select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}><option value="all">Tất cả thể loại</option>{genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select></label>
          <button type="button" className="btn btn-ghost filter-reset" onClick={resetFilters}>Xóa bộ lọc</button>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Phim</th><th>Thể loại</th><th>Trạng thái</th><th>Thời lượng</th><th></th></tr></thead>
          <tbody>
            {filteredMovies.map((movie) => (
              <tr key={movie._id}>
                <td>{movie.title}</td>
                <td>{(movie.genre || []).join(', ')}</td>
                <td>{movie.status === 'upcoming' ? 'Sắp chiếu' : 'Đang chiếu'}</td>
                <td>{movie.durationMinutes} phút</td>
                <td><div className="table-actions"><button className="btn btn-ghost btn-small" onClick={() => edit(movie)}>Sửa</button><button className="btn btn-danger btn-small" onClick={() => remove(movie._id)}>Xóa</button></div></td>
              </tr>
            ))}
            {!filteredMovies.length && <tr><td colSpan="5" className="admin-empty-cell">Không tìm thấy phim phù hợp với bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
