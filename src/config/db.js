import mongoose from "mongoose";
import dotenv from 'dotenv'
import ApiError from "../utils/api-error";

dotenv.config()

const ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw new ApiError(500, "Database connection failed", [err.message], err.stack);
    // Optionally, you can log the error to an external service here
  }
};

export default ConnectDB;
