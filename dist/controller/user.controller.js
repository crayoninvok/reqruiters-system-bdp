"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_1 = require("@prisma/client");
const bcrypt_1 = require("bcrypt");
const cludinary_1 = require("../services/cludinary");
const prisma = new client_1.PrismaClient();
class UserController {
    async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const { password, ...userWithoutPassword } = req.user;
            return res.status(200).json({ user: userWithoutPassword });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.user.id;
            const { name } = req.body;
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ message: "Name is required" });
            }
            const updateData = {
                name: name.trim()
            };
            if (req.file) {
                if (req.user.avatarUrl) {
                    try {
                        const urlParts = req.user.avatarUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        const publicId = fileName.split('.')[0];
                        const folder = req.user.role === 'HR' ? 'hr_avatar' :
                            req.user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
                        const fullPublicId = `${folder}/${publicId}`;
                        await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
                    }
                    catch (deleteError) {
                        console.error('Error deleting old avatar:', deleteError);
                    }
                }
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
        }
        catch (error) {
            console.error(error);
            if (req.file) {
                try {
                    const urlParts = req.file.path.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split('.')[0];
                    const folder = req.user?.role === 'HR' ? 'hr_avatar' :
                        req.user?.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
                    const fullPublicId = `${folder}/${publicId}`;
                    await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
                }
                catch (cleanupError) {
                    console.error('Error cleaning up uploaded file:', cleanupError);
                }
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async removeAvatar(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.user.id;
            if (req.user.avatarUrl) {
                try {
                    const urlParts = req.user.avatarUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split('.')[0];
                    const folder = req.user.role === 'HR' ? 'hr_avatar' :
                        req.user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
                    const fullPublicId = `${folder}/${publicId}`;
                    await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
                }
                catch (deleteError) {
                    console.error('Error deleting avatar from Cloudinary:', deleteError);
                }
            }
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async changePassword(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;
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
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isCurrentPasswordValid = await (0, bcrypt_1.compare)(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }
            const salt = await (0, bcrypt_1.genSalt)(10);
            const hashedNewPassword = await (0, bcrypt_1.hash)(newPassword, salt);
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
            return res.status(200).json({
                message: "Password changed successfully"
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateEmail(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.user.id;
            const { newEmail, password } = req.body;
            if (!newEmail || !password) {
                return res.status(400).json({
                    message: "New email and password are required"
                });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                return res.status(400).json({ message: "Invalid email format" });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isPasswordValid = await (0, bcrypt_1.compare)(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Password is incorrect" });
            }
            const existingUser = await prisma.user.findUnique({
                where: { email: newEmail }
            });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ message: "Email already in use" });
            }
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
        }
        catch (error) {
            console.error(error);
            if (error.code === 'P2002') {
                return res.status(400).json({ message: "Email already in use" });
            }
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async deleteAccount(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.user.id;
            const { password, confirmDelete } = req.body;
            if (!password || confirmDelete !== 'DELETE') {
                return res.status(400).json({
                    message: "Password and confirmation (type 'DELETE') are required"
                });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isPasswordValid = await (0, bcrypt_1.compare)(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Password is incorrect" });
            }
            if (user.avatarUrl) {
                try {
                    const urlParts = user.avatarUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split('.')[0];
                    const folder = user.role === 'HR' ? 'hr_avatar' :
                        user.role === 'ADMIN' ? 'admin_avatar' : 'user_avatar';
                    const fullPublicId = `${folder}/${publicId}`;
                    await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
                }
                catch (deleteError) {
                    console.error('Error deleting avatar from Cloudinary:', deleteError);
                }
            }
            await prisma.user.delete({
                where: { id: userId }
            });
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production"
            });
            return res.status(200).json({
                message: "Account deleted successfully"
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.UserController = UserController;
