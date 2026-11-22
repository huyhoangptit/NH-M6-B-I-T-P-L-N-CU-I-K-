import { useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import ErrorMessage from '../components/ErrorMessage';

const emptyForm = { movieId: '', roomId: '', startAt: '', endAt: '', priceNormal: 80000, priceVip: 110000 };

function toLocalDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function addMinutesToLocal(value, minutes) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() + minutes);
  return toLocalDateTime(date);
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function localTimeKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function AdminShowtimesPage() {
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  const assignedRoomId = useMemo(() => {
    const movie = movies.find((item) => item._id === form.movieId);
    const existing = showtimes.find((item) => item.movie?._id === form.movieId);
    return movie?.defaultRoom || existing?.room?._id || '';
  }, [movies, showtimes, form.movieId]);

  const load = async () => {
    const [movieResponse, roomResponse, showtimeResponse] = await Promise.all([
      api.get('/movies', { params: { limit: 100 } }),
      api.get('/rooms'),
      api.get('/showtimes', { params: { limit: 500 } })
    ]);
    setMovies(movieResponse.data.data.movies || []);
    setRooms(roomResponse.data.data.rooms || []);
    setShowtimes(showtimeResponse.data.data.showtimes || []);
  };

  useEffect(() => { load().catch((err) => setError(getApiError(err))); }, []);

  useEffect(() => {
    if (assignedRoomId && form.roomId !== assignedRoomId) {
      setForm((current) => ({ ...current, roomId: assignedRoomId }));
    }
  }, [assignedRoomId, form.roomId]);

  const filteredShowtimes = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('vi');
    return showtimes
      .filter((item) => {
        const movieTitle = item.movie?.title || '';
        const roomName = item.room?.name || '';
        const matchesKeyword = !normalized
          || movieTitle.toLocaleLowerCase('vi').includes(normalized)
          || roomName.toLocaleLowerCase('vi').includes(normalized);
        const matchesRoom = roomFilter === 'all' || item.room?._id === roomFilter;
        const day = localDateKey(item.startAt);
        const time = localTimeKey(item.startAt);
        const matchesDateFrom = !dateFrom || day >= dateFrom;
        const matchesDateTo = !dateTo || day <= dateTo;
        const matchesTimeFrom = !timeFrom || time >= timeFrom;
        const matchesTimeTo = !timeTo || time <= timeTo;
        return matchesKeyword && matchesRoom && matchesDateFrom && matchesDateTo && matchesTimeFrom && matchesTimeTo;
      })
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [showtimes, keyword, roomFilter, dateFrom, dateTo, timeFrom, timeTo]);

  const update = (event) => {
    const { name, value } = event.target;
    if (name === 'movieId') {
      const movie = movies.find((item) => item._id === value);
      setForm((old) => ({
        ...old,
        movieId: value,
        roomId: movie?.defaultRoom || '',
        endAt: old.startAt ? addMinutesToLocal(old.startAt, Number(movie?.durationMinutes || 0) + 15) : ''
      }));
      return;
    }
    if (name === 'startAt') {
      const movie = movies.find((item) => item._id === form.movieId);
      setForm((old) => ({
        ...old,
        startAt: value,
        endAt: value && movie ? addMinutesToLocal(value, Number(movie.durationMinutes || 0) + 15) : ''
      }));
      return;
    }
    setForm((old) => ({ ...old, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.startAt || !form.endAt || new Date(form.endAt) <= new Date(form.startAt)) {
      setError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    try {
      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        priceNormal: Number(form.priceNormal),
        priceVip: Number(form.priceVip)
      };
      if (editingId) await api.put(`/showtimes/${editingId}`, payload);
      else await api.post('/showtimes', payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err?.response?.status === 409
        ? (err.response.data.message || 'Phòng chiếu đã được gán cho phim khác hoặc khung giờ bị trùng.')
        : getApiError(err));
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      movieId: item.movie?._id || '',
      roomId: item.room?._id || '',
      startAt: toLocalDateTime(item.startAt),
      endAt: toLocalDateTime(item.endAt),
      priceNormal: item.priceNormal,
      priceVip: item.priceVip
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa suất chiếu?')) return;
    try {
      await api.delete(`/showtimes/${id}`);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };
  const resetFilters = () => {
    setKeyword(''); setRoomFilter('all'); setDateFrom(''); setDateTo(''); setTimeFrom(''); setTimeTo('');
  };

  return (
    <div className="container section-block">
      <SectionTitle title="Quản lý suất chiếu" description="Tạo nhiều khung giờ cho mỗi phim. Một phim chỉ được gán một phòng cố định." />
      <ErrorMessage message={error} />

      <form className="panel admin-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Phim
            <select name="movieId" value={form.movieId} onChange={update} required>
              <option value="">Chọn phim</option>
              {movies.map((movie) => <option value={movie._id} key={movie._id}>{movie.title}</option>)}
            </select>
          </label>
          <label>Phòng chiếu
            <select name="roomId" value={form.roomId} onChange={update} required disabled={Boolean(assignedRoomId)}>
              <option value="">Chọn phòng</option>
              {rooms.map((room) => <option value={room._id} key={room._id}>{room.name}</option>)}
            </select>
            {assignedRoomId && <small className="assigned-room-note">Phim này đã được cố định tại {rooms.find((room) => room._id === assignedRoomId)?.name || 'phòng đã chọn'}.</small>}
          </label>
          <label>Ngày giờ bắt đầu<input type="datetime-local" name="startAt" value={form.startAt} onChange={update} required /></label>
          <label>Ngày giờ kết thúc<input type="datetime-local" name="endAt" value={form.endAt} onChange={update} min={form.startAt || undefined} required /><small className="assigned-room-note">Hệ thống tự gợi ý theo thời lượng phim + 15 phút, Admin có thể chỉnh lại.</small></label>
          <label>Giá ghế thường<input type="number" min="0" name="priceNormal" value={form.priceNormal} onChange={update} required /></label>
          <label>Giá ghế VIP<input type="number" min="0" name="priceVip" value={form.priceVip} onChange={update} required /></label>
        </div>
        <button className="btn btn-primary">{editingId ? 'Lưu thay đổi' : 'Tạo suất chiếu'}</button>
        {editingId && <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Hủy sửa</button>}
      </form>

      <section className="panel admin-filter-panel" aria-label="Bộ lọc suất chiếu">
        <div className="admin-filter-heading">
          <div><h3>Lọc suất chiếu</h3><p>Tìm theo tên phim, phòng, ngày hoặc khoảng giờ bắt đầu.</p></div>
          <span>{filteredShowtimes.length}/{showtimes.length} suất</span>
        </div>
        <div className="admin-filter-grid showtime-filter-grid">
          <label className="filter-search">Tìm phim hoặc phòng<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nhập tên phim hoặc phòng..." /></label>
          <label>Phòng chiếu<select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)}><option value="all">Tất cả phòng</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select></label>
          <label>Từ ngày<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Đến ngày<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label>Từ giờ<input type="time" value={timeFrom} onChange={(event) => setTimeFrom(event.target.value)} /></label>
          <label>Đến giờ<input type="time" value={timeTo} onChange={(event) => setTimeTo(event.target.value)} /></label>
          <button type="button" className="btn btn-ghost filter-reset" onClick={resetFilters}>Xóa bộ lọc</button>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Phim</th><th>Phòng</th><th>Bắt đầu</th><th>Kết thúc</th><th>Giá thường / VIP</th><th></th></tr></thead>
          <tbody>
            {filteredShowtimes.map((item) => (
              <tr key={item._id}>
                <td>{item.movie?.title}</td>
                <td>{item.room?.name}</td>
                <td>{new Date(item.startAt).toLocaleString('vi-VN')}</td>
                <td>{new Date(item.endAt).toLocaleString('vi-VN')}</td>
                <td>{Number(item.priceNormal).toLocaleString('vi-VN')} / {Number(item.priceVip).toLocaleString('vi-VN')} đ</td>
                <td><div className="table-actions"><button className="btn btn-ghost btn-small" onClick={() => edit(item)}>Sửa</button><button className="btn btn-danger btn-small" onClick={() => remove(item._id)}>Xóa</button></div></td>
              </tr>
            ))}
            {!filteredShowtimes.length && <tr><td colSpan="6" className="admin-empty-cell">Không tìm thấy suất chiếu phù hợp với bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
