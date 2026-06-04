import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) return;

    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️  MongoDB Atlas disconnected. Attempting to reconnect...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('✅ MongoDB Atlas reconnected')
    );
    mongoose.connection.on('error', (err) =>
      console.error('❌ MongoDB Atlas connection error:', err)
    );
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;