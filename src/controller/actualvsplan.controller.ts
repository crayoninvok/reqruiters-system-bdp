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

      // Get actual hired employees grouped by department and position
      const actualHiredEmployees = await prisma.hiredEmployee.groupBy({
        by: ["department", "hiredPosition"],
        _count: {
          id: true,
        },
        where: {
          isActive: true, // Only count active employees
        },
      });

      // Sample plan data (in real app, this could come from database, config, or request body)
      const planData: PlanData[] = [
        {
          department: "PRODUCTION_ENGINEERING",
          position: "PROD_ENG_SPV",
          plannedCount: 10,
          targetDate: "2024-12-31",
        },
        {
          department: "OPERATIONAL",
          position: "MECHANIC_SR",
          plannedCount: 15,
          targetDate: "2024-12-31",
        },
        {
          department: "LOGISTIC",
          position: "DRIVER_DOUBLE_TRAILER",
          plannedCount: 8,
          targetDate: "2024-12-31",
        },
        {
          department: "HUMAN_RESOURCES_GA",
          position: "HRGA_ADMIN",
          plannedCount: 3,
          targetDate: "2024-12-31",
        },
        {
          department: "HEALTH_SAFETY_ENVIRONMENT",
          position: "SAFETY_OFFICER",
          plannedCount: 5,
          targetDate: "2024-12-31",
        },
      ];

      // Create comparison data
      const comparison: ActualVsPlanResponse[] = [];

      // Process planned positions
      for (const plan of planData) {
        const actual = actualHiredEmployees.find(
          (a) =>
            a.department === plan.department && a.hiredPosition === plan.position
        );

        const actualCount = actual?._count?.id || 0;
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
      for (const actual of actualHiredEmployees) {
        const existsInPlan = planData.find(
          (p) =>
            p.department === actual.department && p.position === actual.hiredPosition
        );

        if (!existsInPlan && actual.department && actual.hiredPosition) {
          comparison.push({
            department: actual.department,
            position: actual.hiredPosition,
            planned: 0,
            actual: actual._count?.id || 0,
            variance: actual._count?.id || 0,
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

      const departmentActuals = await prisma.hiredEmployee.groupBy({
        by: ["department"],
        _count: {
          id: true,
        },
        where: {
          isActive: true, // Only count active employees
        },
      });

      // Sample department plans (using enum values from schema)
      const departmentPlans = [
        { department: "PRODUCTION_ENGINEERING", plannedCount: 25 },
        { department: "LOGISTIC", plannedCount: 8 },
        { department: "HUMAN_RESOURCES_GA", plannedCount: 3 },
        { department: "HEALTH_SAFETY_ENVIRONMENT", plannedCount: 5 },
        { department: "OPERATIONAL", plannedCount: 30 },
        { department: "PLANT", plannedCount: 15 },
        { department: "PURCHASING", plannedCount: 2 },
        { department: "INFORMATION_TECHNOLOGY", plannedCount: 4 },
        { department: "MEDICAL", plannedCount: 3 },
        { department: "TRAINING_DEVELOPMENT", plannedCount: 2 },
      ];

      const summary = departmentPlans.map((plan) => {
        const actual = departmentActuals.find(
          (a) => a.department === plan.department
        );
        const actualCount = actual?._count?.id || 0;
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

      // Add departments with actual employees but no plan
      for (const actual of departmentActuals) {
        const existsInPlan = departmentPlans.find(
          (p) => p.department === actual.department
        );

        if (!existsInPlan && actual.department) {
          summary.push({
            department: actual.department,
            planned: 0,
            actual: actual._count?.id || 0,
            variance: actual._count?.id || 0,
            variancePercentage: 100,
            status: "above",
          });
        }
      }

      return res.status(200).json({
        message: "Department summary retrieved successfully",
        data: summary.sort((a, b) => a.department.localeCompare(b.department)),
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
          typeof plan.plannedCount !== 'number' ||
          !plan.targetDate
        ) {
          return res.status(400).json({
            message:
              "Each plan item must have department, position, plannedCount (number), and targetDate",
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