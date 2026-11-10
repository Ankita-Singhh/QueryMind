import mongoose from 'mongoose';

let isConnected = false;
let fallbackMode = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/querymind';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    fallbackMode = false;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return { isConnected: true, fallbackMode: false };
  } catch (error) {
    isConnected = false;
    fallbackMode = true;
    console.warn(`\n============================================================`);
    console.warn(`[MongoDB Notice]: Could not connect to MongoDB at "${mongoUri}".`);
    console.warn(`Reason: ${error.message}`);
    console.warn(`QueryMind is activating its seamless In-Memory fallback database.`);
    console.warn(`You can test User Login, Registration, and Chat history right away!`);
    console.warn(`To persist data across server restarts, supply a MongoDB Atlas URI in .env.`);
    console.warn(`============================================================\n`);
    return { isConnected: false, fallbackMode: true };
  }
};

export const getDBStatus = () => ({
  isConnected,
  fallbackMode,
  driver: fallbackMode ? 'In-Memory State Store' : 'Mongoose / MongoDB'
});
