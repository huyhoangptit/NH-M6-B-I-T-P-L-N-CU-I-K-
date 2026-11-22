import { Link } from 'react-router-dom';
export default function ShowtimeCard({ showtime }) { return <Link className="showtime-card" to={`/booking/${showtime._id}`}><b>{new Date(showtime.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b><span>{new Date(showtime.startAt).toLocaleDateString('vi-VN')} · {showtime.room?.name}</span></Link>; }
