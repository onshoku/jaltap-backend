import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve Angular build only in non-local environments
if (process.env.STATUS !== "local") {
  app.use("/", express.static(path.join(__dirname, "/dist/frontend")));
}

// API to return "Hello, World!"
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

// Angular routing (fallback to index.html)
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "/dist/frontend/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
