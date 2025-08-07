import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: "Authorization token is required" });
    }

    // Verify the token
    const decoded: any = verify(token, process.env.JWT_SECRET!);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach the user to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
