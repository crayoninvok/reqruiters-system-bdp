import { Request, Response } from "express";
import {
  PrismaClient,
  User,
  Position,
  Department,
  EmploymentStatus,
  ContractType,
  ShiftPattern,
} from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface HiredEmployeeFilters {
  search?: string;
  department?: Department;
  position?: Position;
  employmentStatus?: EmploymentStatus;
  contractType?: ContractType;
  shiftPattern?: ShiftPattern;
  supervisorId?: string;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  probationEndDateFrom?: string;
  probationEndDateTo?: string;
  hiredDateFrom?: string;
  hiredDateTo?: string;
  salaryMin?: number;
  salaryMax?: number;
  workLocation?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

export class HiredEmployeeController {
  // Get all hired employees with comprehensive filtering
  async getHiredEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message: "Access denied. Only HR or ADMIN can view hired employees",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const skip = (page - 1) * limit;

      // Extract filter parameters
      const filters: HiredEmployeeFilters = {
        search: req.query.search as string,
        department: req.query.department as Department,
        position: req.query.position as Position,
        employmentStatus: req.query.employmentStatus as EmploymentStatus,
        contractType: req.query.contractType as ContractType,
        shiftPattern: req.query.shiftPattern as ShiftPattern,
        supervisorId: req.query.supervisorId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        startDateFrom: req.query.startDateFrom as string,
        startDateTo: req.query.startDateTo as string,
        probationEndDateFrom: req.query.probationEndDateFrom as string,
        probationEndDateTo: req.query.probationEndDateTo as string,
        hiredDateFrom: req.query.hiredDateFrom as string,
        hiredDateTo: req.query.hiredDateTo as string,
        salaryMin: req.query.salaryMin ? parseFloat(req.query.salaryMin as string) : undefined,
        salaryMax: req.query.salaryMax ? parseFloat(req.query.salaryMax as string) : undefined,
        workLocation: req.query.workLocation as string,
        terminationDateFrom: req.query.terminationDateFrom as string,
        terminationDateTo: req.query.terminationDateTo as string,
      };

      // Build where clause for filtering
      const whereClause: any = {};

      // Search functionality (employee ID, name, work location)
      if (filters.search) {
        whereClause.OR = [
          { employeeId: { contains: filters.search, mode: "insensitive" } },
          { workLocation: { contains: filters.search, mode: "insensitive" } },
          { emergencyContactName: { contains: filters.search, mode: "insensitive" } },
          {
            recruitmentForm: {
              fullName: { contains: filters.search, mode: "insensitive" }
            }
          }
        ];
      }

      // Department filter
      if (filters.department && Object.values(Department).includes(filters.department)) {
        whereClause.department = filters.department;
      }

      // Position filter
      if (filters.position && Object.values(Position).includes(filters.position)) {
        whereClause.hiredPosition = filters.position;
      }

      // Employment status filter
      if (filters.employmentStatus && Object.values(EmploymentStatus).includes(filters.employmentStatus)) {
        whereClause.employmentStatus = filters.employmentStatus;
      }

      // Contract type filter
      if (filters.contractType && Object.values(ContractType).includes(filters.contractType)) {
        whereClause.contractType = filters.contractType;
      }

      // Shift pattern filter
      if (filters.shiftPattern && Object.values(ShiftPattern).includes(filters.shiftPattern)) {
        whereClause.shiftPattern = filters.shiftPattern;
      }

      // Supervisor filter
      if (filters.supervisorId) {
        whereClause.supervisorId = filters.supervisorId;
      }

      // Active status filter
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      // Work location filter
      if (filters.workLocation) {
        whereClause.workLocation = { contains: filters.workLocation, mode: "insensitive" };
      }

      // Start date range filter
      if (filters.startDateFrom || filters.startDateTo) {
        whereClause.startDate = {};
        if (filters.startDateFrom) {
          whereClause.startDate.gte = new Date(filters.startDateFrom);
        }
        if (filters.startDateTo) {
          whereClause.startDate.lte = new Date(filters.startDateTo);
        }
      }

      // Probation end date range filter
      if (filters.probationEndDateFrom || filters.probationEndDateTo) {
        whereClause.probationEndDate = {};
        if (filters.probationEndDateFrom) {
          whereClause.probationEndDate.gte = new Date(filters.probationEndDateFrom);
        }
        if (filters.probationEndDateTo) {
          whereClause.probationEndDate.lte = new Date(filters.probationEndDateTo);
        }
      }

      // Hired date range filter
      if (filters.hiredDateFrom || filters.hiredDateTo) {
        whereClause.hiredDate = {};
        if (filters.hiredDateFrom) {
          whereClause.hiredDate.gte = new Date(filters.hiredDateFrom);
        }
        if (filters.hiredDateTo) {
          whereClause.hiredDate.lte = new Date(filters.hiredDateTo);
        }
      }

      // Termination date range filter
      if (filters.terminationDateFrom || filters.terminationDateTo) {
        whereClause.terminationDate = {};
        if (filters.terminationDateFrom) {
          whereClause.terminationDate.gte = new Date(filters.terminationDateFrom);
        }
        if (filters.terminationDateTo) {
          whereClause.terminationDate.lte = new Date(filters.terminationDateTo);
        }
      }

      // Salary range filter
      if (filters.salaryMin || filters.salaryMax) {
        whereClause.basicSalary = {};
        if (filters.salaryMin) {
          whereClause.basicSalary.gte = filters.salaryMin;
        }
        if (filters.salaryMax) {
          whereClause.basicSalary.lte = filters.salaryMax;
        }
      }

      // Get hired employees with comprehensive data
      const [hiredEmployees, total] = await Promise.all([
        prisma.hiredEmployee.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: [
            { isActive: "desc" }, // Active employees first
            { hiredDate: "desc" }  // Then by hired date
          ],
          include: {
            recruitmentForm: {
              select: {
                fullName: true,
                whatsappNumber: true,
                province: true,
                education: true,
                appliedPosition: true,
              }
            },
            supervisor: {
              select: {
                employeeId: true,
                recruitmentForm: {
                  select: {
                    fullName: true,
                  }
                }
              }
            },
            subordinates: {
              select: {
                employeeId: true,
                recruitmentForm: {
                  select: {
                    fullName: true,
                  }
                }
              },
              where: {
                isActive: true, // Only show active subordinates
              }
            },
            processedBy: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }),
        prisma.hiredEmployee.count({
          where: whereClause,
        }),
      ]);

      // Transform the data for better frontend consumption
      const transformedEmployees = hiredEmployees.map(employee => ({
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: employee.recruitmentForm.fullName,
        hiredPosition: employee.hiredPosition,
        department: employee.department,
        startDate: employee.startDate,
        probationEndDate: employee.probationEndDate,
        employmentStatus: employee.employmentStatus,
        contractType: employee.contractType,
        basicSalary: employee.basicSalary,
        allowances: employee.allowances,
        workLocation: employee.workLocation,
        shiftPattern: employee.shiftPattern,
        isActive: employee.isActive,
        terminationDate: employee.terminationDate,
        terminationReason: employee.terminationReason,
        hiredDate: employee.hiredDate,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactPhone: employee.emergencyContactPhone,
        // Recruitment form data
        whatsappNumber: employee.recruitmentForm.whatsappNumber,
        province: employee.recruitmentForm.province,
        education: employee.recruitmentForm.education,
        appliedPosition: employee.recruitmentForm.appliedPosition,
        // Supervisor data
        supervisor: employee.supervisor ? {
          employeeId: employee.supervisor.employeeId,
          fullName: employee.supervisor.recruitmentForm.fullName,
        } : null,
        // Subordinates count
        subordinatesCount: employee.subordinates.length,
        // Processed by
        processedBy: {
          name: employee.processedBy.name,
          email: employee.processedBy.email,
        },
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      }));

      return res.status(200).json({
        message: "Hired employees retrieved successfully",
        employees: transformedEmployees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        appliedFilters: {
          ...filters,
          // Remove undefined values for cleaner response
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined)
          )
        }
      });
    } catch (error) {
      console.error("Error getting hired employees:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get single hired employee by ID
  async getHiredEmployeeById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message: "Access denied. Only HR or ADMIN can view hired employee details",
        });
      }

      const { id } = req.params;

      const employee = await prisma.hiredEmployee.findUnique({
        where: { id },
        include: {
          recruitmentForm: true, // Full recruitment form data
          supervisor: {
            include: {
              recruitmentForm: {
                select: {
                  fullName: true,
                }
              }
            }
          },
          subordinates: {
            include: {
              recruitmentForm: {
                select: {
                  fullName: true,
                }
              }
            },
            where: {
              isActive: true,
            }
          },
          processedBy: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      if (!employee) {
        return res.status(404).json({
          message: "Hired employee not found",
        });
      }

      return res.status(200).json({
        message: "Hired employee retrieved successfully",
        employee,
      });
    } catch (error) {
      console.error("Error getting hired employee:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get hired employees statistics
  async getHiredEmployeesStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message: "Access denied. Only HR or ADMIN can view statistics",
        });
      }

      const [
        totalEmployees,
        activeEmployees,
        departmentStats,
        employmentStatusStats,
        contractTypeStats,
        shiftPatternStats,
        recentHires,
        avgSalaryByDepartment,
        probationaryEmployees,
      ] = await Promise.all([
        // Total employees count
        prisma.hiredEmployee.count(),

        // Active employees count
        prisma.hiredEmployee.count({
          where: { isActive: true }
        }),

        // Department breakdown
        prisma.hiredEmployee.groupBy({
          by: ["department"],
          _count: { department: true },
          where: { isActive: true },
          orderBy: { _count: { department: "desc" } },
        }),

        // Employment status breakdown
        prisma.hiredEmployee.groupBy({
          by: ["employmentStatus"],
          _count: { employmentStatus: true },
          where: { isActive: true },
          orderBy: { _count: { employmentStatus: "desc" } },
        }),

        // Contract type breakdown
        prisma.hiredEmployee.groupBy({
          by: ["contractType"],
          _count: { contractType: true },
          where: { isActive: true },
          orderBy: { _count: { contractType: "desc" } },
        }),

        // Shift pattern breakdown
        prisma.hiredEmployee.groupBy({
          by: ["shiftPattern"],
          _count: { shiftPattern: true },
          where: { isActive: true },
          orderBy: { _count: { shiftPattern: "desc" } },
        }),

        // Recent hires (last 30 days)
        prisma.hiredEmployee.count({
          where: {
            hiredDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            isActive: true,
          },
        }),

        // Average salary by department
        prisma.hiredEmployee.groupBy({
          by: ["department"],
          _avg: { basicSalary: true },
          _count: { department: true },
          where: {
            isActive: true,
            basicSalary: { not: null },
          },
        }),

        // Probationary employees count
        prisma.hiredEmployee.count({
          where: {
            employmentStatus: EmploymentStatus.PROBATION,
            isActive: true,
          },
        }),
      ]);

      return res.status(200).json({
        message: "Hired employees statistics retrieved successfully",
        stats: {
          overview: {
            totalEmployees,
            activeEmployees,
            inactiveEmployees: totalEmployees - activeEmployees,
            recentHires,
            probationaryEmployees,
          },
          departmentBreakdown: departmentStats.map((stat) => ({
            department: stat.department,
            count: stat._count.department,
          })),
          employmentStatusBreakdown: employmentStatusStats.map((stat) => ({
            status: stat.employmentStatus,
            count: stat._count.employmentStatus,
          })),
          contractTypeBreakdown: contractTypeStats.map((stat) => ({
            type: stat.contractType,
            count: stat._count.contractType,
          })),
          shiftPatternBreakdown: shiftPatternStats.map((stat) => ({
            pattern: stat.shiftPattern,
            count: stat._count.shiftPattern,
          })),
          salaryInsights: avgSalaryByDepartment.map((stat) => ({
            department: stat.department,
            averageSalary: stat._avg.basicSalary,
            employeeCount: stat._count.department,
          })),
        },
      });
    } catch (error) {
      console.error("Error getting hired employees statistics:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get available supervisors for dropdown/selection
  async getAvailableSupervisors(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message: "Access denied. Only HR or ADMIN can view supervisors",
        });
      }

      const department = req.query.department as Department;

      const whereClause: any = {
        isActive: true,
        // Typically supervisors are permanent employees
        employmentStatus: {
          in: [EmploymentStatus.PERMANENT, EmploymentStatus.CONTRACT]
        }
      };

      // Filter by department if provided
      if (department && Object.values(Department).includes(department)) {
        whereClause.department = department;
      }

      const supervisors = await prisma.hiredEmployee.findMany({
        where: whereClause,
        select: {
          id: true,
          employeeId: true,
          hiredPosition: true,
          department: true,
          recruitmentForm: {
            select: {
              fullName: true,
            }
          }
        },
        orderBy: [
          { department: "asc" },
          { recruitmentForm: { fullName: "asc" } }
        ]
      });

      const transformedSupervisors = supervisors.map(supervisor => ({
        id: supervisor.id,
        employeeId: supervisor.employeeId,
        fullName: supervisor.recruitmentForm.fullName,
        position: supervisor.hiredPosition,
        department: supervisor.department,
      }));

      return res.status(200).json({
        message: "Available supervisors retrieved successfully",
        supervisors: transformedSupervisors,
      });
    } catch (error) {
      console.error("Error getting available supervisors:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
  // Update hired employee
async updateHiredEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    // Check if user is HR or ADMIN
    if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        message: "Access denied. Only HR or ADMIN can update hired employees",
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate that the employee exists
    const existingEmployee = await prisma.hiredEmployee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Hired employee not found",
      });
    }

    // Validate employeeId uniqueness if being updated
    if (updateData.employeeId && updateData.employeeId !== existingEmployee.employeeId) {
      const existingEmployeeId = await prisma.hiredEmployee.findUnique({
        where: { employeeId: updateData.employeeId },
      });

      if (existingEmployeeId) {
        return res.status(400).json({
          message: "Employee ID already exists",
        });
      }
    }

    // Validate supervisor exists and is active if supervisorId is provided
    if (updateData.supervisorId) {
      // Check if trying to set self as supervisor
      if (updateData.supervisorId === id) {
        return res.status(400).json({
          message: "Employee cannot be their own supervisor",
        });
      }

      const supervisor = await prisma.hiredEmployee.findUnique({
        where: { 
          id: updateData.supervisorId,
          isActive: true,
        },
      });

      if (!supervisor) {
        return res.status(400).json({
          message: "Supervisor not found or inactive",
        });
      }

      // Check for circular supervision (prevent A supervises B, B supervises A)
      const supervisorChain = await this.checkCircularSupervision(updateData.supervisorId, id);
      if (supervisorChain) {
        return res.status(400).json({
          message: "Circular supervision detected. This assignment would create a supervision loop.",
        });
      }
    }

    // Handle date validations
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.probationEndDate) {
      updateData.probationEndDate = new Date(updateData.probationEndDate);
    }
    if (updateData.hiredDate) {
      updateData.hiredDate = new Date(updateData.hiredDate);
    }
    if (updateData.terminationDate) {
      updateData.terminationDate = new Date(updateData.terminationDate);
    }

    // Validate date logic
    if (updateData.startDate && updateData.probationEndDate) {
      if (updateData.probationEndDate <= updateData.startDate) {
        return res.status(400).json({
          message: "Probation end date must be after start date",
        });
      }
    }

    if (updateData.terminationDate && updateData.startDate) {
      if (updateData.terminationDate <= updateData.startDate) {
        return res.status(400).json({
          message: "Termination date must be after start date",
        });
      }
    }

    // Convert salary to Decimal if provided
    if (updateData.basicSalary) {
      updateData.basicSalary = parseFloat(updateData.basicSalary);
    }

    // Update the employee
    const updatedEmployee = await prisma.hiredEmployee.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        recruitmentForm: {
          select: {
            fullName: true,
            whatsappNumber: true,
            province: true,
            education: true,
            appliedPosition: true,
          }
        },
        supervisor: {
          select: {
            employeeId: true,
            recruitmentForm: {
              select: {
                fullName: true,
              }
            }
          }
        },
        subordinates: {
          select: {
            employeeId: true,
            recruitmentForm: {
              select: {
                fullName: true,
              }
            }
          },
          where: {
            isActive: true,
          }
        },
        processedBy: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return res.status(200).json({
      message: "Hired employee updated successfully",
      employee: updatedEmployee,
    });

  } catch (error) {
    console.error("Error updating hired employee:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Soft delete hired employee (set inactive)
async deleteHiredEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    // Check if user is HR or ADMIN
    if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        message: "Access denied. Only HR or ADMIN can delete hired employees",
      });
    }

    const { id } = req.params;
    const { 
      terminationReason, 
      terminationDate,
      hardDelete = false // Optional parameter for permanent deletion
    } = req.body;

    // Validate that the employee exists
    const existingEmployee = await prisma.hiredEmployee.findUnique({
      where: { id },
      include: {
        subordinates: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Hired employee not found",
      });
    }

    // Check if employee has active subordinates
    if (existingEmployee.subordinates.length > 0) {
      return res.status(400).json({
        message: `Cannot delete employee with ${existingEmployee.subordinates.length} active subordinate(s). Please reassign subordinates first.`,
        subordinatesCount: existingEmployee.subordinates.length,
      });
    }

    if (hardDelete) {
      // Permanent deletion (use with caution)
      await prisma.hiredEmployee.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Hired employee permanently deleted",
      });
    } else {
      // Soft delete (recommended approach)
      const deletionDate = terminationDate ? new Date(terminationDate) : new Date();
      
      const updatedEmployee = await prisma.hiredEmployee.update({
        where: { id },
        data: {
          isActive: false,
          terminationDate: deletionDate,
          terminationReason: terminationReason || "Employee record deactivated",
          employmentStatus: EmploymentStatus.TERMINATED,
          updatedAt: new Date(),
        },
        include: {
          recruitmentForm: {
            select: {
              fullName: true,
            }
          }
        }
      });

      return res.status(200).json({
        message: "Hired employee deactivated successfully",
        employee: {
          id: updatedEmployee.id,
          employeeId: updatedEmployee.employeeId,
          fullName: updatedEmployee.recruitmentForm.fullName,
          isActive: updatedEmployee.isActive,
          terminationDate: updatedEmployee.terminationDate,
          terminationReason: updatedEmployee.terminationReason,
        },
      });
    }

  } catch (error) {
    console.error("Error deleting hired employee:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Restore deleted employee (reactivate)
async restoreHiredEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    // Check if user is HR or ADMIN
    if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        message: "Access denied. Only HR or ADMIN can restore hired employees",
      });
    }

    const { id } = req.params;

    // Validate that the employee exists and is inactive
    const existingEmployee = await prisma.hiredEmployee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Hired employee not found",
      });
    }

    if (existingEmployee.isActive) {
      return res.status(400).json({
        message: "Employee is already active",
      });
    }

    // Reactivate the employee
    const restoredEmployee = await prisma.hiredEmployee.update({
      where: { id },
      data: {
        isActive: true,
        terminationDate: null,
        terminationReason: null,
        employmentStatus: EmploymentStatus.PERMANENT, // or determine based on business logic
        updatedAt: new Date(),
      },
      include: {
        recruitmentForm: {
          select: {
            fullName: true,
          }
        }
      }
    });

    return res.status(200).json({
      message: "Hired employee restored successfully",
      employee: {
        id: restoredEmployee.id,
        employeeId: restoredEmployee.employeeId,
        fullName: restoredEmployee.recruitmentForm.fullName,
        isActive: restoredEmployee.isActive,
        employmentStatus: restoredEmployee.employmentStatus,
      },
    });

  } catch (error) {
    console.error("Error restoring hired employee:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Helper method to check for circular supervision
private async checkCircularSupervision(supervisorId: string, employeeId: string): Promise<boolean> {
  let currentSupervisorId: string | null = supervisorId;
  const visitedIds = new Set<string>();
  
  while (currentSupervisorId) {
    // If we encounter the original employee in the chain, we have a circle
    if (currentSupervisorId === employeeId) {
      return true;
    }
    
    // If we've seen this supervisor before, we have a different kind of circle
    if (visitedIds.has(currentSupervisorId)) {
      return true;
    }
    
    visitedIds.add(currentSupervisorId);
    
    // Get the next supervisor in the chain
    const supervisor: { supervisorId: string | null } | null = await prisma.hiredEmployee.findUnique({
      where: { id: currentSupervisorId },
      select: { supervisorId: true }
    });
    
    currentSupervisorId = supervisor?.supervisorId || null;
  }
  
  return false;
}
}