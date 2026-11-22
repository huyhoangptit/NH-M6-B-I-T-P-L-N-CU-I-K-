import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  return <header className="site-header"><div className="container nav-wrap">
    <Link to="/" className="brand"><span className="brand-mark">C</span><span>Cine<span className="accent">Ticket</span></span></Link>
    <nav className="main-nav" aria-label="Điều hướng chính">
      <NavLink to="/" end>Trang chủ</NavLink>
      <a href="/#movies">Phim</a>
      {user && <NavLink to="/history">Vé của tôi</NavLink>}
      {user?.role === 'admin' && <NavLink to="/admin">Quản trị</NavLink>}
    </nav>
    <div className="nav-actions"><button className="btn btn-ghost btn-small theme-toggle" type="button" onClick={onToggleTheme} aria-label="Đổi giao diện">{theme === 'dark' ? 'Sáng' : 'Tối'}</button>
      {user ? <><span className="user-name">Xin chào, {user.name}</span><button className="btn btn-ghost btn-small" onClick={handleLogout}>Đăng xuất</button></> : <><Link className="btn btn-ghost btn-small" to="/login">Đăng nhập</Link><Link className="btn btn-primary btn-small" to="/register">Đăng ký</Link></>}
    </div>
  </div></header>;
}
