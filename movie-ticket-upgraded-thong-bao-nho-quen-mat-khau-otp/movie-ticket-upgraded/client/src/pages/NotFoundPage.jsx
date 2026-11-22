import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <div className="container not-found"><strong>404</strong><h1>Không tìm thấy trang</h1><p>Đường dẫn bạn truy cập không tồn tại.</p><Link className="btn btn-primary" to="/">Về trang chủ</Link></div>; }
