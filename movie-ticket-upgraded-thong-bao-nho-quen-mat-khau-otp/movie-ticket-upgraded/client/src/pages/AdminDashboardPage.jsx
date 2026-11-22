import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiError } from '../services/api';
import SectionTitle from '../components/SectionTitle';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/stats').then((response) => setStats(response.data.data)).catch((err) => setError(getApiError(err))); }, []);
  return <div className="container section-block"><SectionTitle eyebrow="KHU VỰC QUẢN TRỊ" title="Dashboard" description="Quản lý phim, phòng chiếu, suất chiếu và theo dõi doanh thu."/><div className="admin-links"><Link to="/admin/movies">Quản lý phim →</Link><Link to="/admin/rooms">Quản lý phòng →</Link><Link to="/admin/showtimes">Quản lý suất chiếu →</Link></div><ErrorMessage message={error}/>{!stats ? <Loading/> : <><div className="stat-grid"><div className="stat-card"><span>Vé xác nhận</span><strong>{stats.summary.totalTickets || 0}</strong></div><div className="stat-card"><span>Doanh thu</span><strong>{(stats.summary.revenue || 0).toLocaleString('vi-VN')} đ</strong></div></div><SectionTitle title="Doanh thu theo phim"/><div className="table-wrap"><table><thead><tr><th>Phim</th><th>Số vé</th><th>Doanh thu</th></tr></thead><tbody>{stats.byMovie.map((item) => <tr key={item._id}><td>{item.title}</td><td>{item.tickets}</td><td>{item.revenue.toLocaleString('vi-VN')} đ</td></tr>)}</tbody></table></div><SectionTitle title="Doanh thu theo ngày"/><div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số vé</th><th>Doanh thu</th></tr></thead><tbody>{stats.byDay.map((item) => <tr key={item._id}><td>{item._id}</td><td>{item.tickets}</td><td>{item.revenue.toLocaleString('vi-VN')} đ</td></tr>)}</tbody></table></div></>}</div>;
}
