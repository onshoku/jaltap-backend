import { Router } from "express";
import { submitForm } from "../main/jlpt/controllers/submitForm";

const router = Router();

// Example JLPT routes
router.get("/", (req, res) => {
  res.send("JLPT API - Get all JLPT levels");
});

router.get("/:level", (req, res) => {
  res.send(`JLPT API - Get details for level: ${req.params.level}`);
});

router.post('/submit', submitForm);

export default router;