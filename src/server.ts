import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
// Import route groups
import profileRoutes from "./routes/profile";
import authRoutes from "./routes/authentication";
import jlptRoutes from "./routes/jlpt";
import adminRoutes from "./routes/admin";
import paymentRoutes from "./routes/payments";
import globalRoutes from "./routes/global";
import { getData } from "./main/jlpt/controllers/data.controller";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors())

// Root endpoint
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.use(cors({
  origin: 'http://localhost:4200', // Allow only Angular frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// API groups
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jlpt", jlptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api",globalRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
