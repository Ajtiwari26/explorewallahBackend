import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/explorewallah';
    const conn = await mongoose.connect(mongoURI);
    console.log(`[MongoDB] Database connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
};
