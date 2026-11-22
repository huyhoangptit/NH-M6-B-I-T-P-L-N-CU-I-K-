export function notFound(req, res, next) { next({ statusCode: 404, message: `Không tìm thấy API ${req.originalUrl}` }); }
export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Lỗi máy chủ nội bộ.';
  if (error.name === 'ValidationError' || error.name === 'CastError') { statusCode = 400; message = error.message; }
  if (error.code === 11000) { statusCode = 409; message = 'Dữ liệu bị trùng. Vui lòng tải lại và thử lại.'; }
  const body = { success: false, message };
  if (error.details) body.details = error.details;
  if (process.env.NODE_ENV !== 'production') body.stack = error.stack;
  res.status(statusCode).json(body);
}
