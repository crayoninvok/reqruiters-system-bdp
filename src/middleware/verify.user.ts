import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define the JWT payload interface
interface UserJwtPayload extends JwtPayload {
  id: string;
}

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as UserJwtPayload;
    
    // Fetch the full user data and attach to request
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};