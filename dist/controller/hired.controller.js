"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiredEmployeeController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class HiredEmployeeController {
    async getHiredEmployees(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view hired employees",
                });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);
            const skip = (page - 1) * limit;
            const filters = {
                search: req.query.search,
                department: req.query.department,
                position: req.query.position,
                employmentStatus: req.query.employmentStatus,
                contractType: req.query.contractType,
                shiftPattern: req.query.shiftPattern,
                supervisorId: req.query.supervisorId,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                startDateFrom: req.query.startDateFrom,
                startDateTo: req.query.startDateTo,
                probationEndDateFrom: req.query.probationEndDateFrom,
                probationEndDateTo: req.query.probationEndDateTo,
                hiredDateFrom: req.query.hiredDateFrom,
                hiredDateTo: req.query.hiredDateTo,
                salaryMin: req.query.salaryMin ? parseFloat(req.query.salaryMin) : undefined,
                salaryMax: req.query.salaryMax ? parseFloat(req.query.salaryMax) : undefined,
                workLocation: req.query.workLocation,
                terminationDateFrom: req.query.terminationDateFrom,
                terminationDateTo: req.query.terminationDateTo,
            };
            const whereClause = {};
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
            if (filters.department && Object.values(client_1.Department).includes(filters.department)) {
                whereClause.department = filters.department;
            }
            if (filters.position && Object.values(client_1.Position).includes(filters.position)) {
                whereClause.hiredPosition = filters.position;
            }
            if (filters.employmentStatus && Object.values(client_1.EmploymentStatus).includes(filters.employmentStatus)) {
                whereClause.employmentStatus = filters.employmentStatus;
            }
            if (filters.contractType && Object.values(client_1.ContractType).includes(filters.contractType)) {
                whereClause.contractType = filters.contractType;
            }
            if (filters.shiftPattern && Object.values(client_1.ShiftPattern).includes(filters.shiftPattern)) {
                whereClause.shiftPattern = filters.shiftPattern;
            }
            if (filters.supervisorId) {
                whereClause.supervisorId = filters.supervisorId;
            }
            if (filters.isActive !== undefined) {
                whereClause.isActive = filters.isActive;
            }
            if (filters.workLocation) {
                whereClause.workLocation = { contains: filters.workLocation, mode: "insensitive" };
            }
            if (filters.startDateFrom || filters.startDateTo) {
                whereClause.startDate = {};
                if (filters.startDateFrom) {
                    whereClause.startDate.gte = new Date(filters.startDateFrom);
                }
                if (filters.startDateTo) {
                    whereClause.startDate.lte = new Date(filters.startDateTo);
                }
            }
            if (filters.probationEndDateFrom || filters.probationEndDateTo) {
                whereClause.probationEndDate = {};
                if (filters.probationEndDateFrom) {
                    whereClause.probationEndDate.gte = new Date(filters.probationEndDateFrom);
                }
                if (filters.probationEndDateTo) {
                    whereClause.probationEndDate.lte = new Date(filters.probationEndDateTo);
                }
            }
            if (filters.hiredDateFrom || filters.hiredDateTo) {
                whereClause.hiredDate = {};
                if (filters.hiredDateFrom) {
                    whereClause.hiredDate.gte = new Date(filters.hiredDateFrom);
                }
                if (filters.hiredDateTo) {
                    whereClause.hiredDate.lte = new Date(filters.hiredDateTo);
                }
            }
            if (filters.terminationDateFrom || filters.terminationDateTo) {
                whereClause.terminationDate = {};
                if (filters.terminationDateFrom) {
                    whereClause.terminationDate.gte = new Date(filters.terminationDateFrom);
                }
                if (filters.terminationDateTo) {
                    whereClause.terminationDate.lte = new Date(filters.terminationDateTo);
                }
            }
            if (filters.salaryMin || filters.salaryMax) {
                whereClause.basicSalary = {};
                if (filters.salaryMin) {
                    whereClause.basicSalary.gte = filters.salaryMin;
                }
                if (filters.salaryMax) {
                    whereClause.basicSalary.lte = filters.salaryMax;
                }
            }
            const [hiredEmployees, total] = await Promise.all([
                prisma.hiredEmployee.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: [
                        { isActive: "desc" },
                        { hiredDate: "desc" }
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
                }),
                prisma.hiredEmployee.count({
                    where: whereClause,
                }),
            ]);
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
                whatsappNumber: employee.recruitmentForm.whatsappNumber,
                province: employee.recruitmentForm.province,
                education: employee.recruitmentForm.education,
                appliedPosition: employee.recruitmentForm.appliedPosition,
                supervisor: employee.supervisor ? {
                    employeeId: employee.supervisor.employeeId,
                    fullName: employee.supervisor.recruitmentForm.fullName,
                } : null,
                subordinatesCount: employee.subordinates.length,
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
                    ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined))
                }
            });
        }
        catch (error) {
            console.error("Error getting hired employees:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getHiredEmployeeById(req, res) {
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
                    recruitmentForm: true,
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
        }
        catch (error) {
            console.error("Error getting hired employee:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getHiredEmployeesStats(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view statistics",
                });
            }
            const [totalEmployees, activeEmployees, departmentStats, employmentStatusStats, contractTypeStats, shiftPatternStats, recentHires, avgSalaryByDepartment, probationaryEmployees,] = await Promise.all([
                prisma.hiredEmployee.count(),
                prisma.hiredEmployee.count({
                    where: { isActive: true }
                }),
                prisma.hiredEmployee.groupBy({
                    by: ["department"],
                    _count: { department: true },
                    where: { isActive: true },
                    orderBy: { _count: { department: "desc" } },
                }),
                prisma.hiredEmployee.groupBy({
                    by: ["employmentStatus"],
                    _count: { employmentStatus: true },
                    where: { isActive: true },
                    orderBy: { _count: { employmentStatus: "desc" } },
                }),
                prisma.hiredEmployee.groupBy({
                    by: ["contractType"],
                    _count: { contractType: true },
                    where: { isActive: true },
                    orderBy: { _count: { contractType: "desc" } },
                }),
                prisma.hiredEmployee.groupBy({
                    by: ["shiftPattern"],
                    _count: { shiftPattern: true },
                    where: { isActive: true },
                    orderBy: { _count: { shiftPattern: "desc" } },
                }),
                prisma.hiredEmployee.count({
                    where: {
                        hiredDate: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                        isActive: true,
                    },
                }),
                prisma.hiredEmployee.groupBy({
                    by: ["department"],
                    _avg: { basicSalary: true },
                    _count: { department: true },
                    where: {
                        isActive: true,
                        basicSalary: { not: null },
                    },
                }),
                prisma.hiredEmployee.count({
                    where: {
                        employmentStatus: client_1.EmploymentStatus.PROBATION,
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
        }
        catch (error) {
            console.error("Error getting hired employees statistics:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getAvailableSupervisors(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view supervisors",
                });
            }
            const department = req.query.department;
            const whereClause = {
                isActive: true,
                employmentStatus: {
                    in: [client_1.EmploymentStatus.PERMANENT, client_1.EmploymentStatus.CONTRACT]
                }
            };
            if (department && Object.values(client_1.Department).includes(department)) {
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
        }
        catch (error) {
            console.error("Error getting available supervisors:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async updateHiredEmployee(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can update hired employees",
                });
            }
            const { id } = req.params;
            const updateData = req.body;
            const existingEmployee = await prisma.hiredEmployee.findUnique({
                where: { id },
            });
            if (!existingEmployee) {
                return res.status(404).json({
                    message: "Hired employee not found",
                });
            }
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
            if (updateData.supervisorId) {
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
                const supervisorChain = await this.checkCircularSupervision(updateData.supervisorId, id);
                if (supervisorChain) {
                    return res.status(400).json({
                        message: "Circular supervision detected. This assignment would create a supervision loop.",
                    });
                }
            }
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
            if (updateData.basicSalary) {
                updateData.basicSalary = parseFloat(updateData.basicSalary);
            }
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
        }
        catch (error) {
            console.error("Error updating hired employee:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async deleteHiredEmployee(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can delete hired employees",
                });
            }
            const { id } = req.params;
            const { terminationReason, terminationDate, hardDelete = false } = req.body;
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
            if (existingEmployee.subordinates.length > 0) {
                return res.status(400).json({
                    message: `Cannot delete employee with ${existingEmployee.subordinates.length} active subordinate(s). Please reassign subordinates first.`,
                    subordinatesCount: existingEmployee.subordinates.length,
                });
            }
            if (hardDelete) {
                await prisma.hiredEmployee.delete({
                    where: { id },
                });
                return res.status(200).json({
                    message: "Hired employee permanently deleted",
                });
            }
            else {
                const deletionDate = terminationDate ? new Date(terminationDate) : new Date();
                const updatedEmployee = await prisma.hiredEmployee.update({
                    where: { id },
                    data: {
                        isActive: false,
                        terminationDate: deletionDate,
                        terminationReason: terminationReason || "Employee record deactivated",
                        employmentStatus: client_1.EmploymentStatus.TERMINATED,
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
        }
        catch (error) {
            console.error("Error deleting hired employee:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async restoreHiredEmployee(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can restore hired employees",
                });
            }
            const { id } = req.params;
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
            const restoredEmployee = await prisma.hiredEmployee.update({
                where: { id },
                data: {
                    isActive: true,
                    terminationDate: null,
                    terminationReason: null,
                    employmentStatus: client_1.EmploymentStatus.PERMANENT,
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
        }
        catch (error) {
            console.error("Error restoring hired employee:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async checkCircularSupervision(supervisorId, employeeId) {
        let currentSupervisorId = supervisorId;
        const visitedIds = new Set();
        while (currentSupervisorId) {
            if (currentSupervisorId === employeeId) {
                return true;
            }
            if (visitedIds.has(currentSupervisorId)) {
                return true;
            }
            visitedIds.add(currentSupervisorId);
            const supervisor = await prisma.hiredEmployee.findUnique({
                where: { id: currentSupervisorId },
                select: { supervisorId: true }
            });
            currentSupervisorId = supervisor?.supervisorId || null;
        }
        return false;
    }
}
exports.HiredEmployeeController = HiredEmployeeController;
