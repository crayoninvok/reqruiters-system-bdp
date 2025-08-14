import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AnalyticsController {
  // Dashboard overview stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const [
        totalApplications,
        pendingApplications,
        onProgressApplications,
        completedApplications,
        totalRecruiters,
        recentApplications
      ] = await Promise.all([
        prisma.recruitmentForm.count(),
        prisma.recruitmentForm.count({ where: { status: 'PENDING' } }),
        prisma.recruitmentForm.count({ where: { status: 'ON_PROGRESS' } }),
        prisma.recruitmentForm.count({ where: { status: 'COMPLETED' } }),
        prisma.recruiterData.count(),
        prisma.recruitmentForm.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        })
      ]);

      return res.status(200).json({
        totalApplications,
        pendingApplications,
        onProgressApplications,
        completedApplications,
        totalRecruiters,
        recentApplications
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Applications by status breakdown
  async getApplicationsByStatus(req: Request, res: Response) {
    try {
      const statusBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['status'],
        _count: { status: true }
      });

      const formattedData = statusBreakdown.map(item => ({
        status: item.status,
        count: item._count.status
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Applications by position
  async getApplicationsByPosition(req: Request, res: Response) {
    try {
      const positionBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['appliedPosition'],
        _count: { appliedPosition: true },
        orderBy: { _count: { appliedPosition: 'desc' } },
        take: 10
      });

      const formattedData = positionBreakdown.map(item => ({
        position: item.appliedPosition,
        count: item._count.appliedPosition
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Applications by province
  async getApplicationsByProvince(req: Request, res: Response) {
    try {
      const provinceBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['province'],
        _count: { province: true },
        orderBy: { _count: { province: 'desc' } }
      });

      const formattedData = provinceBreakdown.map(item => ({
        province: item.province,
        count: item._count.province
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Applications by education level
  async getApplicationsByEducation(req: Request, res: Response) {
    try {
      const educationBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['education'],
        _count: { education: true },
        orderBy: { _count: { education: 'desc' } }
      });

      const formattedData = educationBreakdown.map(item => ({
        education: item.education,
        count: item._count.education
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Applications trend over time (last 30 days)
  async getApplicationsTrend(req: Request, res: Response) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const applications = await prisma.recruitmentForm.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      });

      // Group by date
      const dateGroups: { [key: string]: number } = {};
      applications.forEach(app => {
        const date = app.createdAt.toISOString().split('T')[0];
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });

      const formattedData = Object.entries(dateGroups).map(([date, count]) => ({
        date,
        count
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Experience level breakdown
  async getApplicationsByExperience(req: Request, res: Response) {
    try {
      const experienceBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['experienceLevel'],
        _count: { experienceLevel: true }
      });

      const formattedData = experienceBreakdown.map(item => ({
        experienceLevel: item.experienceLevel,
        count: item._count.experienceLevel
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Marital status breakdown
  async getApplicationsByMaritalStatus(req: Request, res: Response) {
    try {
      const maritalBreakdown = await prisma.recruitmentForm.groupBy({
        by: ['maritalStatus'],
        _count: { maritalStatus: true }
      });

      const formattedData = maritalBreakdown.map(item => ({
        maritalStatus: item.maritalStatus,
        count: item._count.maritalStatus
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Age distribution analysis
  async getAgeDistribution(req: Request, res: Response) {
    try {
      const applications = await prisma.recruitmentForm.findMany({
        select: { birthDate: true }
      });

      const ageGroups = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-55': 0,
        '55+': 0
      };

      const currentDate = new Date();
      applications.forEach(app => {
        const age = currentDate.getFullYear() - app.birthDate.getFullYear();
        
        if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 45) ageGroups['36-45']++;
        else if (age <= 55) ageGroups['46-55']++;
        else ageGroups['55+']++;
      });

      const formattedData = Object.entries(ageGroups).map(([range, count]) => ({
        ageRange: range,
        count
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Recruiters by department
  async getRecruitersByDepartment(req: Request, res: Response) {
    try {
      const departmentBreakdown = await prisma.recruiterData.groupBy({
        by: ['department'],
        _count: { department: true },
        where: { department: { not: null } },
        orderBy: { _count: { department: 'desc' } }
      });

      const formattedData = departmentBreakdown.map(item => ({
        department: item.department,
        count: item._count.department
      }));

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Custom analytics with date range filter
  async getCustomAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, metric } = req.query;

      if (!startDate || !endDate || !metric) {
        return res.status(400).json({ 
          message: "startDate, endDate, and metric are required" 
        });
      }

      const dateFilter = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };

      let result;
      switch (metric) {
        case 'applications_by_status':
          result = await prisma.recruitmentForm.groupBy({
            by: ['status'],
            _count: { status: true },
            where: dateFilter
          });
          break;
        case 'applications_by_position':
          result = await prisma.recruitmentForm.groupBy({
            by: ['appliedPosition'],
            _count: { appliedPosition: true },
            where: dateFilter,
            orderBy: { _count: { appliedPosition: 'desc' } }
          });
          break;
        case 'applications_by_province':
          result = await prisma.recruitmentForm.groupBy({
            by: ['province'],
            _count: { province: true },
            where: dateFilter,
            orderBy: { _count: { province: 'desc' } }
          });
          break;
        default:
          return res.status(400).json({ message: "Invalid metric" });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}