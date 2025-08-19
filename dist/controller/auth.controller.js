"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_1 = require("@prisma/client");
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma = new client_1.PrismaClient();
class AuthController {
    async loginUser(req, res) {
        const { email, password } = req.body;
        try {
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isPasswordValid = await (0, bcrypt_1.compare)(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const token = (0, jsonwebtoken_1.sign)({
                id: user.id,
                role: user.role
            }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async logoutUser(req, res) {
        try {
            return res.status(200).json({
                message: "Logged out successfully. Please remove the token from client storage."
            });
        }
        catch (error) {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async registerUser(req, res) {
        const { name, email, password } = req.body;
        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }
            const salt = await (0, bcrypt_1.genSalt)(10);
            const hashedPassword = await (0, bcrypt_1.hash)(password, salt);
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });
            const { password: _, ...userWithoutPassword } = newUser;
            return res
                .status(201)
                .json({
                message: "User registered successfully",
                user: userWithoutPassword
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async createHRUser(req, res) {
        const { name, email, password } = req.body;
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            if (decoded.role !== "ADMIN") {
                return res.status(403).json({ message: "Only admin can create HR users" });
            }
            const existingHRUser = await prisma.user.findUnique({ where: { email } });
            if (existingHRUser) {
                return res.status(400).json({ message: "User with this email already exists" });
            }
            const salt = await (0, bcrypt_1.genSalt)(10);
            const hashedPassword = await (0, bcrypt_1.hash)(password, salt);
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getHRUsers(req, res) {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            if (decoded.role !== "ADMIN") {
                return res.status(403).json({ message: "Only admin can view HR users" });
            }
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
                            recruitersCreated: true
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getHRUser(req, res) {
        const { userId } = req.params;
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
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
                            recruitersCreated: true
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateHRUser(req, res) {
        const { userId } = req.params;
        const { name, email, password, avatarUrl } = req.body;
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            if (decoded.role !== "ADMIN") {
                return res.status(403).json({ message: "Only admin can update HR users" });
            }
            const existingHRUser = await prisma.user.findFirst({
                where: {
                    id: userId,
                    role: "HR"
                }
            });
            if (!existingHRUser) {
                return res.status(404).json({ message: "HR user not found" });
            }
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
            const updateData = {};
            if (name !== undefined)
                updateData.name = name.trim();
            if (email !== undefined)
                updateData.email = email.trim().toLowerCase();
            if (avatarUrl !== undefined)
                updateData.avatarUrl = avatarUrl;
            if (password) {
                const salt = await (0, bcrypt_1.genSalt)(10);
                updateData.password = await (0, bcrypt_1.hash)(password, salt);
            }
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async deleteHRUser(req, res) {
        const { userId } = req.params;
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            if (decoded.role !== "ADMIN") {
                return res.status(403).json({ message: "Only admin can delete HR users" });
            }
            const existingHRUser = await prisma.user.findFirst({
                where: {
                    id: userId,
                    role: "HR"
                },
                include: {
                    _count: {
                        select: {
                            recruitersCreated: true
                        }
                    }
                }
            });
            if (!existingHRUser) {
                return res.status(404).json({ message: "HR user not found" });
            }
            if (existingHRUser._count.recruitersCreated > 0) {
                return res.status(400).json({
                    message: `Cannot delete HR user. This user has created ${existingHRUser._count.recruitersCreated} recruiter record(s). Please reassign or delete those records first.`
                });
            }
            if (decoded.id === userId) {
                return res.status(400).json({ message: "You cannot delete your own account" });
            }
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async changeUserRole(req, res) {
        const { userId } = req.params;
        const { newRole } = req.body;
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
            if (decoded.role !== "ADMIN") {
                return res.status(403).json({ message: "Only admin can change user roles" });
            }
            if (!["ADMIN", "HR"].includes(newRole)) {
                return res.status(400).json({ message: "Invalid role. Must be ADMIN or HR" });
            }
            if (decoded.id === userId) {
                return res.status(400).json({ message: "You cannot change your own role" });
            }
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                return res.status(404).json({ message: "User not found" });
            }
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.AuthController = AuthController;
