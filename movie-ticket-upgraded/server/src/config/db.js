import mongoose from 'mongoose';
export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  // Chờ tạo index (đặc biệt unique index chống bán trùng ghế) trước khi nhận request.
  await Promise.all(mongoose.modelNames().map((modelName) => mongoose.model(modelName).init()));
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
