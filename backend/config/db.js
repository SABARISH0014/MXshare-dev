import mongoose from 'mongoose';

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not provided. Exiting.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 30000
    });
    console.log('MongoDB connected.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};