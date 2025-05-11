import express from "express";
import dotenv from "dotenv";

// Import route groups
import profileRoutes from "./routes/profile";
import authRoutes from "./routes/authentication";
import jlptRoutes from "./routes/jlpt";
import adminRoutes from "./routes/admin";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Hello world");
});

// API groups
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jlpt", jlptRoutes);
app.use("/api/admin", adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
