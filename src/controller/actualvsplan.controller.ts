import { Request, Response } from "express";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface PlanData {
  department: string;
  position: string;
  plannedCount: number;
  targetDate: string;
}

interface ActualVsPlanResponse {
  department: string;
  position: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: "above" | "below" | "on-target";
}

export class ActualVsPlanController {
  // Get actual vs plan comparison
  async getActualVsPlan(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can view recruitment analytics",
        });
      }

      // Get actual recruiters grouped by department and position
      const actualRecruiters = await prisma.recruiterData.groupBy({
        by: ["department", "position"],
        _count: {
          id: true,
        },
        where: {
          department: { not: null },
          position: { not: null },
        },
      });

      // Sample plan data (in real app, this could come from database, config, or request body)
      const planData: PlanData[] = [
        {
          department: "Production",
          position: "Production Engineer",
          plannedCount: 10,
          targetDate: "2024-12-31",
        },
        {
          department: "Production",
          position: "Mechanic",
          plannedCount: 15,
          targetDate: "2024-12-31",
        },
        {
          department: "Logistics",
          position: "Driver",
          plannedCount: 8,
          targetDate: "2024-12-31",
        },
        {
          department: "HR",
          position: "HR Officer",
          plannedCount: 3,
          targetDate: "2024-12-31",
        },
        {
          department: "HSE",
          position: "Safety Officer",
          plannedCount: 5,
          targetDate: "2024-12-31",
        },
      ];

      // Create comparison data
      const comparison: ActualVsPlanResponse[] = [];

      // Process planned positions
      for (const plan of planData) {
        const actual = actualRecruiters.find(
          (a) =>
            a.department === plan.department && a.position === plan.position
        );

        const actualCount = actual?._count.id || 0;
        const variance = actualCount - plan.plannedCount;
        const variancePercentage =
          plan.plannedCount > 0
            ? Math.round((variance / plan.plannedCount) * 100)
            : 0;

        let status: "above" | "below" | "on-target" = "on-target";
        if (variance > 0) status = "above";
        else if (variance < 0) status = "below";

        comparison.push({
          department: plan.department,
          position: plan.position,
          planned: plan.plannedCount,
          actual: actualCount,
          variance,
          variancePercentage,
          status,
        });
      }

      // Add unplanned actual positions
      for (const actual of actualRecruiters) {
        const existsInPlan = planData.find(
          (p) =>
            p.department === actual.department && p.position === actual.position
        );

        if (!existsInPlan && actual.department && actual.position) {
          comparison.push({
            department: actual.department,
            position: actual.position,
            planned: 0,
            actual: actual._count.id,
            variance: actual._count.id,
            variancePercentage: 100,
            status: "above",
          });
        }
      }

      // Calculate summary statistics
      const totalPlanned = comparison.reduce(
        (sum, item) => sum + item.planned,
        0
      );
      const totalActual = comparison.reduce(
        (sum, item) => sum + item.actual,
        0
      );
      const totalVariance = totalActual - totalPlanned;
      const totalVariancePercentage =
        totalPlanned > 0 ? Math.round((totalVariance / totalPlanned) * 100) : 0;

      return res.status(200).json({
        message: "Actual vs Plan data retrieved successfully",
        summary: {
          totalPlanned,
          totalActual,
          totalVariance,
          totalVariancePercentage,
          status:
            totalVariance > 0
              ? "above"
              : totalVariance < 0
              ? "below"
              : "on-target",
        },
        data: comparison.sort((a, b) =>
          a.department.localeCompare(b.department)
        ),
      });
    } catch (error) {
      console.error("Error getting actual vs plan data:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get department-wise summary
  async getDepartmentSummary(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can view recruitment analytics",
        });
      }

      const departmentActuals = await prisma.recruiterData.groupBy({
        by: ["department"],
        _count: {
          id: true,
        },
        where: {
          department: { not: null },
        },
      });

      // Sample department plans
      const departmentPlans = [
        { department: "Production", plannedCount: 25 },
        { department: "Logistics", plannedCount: 8 },
        { department: "HR", plannedCount: 3 },
        { department: "HSE", plannedCount: 5 },
      ];

      const summary = departmentPlans.map((plan) => {
        const actual = departmentActuals.find(
          (a) => a.department === plan.department
        );
        const actualCount = actual?._count.id || 0;
        const variance = actualCount - plan.plannedCount;

        return {
          department: plan.department,
          planned: plan.plannedCount,
          actual: actualCount,
          variance,
          variancePercentage:
            plan.plannedCount > 0
              ? Math.round((variance / plan.plannedCount) * 100)
              : 0,
          status: variance > 0 ? "above" : variance < 0 ? "below" : "on-target",
        };
      });

      return res.status(200).json({
        message: "Department summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      console.error("Error getting department summary:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Update plan data (if you want to make plans dynamic)
  async updatePlan(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
          message: "Access denied. Only ADMIN can update recruitment plans",
        });
      }

      const { planData } = req.body as { planData: PlanData[] };

      if (!planData || !Array.isArray(planData)) {
        return res.status(400).json({
          message: "Valid plan data array is required",
        });
      }

      // In a real implementation, you might store this in a separate table
      // For now, we'll just validate and return success
      for (const plan of planData) {
        if (
          !plan.department ||
          !plan.position ||
          !plan.plannedCount ||
          !plan.targetDate
        ) {
          return res.status(400).json({
            message:
              "Each plan item must have department, position, plannedCount, and targetDate",
          });
        }
      }

      return res.status(200).json({
        message: "Plan updated successfully",
        planData,
      });
    } catch (error) {
      console.error("Error updating plan:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}
