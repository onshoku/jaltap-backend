import express, { Request, Response, Router } from 'express';

import AWS from "aws-sdk";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// Configure AWS DynamoDB
AWS.config.update({
  region: "us-east-1", // Change to your DynamoDB region
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const USERS_TABLE = process.env.USERS_TABLE || "Users";

// User registration
router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await dynamoDB
      .get({
        TableName: USERS_TABLE,
        Key: { username },
      })
      .promise();

    if (existingUser.Item) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to DynamoDB
    await dynamoDB
      .put({
        TableName: USERS_TABLE,
        Item: { username, password: hashedPassword },
      })
      .promise();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Fetch the user from DynamoDB
    const user = await dynamoDB
      .get({
        TableName: USERS_TABLE,
        Key: { username },
      })
      .promise();

    if (!user.Item) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.Item.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;