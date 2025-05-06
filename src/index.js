import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ConnectDB from "./config/db.js";
import authRoutes from './routes/auth.js'
import GuildBot from "./routes/guildBot.route.js"
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
app.use('/api/v1/project', projectRoutes);
app.use('api/v1/GuildBot', GuildBot )

app.get("/test", (req, res) => {
  console.log('Request Received:', req.method, req.url);
  res.send("Welcome to Team Builder!");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
