export default function SeatButton({ code, type, booked, selected, onClick }) {
  return (
    <button
      type="button"
      className={`seat ${type} ${booked ? 'booked' : ''} ${selected ? 'selected' : ''}`}
      disabled={booked}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Ghế ${code}${booked ? ', đã bán' : selected ? ', đang chọn' : ''}`}
      title={code}
    >
      {code.slice(1)}
    </button>
  );
}
