import { Router } from "express";

const router = Router();

// Example admin routes
router.get("/dashboard", (req, res) => {
  res.send("Admin API - Dashboard");
});

router.post("/create", (req, res) => {
  res.send("Admin API - Create new resource");
});

export default router;