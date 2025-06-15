import express, { Request, Response } from "express"; // Add explicit Request/Response imports
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
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// Middleware setup (should come before routes)
app.use(express.json());
app.use(cors({
  origin: process.env.STATUS === "local"
    ? '*'
    : '*', // Add your production domains
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));



// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

// API groups
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jlpt", jlptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", globalRoutes);

// Static files (if not in local environment)
if (process.env.STATUS !== "local") {
  app.use(express.static(path.join(__dirname, "../dist/jlpt")));

  // Angular routing (fallback to index.html)
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../dist/jlpt/index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});