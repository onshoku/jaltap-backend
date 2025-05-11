import { Router } from "express";

const router = Router();

// Example profile routes
router.get("/", (req, res) => {
  res.send("Profile API - Get all profiles");
});

router.get("/:id", (req, res) => {
  res.send(`Profile API - Get profile with ID: ${req.params.id}`);
});

export default router;