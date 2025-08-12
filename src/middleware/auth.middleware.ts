import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header (Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1]; // Extract the token from the header

    if (!token) {
      return res.status(401).json({ message: "Authorization token is required" });
    }

    // Verify the token
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Check if token has expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Token has expired" });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
