import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "No token provided",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id: string;
    };

    console.log(decoded);

    req.id = decoded.id;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;