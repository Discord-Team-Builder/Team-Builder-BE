import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit process if DB connection fails
  }
};

export default ConnectDB;
