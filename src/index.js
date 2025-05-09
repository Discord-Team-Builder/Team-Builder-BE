import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ConnectDB from "./config/db.js";
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/project.route.js'
// import GuildBot from "./routes/guildBot.route.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

ConnectDB();

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,               // Cookies ke liye true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'set-cookie'],
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', authRoutes);
app.use('/api/v1/project', projectRoutes);
// Test route
app.get("/test", (req, res) => {
  console.log('Request Received:', req.method, req.url);
  res.send("Welcome to Team Builder!");
});

//TODO: app.use('api/v1/GuildBot', GuildBot )

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// Middleware to handle CORS preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.sendStatus(200);
  }
  next();
});
// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
// Middleware to handle 404 errors
app.use((req, res, next) => {
  res.status(404).send('Sorry, that route does not exist.');
});


// Error-handled server start
app.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error("Server failed to start:", error);
    return;
  }
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
