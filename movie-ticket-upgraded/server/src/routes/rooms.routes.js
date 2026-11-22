import { Router } from 'express';
import { Room } from '../models/Room.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
function validateRoomInput(data) {
  const rows = Number(data.rows);
  const seatsPerRow = Number(data.seatsPerRow);
  const vipRows = data.vipRows ?? [];
  if (!Number.isInteger(rows) || rows < 1 || rows > 26 || !Number.isInteger(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 30) throw new ApiError(400, 'Số hàng phải từ 1–26 và số ghế mỗi hàng phải từ 1–30.');
  if (!Array.isArray(vipRows)) throw new ApiError(400, 'Danh sách hàng VIP phải là một mảng.');
  const allowedRows = new Set(Array.from({ length: rows }, (_, index) => String.fromCharCode(65 + index)));
  if (vipRows.some((row) => !allowedRows.has(String(row).toUpperCase()))) throw new ApiError(400, 'Hàng VIP không nằm trong phạm vi hàng ghế của phòng.');
}
router.get('/', asyncHandler(async (req, res) => { const rooms = await Room.find().sort({ name: 1 }); res.json({ success: true, data: { rooms } }); }));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, rows, seatsPerRow, vipRows = [] } = req.body;
  if (!name) throw new ApiError(400, 'Vui lòng nhập tên phòng.');
  validateRoomInput({ rows, seatsPerRow, vipRows });
  const room = await Room.create({ name, rows, seatsPerRow, vipRows }); res.status(201).json({ success: true, data: { room } });
}));
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => { const current = await Room.findById(req.params.id); if (!current) throw new ApiError(404, 'Không tìm thấy phòng.'); const data = { ...req.body }; validateRoomInput({ rows: data.rows ?? current.rows, seatsPerRow: data.seatsPerRow ?? current.seatsPerRow, vipRows: data.vipRows ?? current.vipRows }); const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }); if (!room) throw new ApiError(404, 'Không tìm thấy phòng.'); res.json({ success: true, data: { room } }); }));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => { const room = await Room.findByIdAndDelete(req.params.id); if (!room) throw new ApiError(404, 'Không tìm thấy phòng.'); res.json({ success: true, message: 'Đã xóa phòng.' }); }));
export default router;
