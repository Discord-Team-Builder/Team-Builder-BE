import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/", (req, res) => {
  res.send("Welcome to Team Builder!");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
