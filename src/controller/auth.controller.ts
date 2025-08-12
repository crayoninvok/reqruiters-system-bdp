import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client"; // Correct import
import { genSalt, hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";

const prisma = new PrismaClient();

export class AuthController {
  async loginUser(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = sign(
      { 
        id: user.id, 
        role: user.role 
      }, 
      process.env.JWT_SECRET!, 
      {
        expiresIn: "1h",
      }
    );

    // Return token in the response
    return res.status(200).json({
      message: "Login successful",
      token, // Send the token in the response body
      user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


  async logoutUser(req: Request, res: Response) {
    try {
      // Clear the cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  
  // User Registration
  async registerUser(req: Request, res: Response) {
    const { name, email, password } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
