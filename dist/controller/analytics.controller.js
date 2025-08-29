"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AnalyticsController {
    async getDashboardStats(req, res) {
        try {
            const [totalApplications, pendingApplications, onProgressApplications, interviewApplications, psikotestApplications, userinterviewApplications, medicalcheckupApplications, medicalfollowupApplications, rejectedApplications, completedApplications, hiredApplications, totalRecruiters, recentApplications,] = await Promise.all([
                prisma.recruitmentForm.count(),
                prisma.recruitmentForm.count({ where: { status: "PENDING" } }),
                prisma.recruitmentForm.count({ where: { status: "ON_PROGRESS" } }),
                prisma.recruitmentForm.count({ where: { status: "INTERVIEW" } }),
                prisma.recruitmentForm.count({ where: { status: "PSIKOTEST" } }),
                prisma.recruitmentForm.count({ where: { status: "USER_INTERVIEW" } }),
                prisma.recruitmentForm.count({ where: { status: "MEDICAL_CHECKUP" } }),
                prisma.recruitmentForm.count({ where: { status: "MEDICAL_FOLLOWUP" } }),
                prisma.recruitmentForm.count({ where: { status: "REJECTED" } }),
                prisma.recruitmentForm.count({ where: { status: "COMPLETED" } }),
                prisma.recruitmentForm.count({ where: { status: "HIRED" } }),
                prisma.user.count({ where: { role: { in: ['HR', 'ADMIN'] } } }),
                prisma.recruitmentForm.count({
                    where: {
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                }),
            ]);
            return res.status(200).json({
                totalApplications,
                pendingApplications,
                onProgressApplications,
                interviewApplications,
                psikotestApplications,
                userinterviewApplications,
                medicalcheckupApplications,
                medicalfollowupApplications,
                rejectedApplications,
                completedApplications,
                hiredApplications,
                totalRecruiters,
                recentApplications,
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByStatus(req, res) {
        try {
            const { position, startDate, endDate } = req.query;
            const whereClause = {};
            if (position && position !== "all") {
                const dbPosition = position
                    .replace(/\s+/g, "_")
                    .toUpperCase();
                whereClause.appliedPosition = dbPosition;
            }
            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) {
                    whereClause.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    whereClause.createdAt.lte = new Date(endDate);
                }
            }
            const statusBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["status"],
                _count: { status: true },
                where: whereClause,
            });
            const formattedData = statusBreakdown.map((item) => ({
                status: item.status,
                count: item._count.status,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByPosition(req, res) {
        try {
            const positionBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["appliedPosition"],
                _count: { appliedPosition: true },
                orderBy: { _count: { appliedPosition: "desc" } },
                take: 10,
            });
            const formattedData = positionBreakdown.map((item) => ({
                position: item.appliedPosition,
                count: item._count.appliedPosition,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByProvince(req, res) {
        try {
            const provinceBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["province"],
                _count: { province: true },
                orderBy: { _count: { province: "desc" } },
            });
            const formattedData = provinceBreakdown.map((item) => ({
                province: item.province,
                count: item._count.province,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByEducation(req, res) {
        try {
            const educationBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["education"],
                _count: { education: true },
                orderBy: { _count: { education: "desc" } },
            });
            const formattedData = educationBreakdown.map((item) => ({
                education: item.education,
                count: item._count.education,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsTrend(req, res) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const applications = await prisma.recruitmentForm.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" },
            });
            const dateGroups = {};
            applications.forEach((app) => {
                const date = app.createdAt.toISOString().split("T")[0];
                dateGroups[date] = (dateGroups[date] || 0) + 1;
            });
            const formattedData = Object.entries(dateGroups).map(([date, count]) => ({
                date,
                count,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByExperience(req, res) {
        try {
            const experienceBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["experienceLevel"],
                _count: { experienceLevel: true },
            });
            const formattedData = experienceBreakdown.map((item) => ({
                experienceLevel: item.experienceLevel,
                count: item._count.experienceLevel,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getApplicationsByMaritalStatus(req, res) {
        try {
            const maritalBreakdown = await prisma.recruitmentForm.groupBy({
                by: ["maritalStatus"],
                _count: { maritalStatus: true },
            });
            const formattedData = maritalBreakdown.map((item) => ({
                maritalStatus: item.maritalStatus,
                count: item._count.maritalStatus,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getAgeDistribution(req, res) {
        try {
            const applications = await prisma.recruitmentForm.findMany({
                select: { birthDate: true },
            });
            const ageGroups = {
                "18-25": 0,
                "26-35": 0,
                "36-45": 0,
                "46-55": 0,
                "55+": 0,
            };
            const currentDate = new Date();
            applications.forEach((app) => {
                const age = currentDate.getFullYear() - app.birthDate.getFullYear();
                if (age <= 25)
                    ageGroups["18-25"]++;
                else if (age <= 35)
                    ageGroups["26-35"]++;
                else if (age <= 45)
                    ageGroups["36-45"]++;
                else if (age <= 55)
                    ageGroups["46-55"]++;
                else
                    ageGroups["55+"]++;
            });
            const formattedData = Object.entries(ageGroups).map(([range, count]) => ({
                ageRange: range,
                count,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getHRUsersByRole(req, res) {
        try {
            const roleBreakdown = await prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
                where: {
                    role: { in: ['HR', 'ADMIN'] }
                },
                orderBy: { _count: { role: "desc" } },
            });
            const formattedData = roleBreakdown.map((item) => ({
                role: item.role,
                count: item._count.role,
            }));
            return res.status(200).json(formattedData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCustomAnalytics(req, res) {
        try {
            const { startDate, endDate, metric } = req.query;
            if (!startDate || !endDate || !metric) {
                return res.status(400).json({
                    message: "startDate, endDate, and metric are required",
                });
            }
            const dateFilter = {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            };
            let result;
            switch (metric) {
                case "applications_by_status":
                    result = await prisma.recruitmentForm.groupBy({
                        by: ["status"],
                        _count: { status: true },
                        where: dateFilter,
                    });
                    break;
                case "applications_by_position":
                    result = await prisma.recruitmentForm.groupBy({
                        by: ["appliedPosition"],
                        _count: { appliedPosition: true },
                        where: {
                            ...dateFilter,
                            appliedPosition: { not: null }
                        },
                        orderBy: { _count: { appliedPosition: "desc" } },
                    });
                    break;
                case "applications_by_province":
                    result = await prisma.recruitmentForm.groupBy({
                        by: ["province"],
                        _count: { province: true },
                        where: dateFilter,
                        orderBy: { _count: { province: "desc" } },
                    });
                    break;
                case "hired_by_department":
                    result = await prisma.hiredEmployee.groupBy({
                        by: ["department"],
                        _count: { department: true },
                        where: {
                            createdAt: {
                                gte: new Date(startDate),
                                lte: new Date(endDate),
                            },
                            isActive: true
                        },
                        orderBy: { _count: { department: "desc" } },
                    });
                    break;
                default:
                    return res.status(400).json({ message: "Invalid metric" });
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
