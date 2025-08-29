import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
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
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async logoutUser(req: Request, res: Response) {
    try {
      // With token-based auth, logout is handled client-side by removing the token
      // Server-side logout would require token blacklisting if needed
      return res.status(200).json({ 
        message: "Logged out successfully. Please remove the token from client storage." 
      });
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

      // Don't return the password in the response
      const { password: _, ...userWithoutPassword } = newUser;

      return res
        .status(201)
        .json({ 
          message: "User registered successfully", 
          user: userWithoutPassword 
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin create HR user
  async createHRUser(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can create HR users" });
      }

      const existingHRUser = await prisma.user.findUnique({ where: { email } });
      if (existingHRUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      const newHRUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "HR"
        }
      });

      const { password: _, ...hrUserWithoutPassword } = newHRUser;

      return res.status(201).json({
        message: "HR user created successfully",
        user: hrUserWithoutPassword
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin get all HR users
  async getHRUsers(req: Request, res: Response) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can view HR users" });
      }

      // Get all HR users (excluding passwords)
      const hrUsers = await prisma.user.findMany({
        where: { role: "HR" },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              hiredEmployeesProcessed: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return res.status(200).json({
        message: "HR users retrieved successfully",
        users: hrUsers,
        total: hrUsers.length
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin get single HR user
  async getHRUser(req: Request, res: Response) {
    const { userId } = req.params;
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can view HR users" });
      }

      const hrUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          role: "HR"
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              hiredEmployeesProcessed: true
            }
          }
        }
      });

      if (!hrUser) {
        return res.status(404).json({ message: "HR user not found" });
      }

      return res.status(200).json({
        message: "HR user retrieved successfully",
        user: hrUser
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin update HR user
  async updateHRUser(req: Request, res: Response) {
    const { userId } = req.params;
    const { name, email, password, avatarUrl } = req.body;
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can update HR users" });
      }

      // Check if HR user exists
      const existingHRUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          role: "HR"
        }
      });

      if (!existingHRUser) {
        return res.status(404).json({ message: "HR user not found" });
      }

      // Check if email is already taken by another user
      if (email && email !== existingHRUser.email) {
        const emailTaken = await prisma.user.findFirst({
          where: { 
            email,
            id: { not: userId }
          }
        });

        if (emailTaken) {
          return res.status(400).json({ message: "Email is already taken by another user" });
        }
      }

      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (email !== undefined) updateData.email = email.trim().toLowerCase();
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      // Hash new password if provided
      if (password) {
        const salt = await genSalt(10);
        updateData.password = await hash(password, salt);
      }

      // Update the HR user
      const updatedHRUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        message: "HR user updated successfully",
        user: updatedHRUser
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin delete HR user
  async deleteHRUser(req: Request, res: Response) {
    const { userId } = req.params;
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can delete HR users" });
      }

      // Check if HR user exists and get related data count
      const existingHRUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          role: "HR"
        },
        include: {
          _count: {
            select: {
              hiredEmployeesProcessed: true
            }
          }
        }
      });

      if (!existingHRUser) {
        return res.status(404).json({ message: "HR user not found" });
      }

      // Check if user has processed hired employees
      if (existingHRUser._count.hiredEmployeesProcessed > 0) {
        return res.status(400).json({ 
          message: `Cannot delete HR user. This user has processed ${existingHRUser._count.hiredEmployeesProcessed} hired employee record(s). Please reassign or delete those records first.`
        });
      }

      // Prevent admin from deleting themselves
      if (decoded.id === userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      // Delete the HR user
      await prisma.user.delete({
        where: { id: userId }
      });

      return res.status(200).json({
        message: "HR user deleted successfully",
        deletedUser: {
          id: existingHRUser.id,
          name: existingHRUser.name,
          email: existingHRUser.email
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin change user role (promote HR to ADMIN or demote ADMIN to HR)
  async changeUserRole(req: Request, res: Response) {
    const { userId } = req.params;
    const { newRole } = req.body;
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    try {
      const decoded: any = verify(token, process.env.JWT_SECRET!);

      // Check if the user is an admin
      if (decoded.role !== "ADMIN") {
        return res.status(403).json({ message: "Only admin can change user roles" });
      }

      // Validate new role
      if (!["ADMIN", "HR"].includes(newRole)) {
        return res.status(400).json({ message: "Invalid role. Must be ADMIN or HR" });
      }

      // Prevent admin from changing their own role
      if (decoded.id === userId) {
        return res.status(400).json({ message: "You cannot change your own role" });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        message: `User role changed to ${newRole} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}