import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// Replace with your own token or validation logic
const VALID_TOKENS = [process.env.JWT_SECRET];

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader: string = req.headers["authorization"] || "";

    jwt.verify(
        authHeader,
        process.env.JWT_SECRET || "",
        (err: any, authorizedData) => {
            if (err) {
                //If error send Forbidden (403)
                res.status(401).json({ error: "Unauthorized" });
                return;
            } else {
                //If token is successfully verified, we can send the autorized data
                
                next();
            }
        }
    );
}
