// utils/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️  MongoDB disconnected. Reconnecting...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('✅ MongoDB reconnected')
    );
    mongoose.connection.on('error', (err) =>
      console.error('❌ MongoDB error:', err)
    );
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
