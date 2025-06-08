import express from "express";
import { getData } from "../main/jlpt/controllers/data.controller"; // Adjust path
import { authenticateToken } from "../main/jlpt/middlewares/token.validator";

const router = express.Router();

router.get("/getData", authenticateToken, getData);

export default router;
