import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setKeyword(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (event) => {
    event.preventDefault();
    const value = keyword.trim();
    navigate(value ? `/?q=${encodeURIComponent(value)}` : '/');
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="top-header">
      <Link to="/" className="logo" aria-label="HTH - Trang chủ">HTH</Link>

      <form className="search-bar" onSubmit={handleSearch} role="search">
        <input
          id="movie-search"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm kiếm tên phim, rạp..."
          aria-label="Tìm kiếm tên phim hoặc rạp"
        />
        <button type="submit" aria-label="Tìm kiếm">🔍</button>
      </form>

      <div className="user-account-section">
        {user ? (
          <div className="user-profile-group">
            <button
              type="button"
              className="avatar-icon"
              aria-label="Mở menu tài khoản"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >👤</button>
            {menuOpen && (
              <div className="dropdown-menu show">
                <div className="dropdown-header">Chào, <strong>{user.name}</strong></div>
                <Link to="/history" onClick={() => setMenuOpen(false)}>Lịch sử vé đã mua</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Trang quản trị</Link>}
                <button type="button" className="dropdown-logout" onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" id="login-text-btn">Đăng ký / Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}
