import SeatButton from './SeatButton';
export default function SeatMap({ room, bookedSeats, selectedSeats, onToggle }) {
  if (!room) return null;
  const rowNames = Array.from({ length: room.rows }, (_, index) => String.fromCharCode(65 + index));
  return <div className="seat-area"><div className="screen-label">MÀN HÌNH</div><div className="seat-map">{rowNames.map((row) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{Array.from({ length: room.seatsPerRow }, (_, index) => {
    const code = `${row}${index + 1}`;
    const type = (room.vipRows || []).includes(row) ? 'vip' : 'normal';
    return <SeatButton key={code} code={code} type={type} booked={bookedSeats.includes(code)} selected={selectedSeats.some((seat) => seat.code === code)} onClick={() => onToggle({ code, type })} />;
  })}</div>)}</div><div className="seat-legend"><span><i className="legend-seat" /> Ghế thường</span><span><i className="legend-seat vip" /> Ghế VIP</span><span><i className="legend-seat selected" /> Đang chọn</span><span><i className="legend-seat booked" /> Đã bán</span></div></div>;
}
