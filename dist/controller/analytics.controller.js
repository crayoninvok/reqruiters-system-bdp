"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AnalyticsController {
    async getOverallStats(req, res) {
        try {
            const [totalApplications, pendingApplications, inProgressApplications, completedApplications, totalUsers, totalRecruiters] = await Promise.all([
                prisma.recruitmentForm.count(),
                prisma.recruitmentForm.count({ where: { status: 'PENDING' } }),
                prisma.recruitmentForm.count({ where: { status: 'ON_PROGRESS' } }),
                prisma.recruitmentForm.count({ where: { status: 'COMPLETED' } }),
                prisma.user.count(),
                prisma.recruiterData.count()
            ]);
            return res.status(200).json({
                message: "Overall statistics retrieved successfully",
                stats: {
                    applications: {
                        total: totalApplications,
                        pending: pendingApplications,
                        inProgress: inProgressApplications,
                        completed: completedApplications
                    },
                    users: totalUsers,
                    recruiters: totalRecruiters
                }
            });
        }
        catch (error) {
            console.error("Error getting overall stats:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getApplicationsByPosition(req, res) {
        try {
            const positionStats = await prisma.recruitmentForm.groupBy({
                by: ['appliedPosition'],
                _count: {
                    appliedPosition: true
                },
                orderBy: {
                    _count: {
                        appliedPosition: 'desc'
                    }
                }
            });
            const formattedStats = positionStats.map(stat => ({
                position: stat.appliedPosition,
                count: stat._count.appliedPosition
            }));
            return res.status(200).json({
                message: "Applications by position retrieved successfully",
                data: formattedStats
            });
        }
        catch (error) {
            console.error("Error getting applications by position:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getApplicationsByProvince(req, res) {
        try {
            const provinceStats = await prisma.recruitmentForm.groupBy({
                by: ['province'],
                _count: {
                    province: true
                },
                orderBy: {
                    _count: {
                        province: 'desc'
                    }
                }
            });
            const formattedStats = provinceStats.map(stat => ({
                province: stat.province,
                count: stat._count.province
            }));
            return res.status(200).json({
                message: "Applications by province retrieved successfully",
                data: formattedStats
            });
        }
        catch (error) {
            console.error("Error getting applications by province:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getApplicationsByExperience(req, res) {
        try {
            const experienceStats = await prisma.recruitmentForm.groupBy({
                by: ['experienceLevel'],
                _count: {
                    experienceLevel: true
                }
            });
            const formattedStats = experienceStats.map(stat => ({
                experienceLevel: stat.experienceLevel,
                count: stat._count.experienceLevel
            }));
            return res.status(200).json({
                message: "Applications by experience level retrieved successfully",
                data: formattedStats
            });
        }
        catch (error) {
            console.error("Error getting applications by experience:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getApplicationsByEducation(req, res) {
        try {
            const educationStats = await prisma.recruitmentForm.groupBy({
                by: ['education'],
                _count: {
                    education: true
                },
                orderBy: {
                    _count: {
                        education: 'desc'
                    }
                }
            });
            const formattedStats = educationStats.map(stat => ({
                education: stat.education,
                count: stat._count.education
            }));
            return res.status(200).json({
                message: "Applications by education level retrieved successfully",
                data: formattedStats
            });
        }
        catch (error) {
            console.error("Error getting applications by education:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getMonthlyTrends(req, res) {
        try {
            const { year } = req.query;
            const targetYear = year ? parseInt(year) : new Date().getFullYear();
            const monthlyData = await prisma.recruitmentForm.findMany({
                where: {
                    createdAt: {
                        gte: new Date(`${targetYear}-01-01`),
                        lt: new Date(`${targetYear + 1}-01-01`)
                    }
                },
                select: {
                    createdAt: true,
                    status: true
                }
            });
            const monthlyStats = Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                const monthData = monthlyData.filter(item => item.createdAt.getMonth() + 1 === month);
                return {
                    month,
                    monthName: new Date(targetYear, index).toLocaleString('default', { month: 'long' }),
                    total: monthData.length,
                    pending: monthData.filter(item => item.status === 'PENDING').length,
                    inProgress: monthData.filter(item => item.status === 'ON_PROGRESS').length,
                    completed: monthData.filter(item => item.status === 'COMPLETED').length
                };
            });
            return res.status(200).json({
                message: "Monthly trends retrieved successfully",
                year: targetYear,
                data: monthlyStats
            });
        }
        catch (error) {
            console.error("Error getting monthly trends:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getRecentApplications(req, res) {
        try {
            const { limit = 10 } = req.query;
            const limitNum = parseInt(limit);
            const recentApplications = await prisma.recruitmentForm.findMany({
                take: limitNum,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    fullName: true,
                    appliedPosition: true,
                    province: true,
                    status: true,
                    createdAt: true
                }
            });
            return res.status(200).json({
                message: "Recent applications retrieved successfully",
                data: recentApplications
            });
        }
        catch (error) {
            console.error("Error getting recent applications:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getAgeDistribution(req, res) {
        try {
            const applications = await prisma.recruitmentForm.findMany({
                select: {
                    birthDate: true
                }
            });
            const currentDate = new Date();
            const ageGroups = {
                '18-25': 0,
                '26-30': 0,
                '31-35': 0,
                '36-40': 0,
                '41-45': 0,
                '45+': 0
            };
            applications.forEach(app => {
                const age = Math.floor((currentDate.getTime() - app.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                if (age <= 25)
                    ageGroups['18-25']++;
                else if (age <= 30)
                    ageGroups['26-30']++;
                else if (age <= 35)
                    ageGroups['31-35']++;
                else if (age <= 40)
                    ageGroups['36-40']++;
                else if (age <= 45)
                    ageGroups['41-45']++;
                else
                    ageGroups['45+']++;
            });
            const formattedData = Object.entries(ageGroups).map(([range, count]) => ({
                ageRange: range,
                count
            }));
            return res.status(200).json({
                message: "Age distribution retrieved successfully",
                data: formattedData
            });
        }
        catch (error) {
            console.error("Error getting age distribution:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getDashboardData(req, res) {
        try {
            const [overallStats, topPositions, topProvinces, monthlyTrends, recentApplications] = await Promise.all([
                this.getOverallStatsData(),
                this.getTopPositionsData(),
                this.getTopProvincesData(),
                this.getMonthlyTrendsData(),
                this.getRecentApplicationsData(5)
            ]);
            return res.status(200).json({
                message: "Dashboard data retrieved successfully",
                dashboard: {
                    stats: overallStats,
                    topPositions,
                    topProvinces,
                    monthlyTrends,
                    recentApplications
                }
            });
        }
        catch (error) {
            console.error("Error getting dashboard data:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async getOverallStatsData() {
        const [total, pending, inProgress, completed] = await Promise.all([
            prisma.recruitmentForm.count(),
            prisma.recruitmentForm.count({ where: { status: 'PENDING' } }),
            prisma.recruitmentForm.count({ where: { status: 'ON_PROGRESS' } }),
            prisma.recruitmentForm.count({ where: { status: 'COMPLETED' } })
        ]);
        return { total, pending, inProgress, completed };
    }
    async getTopPositionsData() {
        const positions = await prisma.recruitmentForm.groupBy({
            by: ['appliedPosition'],
            _count: { appliedPosition: true },
            orderBy: { _count: { appliedPosition: 'desc' } },
            take: 5
        });
        return positions.map(p => ({
            position: p.appliedPosition,
            count: p._count.appliedPosition
        }));
    }
    async getTopProvincesData() {
        const provinces = await prisma.recruitmentForm.groupBy({
            by: ['province'],
            _count: { province: true },
            orderBy: { _count: { province: 'desc' } },
            take: 5
        });
        return provinces.map(p => ({
            province: p.province,
            count: p._count.province
        }));
    }
    async getMonthlyTrendsData() {
        const currentYear = new Date().getFullYear();
        const monthlyData = await prisma.recruitmentForm.findMany({
            where: {
                createdAt: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                }
            },
            select: { createdAt: true }
        });
        return Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const count = monthlyData.filter(item => item.createdAt.getMonth() + 1 === month).length;
            return {
                month,
                monthName: new Date(currentYear, index).toLocaleString('default', { month: 'short' }),
                count
            };
        });
    }
    async getRecentApplicationsData(limit) {
        return await prisma.recruitmentForm.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                appliedPosition: true,
                status: true,
                createdAt: true
            }
        });
    }
}
exports.AnalyticsController = AnalyticsController;
