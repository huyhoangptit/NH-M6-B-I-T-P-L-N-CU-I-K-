import { useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import ErrorMessage from '../components/ErrorMessage';

const blankForm = { name: '', rows: 6, seatsPerRow: 8, vipRows: 'E,F' };

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');

  const load = async () => {
    const response = await api.get('/rooms');
    setRooms(response.data.data.rooms || []);
  };

  useEffect(() => { load().catch((err) => setError(getApiError(err))); }, []);

  const filteredRooms = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('vi');
    return rooms.filter((room) => {
      const searchable = `${room.name} ${room.rows}x${room.seatsPerRow} ${(room.vipRows || []).join(' ')}`.toLocaleLowerCase('vi');
      const matchesKeyword = !normalized || searchable.includes(normalized);
      const seats = Number(room.rows) * Number(room.seatsPerRow);
      const matchesSize = sizeFilter === 'all'
        || (sizeFilter === 'small' && seats <= 50)
        || (sizeFilter === 'medium' && seats > 50 && seats <= 100)
        || (sizeFilter === 'large' && seats > 100);
      return matchesKeyword && matchesSize;
    });
  }, [rooms, keyword, sizeFilter]);

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        rows: Number(form.rows),
        seatsPerRow: Number(form.seatsPerRow),
        vipRows: form.vipRows.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean)
      };
      if (editingId) await api.put(`/rooms/${editingId}`, payload);
      else await api.post('/rooms', payload);
      setForm(blankForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const edit = (room) => {
    setEditingId(room._id);
    setForm({ name: room.name, rows: room.rows, seatsPerRow: room.seatsPerRow, vipRows: (room.vipRows || []).join(',') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa phòng chiếu?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <div className="container section-block">
      <SectionTitle title="Quản lý phòng chiếu" description="Cấu hình số hàng, số ghế và hàng ghế VIP. Sơ đồ ghế sẽ được sinh tự động từ dữ liệu này." />
      <ErrorMessage message={error} />
      <form className="panel admin-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Tên phòng<input name="name" value={form.name} onChange={update} required /></label>
          <label>Số hàng<input name="rows" type="number" min="1" max="26" value={form.rows} onChange={update} required /></label>
          <label>Số ghế mỗi hàng<input name="seatsPerRow" type="number" min="1" max="30" value={form.seatsPerRow} onChange={update} required /></label>
          <label>Hàng VIP (phân cách dấu phẩy)<input name="vipRows" value={form.vipRows} onChange={update} /></label>
        </div>
        <button className="btn btn-primary">{editingId ? 'Lưu thay đổi' : 'Thêm phòng'}</button>
        {editingId && <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(blankForm); }}>Hủy sửa</button>}
      </form>

      <section className="panel admin-filter-panel" aria-label="Bộ lọc phòng chiếu">
        <div className="admin-filter-heading">
          <div><h3>Lọc phòng chiếu</h3><p>Tìm nhanh theo tên phòng, kích thước hoặc hàng VIP.</p></div>
          <span>{filteredRooms.length}/{rooms.length} phòng</span>
        </div>
        <div className="admin-filter-grid room-filter-grid">
          <label className="filter-search">Tìm phòng<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ví dụ: Phòng 2, 6x8, hàng E..." /></label>
          <label>Sức chứa<select value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value)}><option value="all">Tất cả sức chứa</option><option value="small">Tối đa 50 ghế</option><option value="medium">51–100 ghế</option><option value="large">Trên 100 ghế</option></select></label>
          <button type="button" className="btn btn-ghost filter-reset" onClick={() => { setKeyword(''); setSizeFilter('all'); }}>Xóa bộ lọc</button>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Phòng</th><th>Kích thước</th><th>Sức chứa</th><th>Hàng VIP</th><th></th></tr></thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room._id}>
                <td>{room.name}</td>
                <td>{room.rows} × {room.seatsPerRow}</td>
                <td>{room.rows * room.seatsPerRow} ghế</td>
                <td>{(room.vipRows || []).join(', ')}</td>
                <td><div className="table-actions"><button className="btn btn-ghost btn-small" onClick={() => edit(room)}>Sửa</button><button className="btn btn-danger btn-small" onClick={() => remove(room._id)}>Xóa</button></div></td>
              </tr>
            ))}
            {!filteredRooms.length && <tr><td colSpan="5" className="admin-empty-cell">Không tìm thấy phòng phù hợp với bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
