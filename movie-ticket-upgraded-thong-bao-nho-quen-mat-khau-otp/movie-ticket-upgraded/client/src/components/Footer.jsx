export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <h3>HTH - Hệ Thống Rạp Chiếu Phim</h3>
        <p>Đặt vé xem phim nhanh chóng và thuận tiện.</p>
        <small>© {new Date().getFullYear()} HTH Cinema.</small>
      </div>
    </footer>
  );
}
