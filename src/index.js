import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ConnectDB from "./config/db.js";
import authRoutes from './routes/auth.js'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

ConnectDB();

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,               // Cookies ke liye true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', authRoutes);

app.get("/test", (req, res) => {
  console.log('Request Received:', req.method, req.url);
  res.send("Welcome to Team Builder!");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
