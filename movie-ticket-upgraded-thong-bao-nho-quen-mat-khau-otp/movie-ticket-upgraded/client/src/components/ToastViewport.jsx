import { useEffect, useRef, useState } from 'react';

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const handleToast = (event) => {
      const detail = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast = {
        id,
        kind: detail.kind || (Number(detail.status) >= 400 ? 'error' : 'success'),
        status: detail.status ?? 'NETWORK',
        title: detail.title || '',
        message: detail.message || 'Đã xảy ra lỗi không xác định.',
        operation: detail.operation || ''
      };

      setToasts((current) => [...current, toast].slice(-3));
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, toast.kind === 'success' ? 4800 : 6800);
      timers.current.set(id, timer);
    };

    window.addEventListener('cineticket:http-toast', handleToast);
    return () => {
      window.removeEventListener('cineticket:http-toast', handleToast);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  const dismiss = (id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="http-toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <section
          className={`http-toast http-toast-${toast.kind}`}
          key={toast.id}
          role={toast.kind === 'success' ? 'status' : 'alert'}
        >
          {toast.kind === 'success' ? (
            <div className="http-toast-success-content">
              <strong>{toast.message}</strong>
            </div>
          ) : (
            <div className="http-toast-error-content">
              <div className="http-toast-error-heading">
                <span className="http-toast-code">{toast.status === 'NETWORK' ? 'MẠNG' : `HTTP ${toast.status}`}</span>
                <strong>{toast.title || 'Thao tác không thành công'}</strong>
              </div>
              <p>{toast.message}</p>
              {toast.operation && <small>Thao tác: {toast.operation}</small>}
            </div>
          )}
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Đóng thông báo">×</button>
        </section>
      ))}
    </div>
  );
}
