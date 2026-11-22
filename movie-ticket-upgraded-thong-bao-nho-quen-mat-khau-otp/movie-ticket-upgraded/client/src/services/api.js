import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000
});

const HTTP_ERROR_FALLBACKS = {
  400: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra thông tin và thử lại.',
  401: 'Bạn cần đăng nhập lại để thực hiện thao tác này.',
  403: 'Tài khoản hiện tại không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu cần thao tác. Có thể dữ liệu đã bị xóa hoặc đường dẫn không còn tồn tại.',
  409: 'Dữ liệu đang bị xung đột. Vui lòng tải lại danh sách và kiểm tra trước khi thử lại.',
  500: 'Máy chủ gặp sự cố khi xử lý yêu cầu. Vui lòng thử lại sau.'
};

function cleanPath(config) {
  return String(config?.url || '').split('?')[0].replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}

function getResourceName(path) {
  if (path.includes('/auth/login')) return 'đăng nhập';
  if (path.includes('/auth/register')) return 'đăng ký tài khoản';
  if (path.includes('/auth/forgot-password/request-otp')) return 'yêu cầu gửi mã OTP';
  if (path.includes('/auth/forgot-password/verify-otp')) return 'xác thực mã OTP';
  if (path.includes('/auth/forgot-password/reset-password')) return 'đặt lại mật khẩu';
  if (path.includes('/bookings')) return 'vé';
  if (path.includes('/showtimes')) return 'suất chiếu';
  if (path.includes('/movies')) return 'phim';
  if (path.includes('/rooms')) return 'phòng chiếu';
  if (path.includes('/admin/stats')) return 'thống kê doanh thu';
  return 'dữ liệu';
}

function getOperation(method, path) {
  if (path.includes('/auth/login')) return 'Đăng nhập';
  if (path.includes('/auth/register')) return 'Đăng ký tài khoản';
  if (path.includes('/auth/forgot-password/request-otp')) return 'Gửi mã OTP khôi phục mật khẩu';
  if (path.includes('/auth/forgot-password/verify-otp')) return 'Xác thực mã OTP';
  if (path.includes('/auth/forgot-password/reset-password')) return 'Cập nhật mật khẩu mới';
  if (path.includes('/bookings') && path.includes('/cancel')) return 'Hủy vé';
  if (path === '/bookings' || path.endsWith('/bookings')) return method === 'POST' ? 'Đặt vé' : 'Tải danh sách vé';

  const resource = getResourceName(path);
  if (method === 'POST') {
    if (resource === 'phim') return 'Thêm phim';
    if (resource === 'phòng chiếu') return 'Thêm phòng chiếu';
    if (resource === 'suất chiếu') return 'Tạo suất chiếu';
    return `Tạo ${resource}`;
  }
  if (method === 'PUT' || method === 'PATCH') {
    if (resource === 'phim') return 'Cập nhật phim';
    if (resource === 'phòng chiếu') return 'Cập nhật phòng chiếu';
    if (resource === 'suất chiếu') return 'Cập nhật suất chiếu';
    if (resource === 'vé') return 'Cập nhật vé';
    return `Cập nhật ${resource}`;
  }
  if (method === 'DELETE') {
    if (resource === 'phim') return 'Xóa phim';
    if (resource === 'phòng chiếu') return 'Xóa phòng chiếu';
    if (resource === 'suất chiếu') return 'Xóa suất chiếu';
    if (resource === 'vé') return 'Xóa vé';
    return `Xóa ${resource}`;
  }
  if (method === 'GET') {
    if (resource === 'thống kê doanh thu') return 'Tải thống kê doanh thu';
    if (resource === 'phim') return 'Tải thông tin phim';
    if (resource === 'phòng chiếu') return 'Tải danh sách phòng chiếu';
    if (resource === 'suất chiếu') return 'Tải lịch chiếu';
    if (resource === 'vé') return 'Tải thông tin vé';
    return 'Tải dữ liệu';
  }
  return 'Thực hiện thao tác';
}

function successMessage(response, operation, path) {
  const data = response?.data?.data || {};
  const userName = data.user?.name;

  if (path.includes('/auth/login')) {
    return `Đăng nhập thành công! Xin chào ${userName || 'bạn'}`;
  }
  if (path.includes('/auth/register')) {
    return `Đăng ký thành công! Xin chào ${userName || 'bạn'}`;
  }
  if (path.includes('/auth/forgot-password/request-otp')) return response?.data?.message || 'Nếu email đã được đăng ký, mã OTP sẽ được gửi đến hộp thư của bạn.';
  if (path.includes('/auth/forgot-password/verify-otp')) return 'Xác thực mã OTP thành công.';
  if (path.includes('/auth/forgot-password/reset-password')) return 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.';
  if (path.includes('/bookings') && !path.includes('/cancel')) {
    const ticketCode = data.booking?.ticketCode;
    return ticketCode ? `Đặt vé thành công! Mã vé: ${ticketCode}` : 'Đặt vé thành công! Vé của bạn đã được xác nhận.';
  }

  const messages = {
    'Hủy vé': 'Hủy vé thành công. Ghế đã được giải phóng.',
    'Thêm phim': 'Thêm phim thành công.',
    'Cập nhật phim': 'Cập nhật phim thành công.',
    'Xóa phim': 'Xóa phim thành công.',
    'Thêm phòng chiếu': 'Thêm phòng chiếu thành công.',
    'Cập nhật phòng chiếu': 'Cập nhật phòng chiếu thành công.',
    'Xóa phòng chiếu': 'Xóa phòng chiếu thành công.',
    'Tạo suất chiếu': 'Tạo suất chiếu thành công.',
    'Cập nhật suất chiếu': 'Cập nhật suất chiếu thành công.',
    'Xóa suất chiếu': 'Xóa suất chiếu thành công.'
  };

  return response?.data?.message || messages[operation] || `${operation} thành công.`;
}

function dispatchHttpToast(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cineticket:http-toast', { detail }));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cineticket_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || 'GET').toUpperCase();
    // Không hiện thông báo thành công cho GET vì các request này thường tự chạy
    // khi mở trang. Chỉ thao tác ghi/sửa/xóa mới cần thông báo xác nhận.
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const path = cleanPath(response.config);
      const operation = getOperation(method, path);
      dispatchHttpToast({
        kind: 'success',
        status: response.status,
        message: successMessage(response, operation, path),
        operation
      });
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const method = String(error.config?.method || 'GET').toUpperCase();
      const path = cleanPath(error.config);
      const operation = getOperation(method, path);
      const responseData = error.response.data || {};
      let message = responseData.message || HTTP_ERROR_FALLBACKS[status] || 'Đã xảy ra lỗi khi xử lý yêu cầu.';

      if (Array.isArray(responseData.conflictSeats) && responseData.conflictSeats.length) {
        message += ` Ghế bị trùng: ${responseData.conflictSeats.join(', ')}.`;
      }

      dispatchHttpToast({
        kind: 'error',
        status,
        title: `${operation} thất bại`,
        message,
        operation
      });
    } else {
      dispatchHttpToast({
        kind: 'network',
        status: 'NETWORK',
        title: 'Không thể kết nối máy chủ',
        message: 'Không nhận được phản hồi từ Backend. Hãy kiểm tra MongoDB, Backend và kết nối mạng.',
        operation: getOperation(String(error.config?.method || 'GET').toUpperCase(), cleanPath(error.config))
      });
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  return error?.response?.data?.message || error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}
