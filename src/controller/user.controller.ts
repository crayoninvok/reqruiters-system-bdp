import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import { PrismaClient, User } from "@prisma/client";
import { genSalt, hash, compare } from "bcrypt";
import { cloudinary } from "../services/cludinary"; // Import cloudinary

const prisma = new PrismaClient();

// Extend Request interface to include file upload
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  user?: User;
}

export class UserController {
  // Get current user profile
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // req.user already contains the full user data, just exclude password
      const { password, ...userWithoutPassword } = req.user;
      return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update user profile with avatar upload
  async updateProfile(req: MulterRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user.id;
      const { name } = req.body;

      // Validate input
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Prepare update data
      const updateData: any = {
        name: name.trim()
      };

      // Handle avatar upload
      if (req.file) {
        // Delete old avatar from Cloudinary if exists
        if (req.user.avatarUrl) {
          try {
            // Extract public_id from the URL
            const urlParts = req.user.avatarUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const publicId = fileName.split('.')[0];
            
            // Determine folder based on user role
            const folder = req.user.role === 'HR' ? 'hr_avatar' : 
                          req.user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
            const fullPublicId = `${folder}/${publicId}`;
            
            await cloudinary.uploader.destroy(fullPublicId);
          } catch (deleteError) {
            console.error('Error deleting old avatar:', deleteError);
            // Continue with update even if delete fails
          }
        }

        // Set new avatar URL from uploaded file
        updateData.avatarUrl = req.file.path;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({ 
        message: "Profile updated successfully", 
        user: updatedUser 
      });
    } catch (error: any) {
      console.error(error);
      
      // Clean up uploaded file if database update fails
      if (req.file) {
        try {
          const urlParts = req.file.path.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const publicId = fileName.split('.')[0];
          const folder = req.user?.role === 'HR' ? 'hr_avatar' : 
                        req.user?.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
          const fullPublicId = `${folder}/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
        }
      }

      if (error.code === 'P2025') {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Remove avatar
  async removeAvatar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user.id;

      // Delete avatar from Cloudinary if exists
      if (req.user.avatarUrl) {
        try {
          // Extract public_id from the URL
          const urlParts = req.user.avatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const publicId = fileName.split('.')[0];
          
          // Determine folder based on user role
          const folder = req.user.role === 'HR' ? 'hr_avatar' : 
                        req.user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
          const fullPublicId = `${folder}/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
        } catch (deleteError) {
          console.error('Error deleting avatar from Cloudinary:', deleteError);
        }
      }

      // Update user to remove avatar URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({ 
        message: "Avatar removed successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          message: "Current password, new password, and confirm password are required" 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          message: "New password and confirm password do not match" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "New password must be at least 6 characters long" 
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await genSalt(10);
      const hashedNewPassword = await hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      return res.status(200).json({ 
        message: "Password changed successfully" 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update email (with additional security)
  async updateEmail(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user.id;
      const { newEmail, password } = req.body;

      // Validate input
      if (!newEmail || !password) {
        return res.status(400).json({ 
          message: "New email and password are required" 
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Password is incorrect" });
      }

      // Check if new email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({ 
        message: "Email updated successfully", 
        user: updatedUser 
      });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: "Email already in use" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Delete user account
  async deleteAccount(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.user.id;
      const { password, confirmDelete } = req.body;

      // Validate input
      if (!password || confirmDelete !== 'DELETE') {
        return res.status(400).json({ 
          message: "Password and confirmation (type 'DELETE') are required" 
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Password is incorrect" });
      }

      // Delete avatar from Cloudinary if exists
      if (user.avatarUrl) {
        try {
          const urlParts = user.avatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const publicId = fileName.split('.')[0];
          
          const folder = user.role === 'HR' ? 'hr_avatar' : 
                        user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
          const fullPublicId = `${folder}/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
        } catch (deleteError) {
          console.error('Error deleting avatar from Cloudinary:', deleteError);
        }
      }

      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });

      // Clear cookie
      res.clearCookie("token", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production" 
      });

      return res.status(200).json({ 
        message: "Account deleted successfully" 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}