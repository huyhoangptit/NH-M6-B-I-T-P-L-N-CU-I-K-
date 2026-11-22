export default function Loading({ text = 'Đang tải dữ liệu...' }) { return <div className="state-message" role="status"><span className="spinner" />{text}</div>; }
