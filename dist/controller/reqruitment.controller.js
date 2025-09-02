"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentFormController = void 0;
const client_1 = require("@prisma/client");
const cludinary_1 = require("../services/cludinary");
const prisma = new client_1.PrismaClient();
class RecruitmentFormController {
    getCloudinaryFolder(fieldname) {
        if (fieldname === "documentPhoto") {
            return "rec_avatar";
        }
        if ([
            "documentCv",
            "documentKtp",
            "documentSkck",
            "documentVaccine",
            "supportingDocs",
        ].includes(fieldname)) {
            return "rec_docs";
        }
        return "general_uploads";
    }
    async cleanupFiles(files) {
        for (const [fieldname, fileArray] of Object.entries(files)) {
            for (const file of fileArray) {
                try {
                    const urlParts = file.path.split("/");
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split(".")[0];
                    const folder = this.getCloudinaryFolder(fieldname);
                    const fullPublicId = `${folder}/${publicId}`;
                    await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
                }
                catch (cleanupError) {
                    console.error(`Error cleaning up file ${fieldname}:`, cleanupError);
                }
            }
        }
    }
    async deleteOldFile(oldUrl, fieldname) {
        try {
            const urlParts = oldUrl.split("/");
            const fileName = urlParts[urlParts.length - 1];
            const publicId = fileName.split(".")[0];
            const folder = this.getCloudinaryFolder(fieldname);
            const fullPublicId = `${folder}/${publicId}`;
            await cludinary_1.cloudinary.uploader.destroy(fullPublicId);
        }
        catch (deleteError) {
            console.error(`Error deleting old ${fieldname}:`, deleteError);
        }
    }
    async deleteAllFiles(existingForm) {
        const fileFields = [
            { field: "documentPhotoUrl", fieldname: "documentPhoto" },
            { field: "documentCvUrl", fieldname: "documentCv" },
            { field: "documentKtpUrl", fieldname: "documentKtp" },
            { field: "documentSkckUrl", fieldname: "documentSkck" },
            { field: "documentVaccineUrl", fieldname: "documentVaccine" },
            { field: "supportingDocsUrl", fieldname: "supportingDocs" },
        ];
        for (const { field, fieldname } of fileFields) {
            const fileUrl = existingForm[field];
            if (fileUrl) {
                await this.deleteOldFile(fileUrl, fieldname);
            }
        }
    }
    async generateEmployeeId(department) {
        const departmentPrefixes = {
            PRODUCTION_ENGINEERING: "PE",
            OPERATIONAL: "OP",
            PLANT: "PL",
            LOGISTIC: "LG",
            HUMAN_RESOURCES_GA: "HR",
            HEALTH_SAFETY_ENVIRONMENT: "HSE",
            PURCHASING: "PUR",
            INFORMATION_TECHNOLOGY: "IT",
            MEDICAL: "MED",
            TRAINING_DEVELOPMENT: "TD",
        };
        const prefix = departmentPrefixes[department];
        const year = new Date().getFullYear().toString().slice(-2);
        const lastEmployee = await prisma.hiredEmployee.findFirst({
            where: {
                employeeId: {
                    startsWith: `${prefix}${year}`,
                },
            },
            orderBy: {
                employeeId: "desc",
            },
        });
        let nextNumber = 1;
        if (lastEmployee) {
            const lastNumber = parseInt(lastEmployee.employeeId.slice(-4));
            nextNumber = lastNumber + 1;
        }
        return `${prefix}${year}${nextNumber.toString().padStart(4, "0")}`;
    }
    async migrateToHiredEmployee(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can migrate hired employees",
                });
            }
            const { recruitmentFormId, employeeId, hiredPosition, department, startDate, probationEndDate, contractType = client_1.ContractType.PERMANENT, basicSalary, allowances, supervisorId, workLocation, shiftPattern = client_1.ShiftPattern.DAY_SHIFT, emergencyContactName, emergencyContactPhone, } = req.body;
            if (!recruitmentFormId || !hiredPosition || !department || !startDate) {
                return res.status(400).json({
                    message: "Recruitment form ID, hired position, department, and start date are required",
                });
            }
            const recruitmentForm = await prisma.recruitmentForm.findUnique({
                where: { id: recruitmentFormId },
                include: { hiredEmployee: true },
            });
            if (!recruitmentForm) {
                return res.status(404).json({
                    message: "Recruitment form not found",
                });
            }
            if (recruitmentForm.status !== client_1.RecruitmentStatus.HIRED) {
                return res.status(400).json({
                    message: "Only candidates with HIRED status can be migrated to employees",
                });
            }
            if (recruitmentForm.hiredEmployee) {
                return res.status(400).json({
                    message: "This candidate has already been migrated to hired employee",
                });
            }
            if (!Object.values(client_1.Position).includes(hiredPosition)) {
                return res.status(400).json({ message: "Invalid hired position" });
            }
            if (!Object.values(client_1.Department).includes(department)) {
                return res.status(400).json({ message: "Invalid department" });
            }
            if (contractType && !Object.values(client_1.ContractType).includes(contractType)) {
                return res.status(400).json({ message: "Invalid contract type" });
            }
            if (shiftPattern && !Object.values(client_1.ShiftPattern).includes(shiftPattern)) {
                return res.status(400).json({ message: "Invalid shift pattern" });
            }
            if (supervisorId) {
                const supervisor = await prisma.hiredEmployee.findUnique({
                    where: { id: supervisorId },
                });
                if (!supervisor) {
                    return res.status(400).json({ message: "Supervisor not found" });
                }
            }
            let finalEmployeeId = employeeId;
            if (!finalEmployeeId) {
                finalEmployeeId = await this.generateEmployeeId(department);
            }
            else {
                const existingEmployee = await prisma.hiredEmployee.findUnique({
                    where: { employeeId: finalEmployeeId },
                });
                if (existingEmployee) {
                    return res.status(400).json({
                        message: "Employee ID already exists",
                    });
                }
            }
            const startDateTime = new Date(startDate);
            let probationEndDateTime = null;
            if (probationEndDate) {
                probationEndDateTime = new Date(probationEndDate);
                if (probationEndDateTime <= startDateTime) {
                    return res.status(400).json({
                        message: "Probation end date must be after start date",
                    });
                }
            }
            const hiredEmployee = await prisma.hiredEmployee.create({
                data: {
                    employeeId: finalEmployeeId,
                    recruitmentFormId,
                    hiredPosition,
                    department,
                    startDate: startDateTime,
                    probationEndDate: probationEndDateTime,
                    employmentStatus: client_1.EmploymentStatus.PROBATION,
                    contractType,
                    basicSalary: basicSalary ? parseFloat(basicSalary.toString()) : null,
                    allowances,
                    supervisorId,
                    workLocation,
                    shiftPattern,
                    emergencyContactName,
                    emergencyContactPhone,
                    processedById: req.user.id,
                },
                include: {
                    recruitmentForm: {
                        select: {
                            fullName: true,
                            appliedPosition: true,
                        },
                    },
                    supervisor: {
                        select: {
                            employeeId: true,
                            recruitmentForm: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                    processedBy: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            return res.status(201).json({
                message: "Candidate successfully migrated to hired employee",
                hiredEmployee,
            });
        }
        catch (error) {
            console.error("Error migrating to hired employee:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getCandidatesReadyForHiring(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view candidates ready for hiring",
                });
            }
            const candidates = await prisma.recruitmentForm.findMany({
                where: {
                    status: client_1.RecruitmentStatus.HIRED,
                    hiredEmployee: null,
                },
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    fullName: true,
                    appliedPosition: true,
                    whatsappNumber: true,
                    education: true,
                    province: true,
                    updatedAt: true,
                },
            });
            return res.status(200).json({
                message: "Candidates ready for hiring retrieved successfully",
                candidates,
                count: candidates.length,
            });
        }
        catch (error) {
            console.error("Error getting candidates ready for hiring:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async createRecruitmentForm(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can create recruitment forms",
                });
            }
            const { fullName, birthPlace, birthDate, province, heightCm, weightKg, shirtSize, safetyShoesSize, pantsSize, address, whatsappNumber, certificate, education, schoolName, workExperience, maritalStatus, appliedPosition, status = client_1.RecruitmentStatus.PENDING, experienceLevel = "FRESH_GRADUATED", } = req.body;
            if (!fullName ||
                !birthPlace ||
                !birthDate ||
                !province ||
                !heightCm ||
                !weightKg ||
                !shirtSize ||
                !safetyShoesSize ||
                !pantsSize ||
                !address ||
                !whatsappNumber ||
                !education ||
                !schoolName ||
                !maritalStatus ||
                !appliedPosition ||
                !experienceLevel) {
                return res.status(400).json({
                    message: "All required fields must be provided",
                });
            }
            if (!Object.values(client_1.Province).includes(province)) {
                return res.status(400).json({ message: "Invalid province" });
            }
            if (!Object.values(client_1.ShirtSize).includes(shirtSize)) {
                return res.status(400).json({ message: "Invalid shirt size" });
            }
            if (!Object.values(client_1.SafetyShoesSize).includes(safetyShoesSize)) {
                return res.status(400).json({ message: "Invalid safety shoes size" });
            }
            if (!Object.values(client_1.PantsSize).includes(pantsSize)) {
                return res.status(400).json({ message: "Invalid pants size" });
            }
            if (!Object.values(client_1.EducationLevel).includes(education)) {
                return res.status(400).json({ message: "Invalid education level" });
            }
            if (!Object.values(client_1.MaritalStatus).includes(maritalStatus)) {
                return res.status(400).json({ message: "Invalid marital status" });
            }
            if (!Object.values(client_1.Position).includes(appliedPosition)) {
                return res.status(400).json({ message: "Invalid applied position" });
            }
            if (!Object.values(client_1.ExperienceLevel).includes(experienceLevel)) {
                return res.status(400).json({ message: "Invalid experience level" });
            }
            let certificateArray = [];
            if (certificate) {
                if (Array.isArray(certificate)) {
                    certificateArray = certificate;
                }
                else {
                    certificateArray = [certificate];
                }
                for (const cert of certificateArray) {
                    if (!Object.values(client_1.Certificate).includes(cert)) {
                        return res
                            .status(400)
                            .json({ message: `Invalid certificate: ${cert}` });
                    }
                }
            }
            const height = parseInt(heightCm);
            const weight = parseInt(weightKg);
            if (isNaN(height) || height < 100 || height > 250) {
                return res
                    .status(400)
                    .json({ message: "Height must be between 100-250 cm" });
            }
            if (isNaN(weight) || weight < 30 || weight > 200) {
                return res
                    .status(400)
                    .json({ message: "Weight must be between 30-200 kg" });
            }
            const files = req.files;
            const documentUrls = {};
            if (files) {
                if (files.documentPhoto)
                    documentUrls.documentPhotoUrl = files.documentPhoto[0].path;
                if (files.documentCv)
                    documentUrls.documentCvUrl = files.documentCv[0].path;
                if (files.documentKtp)
                    documentUrls.documentKtpUrl = files.documentKtp[0].path;
                if (files.documentSkck)
                    documentUrls.documentSkckUrl = files.documentSkck[0].path;
                if (files.documentVaccine)
                    documentUrls.documentVaccineUrl = files.documentVaccine[0].path;
                if (files.supportingDocs)
                    documentUrls.supportingDocsUrl = files.supportingDocs[0].path;
            }
            const newRecruitmentForm = await prisma.recruitmentForm.create({
                data: {
                    fullName: fullName.trim(),
                    birthPlace: birthPlace.trim(),
                    birthDate: new Date(birthDate),
                    province,
                    heightCm: height,
                    weightKg: weight,
                    shirtSize,
                    safetyShoesSize,
                    pantsSize,
                    address: address.trim(),
                    whatsappNumber: whatsappNumber.trim(),
                    certificate: certificateArray,
                    education,
                    schoolName: schoolName.trim(),
                    workExperience: workExperience?.trim(),
                    maritalStatus,
                    status,
                    appliedPosition,
                    experienceLevel,
                    ...documentUrls,
                },
            });
            return res.status(201).json({
                message: "Recruitment form created successfully",
                recruitmentForm: newRecruitmentForm,
            });
        }
        catch (error) {
            console.error("Error creating recruitment form:", error);
            if (req.files) {
                const files = req.files;
                await this.cleanupFiles(files);
            }
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getRecruitmentForms(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view recruitment forms",
                });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);
            const search = req.query.search;
            const status = req.query.status;
            const province = req.query.province;
            const education = req.query.education;
            const position = req.query.appliedPosition;
            const certificate = req.query.certificate;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (search) {
                whereClause.OR = [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { whatsappNumber: { contains: search } },
                    { address: { contains: search, mode: "insensitive" } },
                ];
            }
            if (startDate) {
                whereClause.createdAt = {
                    ...whereClause.createdAt,
                    gte: new Date(startDate),
                };
            }
            if (endDate) {
                whereClause.createdAt = {
                    ...whereClause.createdAt,
                    lte: new Date(endDate),
                };
            }
            if (position && Object.values(client_1.Position).includes(position)) {
                whereClause.appliedPosition = position;
            }
            if (certificate) {
                const certificateArray = certificate
                    .split(",")
                    .filter((cert) => cert.trim());
                const validCertificates = certificateArray.filter((cert) => Object.values(client_1.Certificate).includes(cert.trim()));
                if (validCertificates.length > 0) {
                    whereClause.certificate = {
                        hasSome: validCertificates,
                    };
                }
            }
            if (status &&
                Object.values(client_1.RecruitmentStatus).includes(status)) {
                whereClause.status = status;
            }
            if (province && Object.values(client_1.Province).includes(province)) {
                whereClause.province = province;
            }
            if (education &&
                Object.values(client_1.EducationLevel).includes(education)) {
                whereClause.education = education;
            }
            const [recruitmentForms, total] = await Promise.all([
                prisma.recruitmentForm.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        statusUpdatedBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }),
                prisma.recruitmentForm.count({
                    where: whereClause,
                }),
            ]);
            return res.status(200).json({
                message: "Recruitment forms retrieved successfully",
                recruitmentForms,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1,
                },
            });
        }
        catch (error) {
            console.error("Error getting recruitment forms:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getRecruitmentFormById(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view recruitment forms",
                });
            }
            const { id } = req.params;
            const recruitmentForm = await prisma.recruitmentForm.findUnique({
                where: { id },
                include: {
                    statusUpdatedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    hiredEmployee: {
                        select: {
                            employeeId: true,
                            department: true,
                            startDate: true,
                            employmentStatus: true,
                        },
                    },
                },
            });
            if (!recruitmentForm) {
                return res.status(404).json({
                    message: "Recruitment form not found",
                });
            }
            return res.status(200).json({
                message: "Recruitment form retrieved successfully",
                recruitmentForm,
            });
        }
        catch (error) {
            console.error("Error getting recruitment form:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async updateRecruitmentForm(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can update recruitment forms",
                });
            }
            const { id } = req.params;
            const updateData = req.body;
            const existingForm = await prisma.recruitmentForm.findUnique({
                where: { id },
                include: { hiredEmployee: true },
            });
            if (!existingForm) {
                return res.status(404).json({
                    message: "Recruitment form not found",
                });
            }
            if (existingForm.hiredEmployee && updateData.status !== client_1.RecruitmentStatus.HIRED) {
                return res.status(400).json({
                    message: "Cannot update recruitment form that has been migrated to hired employee",
                });
            }
            if (updateData.province &&
                !Object.values(client_1.Province).includes(updateData.province)) {
                return res.status(400).json({ message: "Invalid province" });
            }
            if (updateData.shirtSize &&
                !Object.values(client_1.ShirtSize).includes(updateData.shirtSize)) {
                return res.status(400).json({ message: "Invalid shirt size" });
            }
            if (updateData.safetyShoesSize &&
                !Object.values(client_1.SafetyShoesSize).includes(updateData.safetyShoesSize)) {
                return res.status(400).json({ message: "Invalid safety shoes size" });
            }
            if (updateData.pantsSize &&
                !Object.values(client_1.PantsSize).includes(updateData.pantsSize)) {
                return res.status(400).json({ message: "Invalid pants size" });
            }
            if (updateData.education &&
                !Object.values(client_1.EducationLevel).includes(updateData.education)) {
                return res.status(400).json({ message: "Invalid education level" });
            }
            if (updateData.maritalStatus &&
                !Object.values(client_1.MaritalStatus).includes(updateData.maritalStatus)) {
                return res.status(400).json({ message: "Invalid marital status" });
            }
            if (updateData.status &&
                !Object.values(client_1.RecruitmentStatus).includes(updateData.status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            if (updateData.appliedPosition &&
                !Object.values(client_1.Position).includes(updateData.appliedPosition)) {
                return res.status(400).json({ message: "Invalid applied position" });
            }
            if (updateData.certificate) {
                let certificateArray;
                if (Array.isArray(updateData.certificate)) {
                    certificateArray = updateData.certificate;
                }
                else {
                    certificateArray = [updateData.certificate];
                }
                for (const cert of certificateArray) {
                    if (!Object.values(client_1.Certificate).includes(cert)) {
                        return res
                            .status(400)
                            .json({ message: `Invalid certificate: ${cert}` });
                    }
                }
                updateData.certificate = certificateArray;
            }
            if (updateData.heightCm) {
                const height = parseInt(updateData.heightCm);
                if (isNaN(height) || height < 100 || height > 250) {
                    return res
                        .status(400)
                        .json({ message: "Height must be between 100-250 cm" });
                }
                updateData.heightCm = height;
            }
            if (updateData.weightKg) {
                const weight = parseInt(updateData.weightKg);
                if (isNaN(weight) || weight < 30 || weight > 200) {
                    return res
                        .status(400)
                        .json({ message: "Weight must be between 30-200 kg" });
                }
                updateData.weightKg = weight;
            }
            if (updateData.birthDate) {
                updateData.birthDate = new Date(updateData.birthDate);
            }
            const stringFields = [
                "fullName",
                "birthPlace",
                "address",
                "whatsappNumber",
                "schoolName",
                "workExperience",
            ];
            stringFields.forEach((field) => {
                if (updateData[field]) {
                    updateData[field] = updateData[field].trim();
                }
            });
            const files = req.files;
            if (files) {
                const oldFileFields = [
                    { field: "documentPhotoUrl", uploadField: "documentPhoto" },
                    { field: "documentCvUrl", uploadField: "documentCv" },
                    { field: "documentKtpUrl", uploadField: "documentKtp" },
                    { field: "documentSkckUrl", uploadField: "documentSkck" },
                    { field: "documentVaccineUrl", uploadField: "documentVaccine" },
                    { field: "supportingDocsUrl", uploadField: "supportingDocs" },
                ];
                for (const { field, uploadField } of oldFileFields) {
                    if (files[uploadField] &&
                        existingForm[field]) {
                        const oldUrl = existingForm[field];
                        await this.deleteOldFile(oldUrl, uploadField);
                    }
                }
                if (files.documentPhoto)
                    updateData.documentPhotoUrl = files.documentPhoto[0].path;
                if (files.documentCv)
                    updateData.documentCvUrl = files.documentCv[0].path;
                if (files.documentKtp)
                    updateData.documentKtpUrl = files.documentKtp[0].path;
                if (files.documentSkck)
                    updateData.documentSkckUrl = files.documentSkck[0].path;
                if (files.documentVaccine)
                    updateData.documentVaccineUrl = files.documentVaccine[0].path;
                if (files.supportingDocs)
                    updateData.supportingDocsUrl = files.supportingDocs[0].path;
            }
            if (updateData.status && updateData.status !== existingForm.status) {
                updateData.statusUpdatedById = req.user.id;
                updateData.statusUpdatedAt = new Date();
            }
            const updatedForm = await prisma.recruitmentForm.update({
                where: { id },
                data: updateData,
                include: {
                    statusUpdatedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    hiredEmployee: {
                        select: {
                            employeeId: true,
                            department: true,
                            startDate: true,
                            employmentStatus: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Recruitment form updated successfully",
                recruitmentForm: updatedForm,
            });
        }
        catch (error) {
            console.error("Error updating recruitment form:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async deleteRecruitmentForm(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can delete recruitment forms",
                });
            }
            const { id } = req.params;
            const existingForm = await prisma.recruitmentForm.findUnique({
                where: { id },
            });
            if (!existingForm) {
                return res.status(404).json({
                    message: "Recruitment form not found",
                });
            }
            await this.deleteAllFiles(existingForm);
            await prisma.recruitmentForm.delete({
                where: { id },
            });
            return res.status(200).json({
                message: "Recruitment form deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting recruitment form:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async getRecruitmentStats(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can view recruitment statistics",
                });
            }
            const [totalForms, statusStats, provinceStats, educationStats, recentForms,] = await Promise.all([
                prisma.recruitmentForm.count(),
                prisma.recruitmentForm.groupBy({
                    by: ["status"],
                    _count: { status: true },
                }),
                prisma.recruitmentForm.groupBy({
                    by: ["province"],
                    _count: { province: true },
                    orderBy: { _count: { province: "desc" } },
                    take: 5,
                }),
                prisma.recruitmentForm.groupBy({
                    by: ["education"],
                    _count: { education: true },
                    orderBy: { _count: { education: "desc" } },
                }),
                prisma.recruitmentForm.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
            ]);
            return res.status(200).json({
                message: "Recruitment statistics retrieved successfully",
                stats: {
                    totalForms,
                    recentForms,
                    statusBreakdown: statusStats.map((stat) => ({
                        status: stat.status,
                        count: stat._count.status,
                    })),
                    topProvinces: provinceStats.map((stat) => ({
                        province: stat.province,
                        count: stat._count.province,
                    })),
                    educationBreakdown: educationStats.map((stat) => ({
                        education: stat.education,
                        count: stat._count.education,
                    })),
                },
            });
        }
        catch (error) {
            console.error("Error getting recruitment statistics:", error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
    async updateRecruitmentStatus(req, res) {
        try {
            if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
                return res.status(403).json({
                    message: "Access denied. Only HR or ADMIN can update recruitment status",
                });
            }
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !Object.values(client_1.RecruitmentStatus).includes(status)) {
                return res.status(400).json({
                    message: "Valid status is required",
                });
            }
            const updatedForm = await prisma.recruitmentForm.update({
                where: { id },
                data: {
                    status,
                    statusUpdatedById: req.user.id,
                    statusUpdatedAt: new Date()
                },
                select: {
                    id: true,
                    fullName: true,
                    status: true,
                    statusUpdatedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    statusUpdatedAt: true,
                    updatedAt: true,
                },
            });
            return res.status(200).json({
                message: "Recruitment status updated successfully",
                recruitmentForm: updatedForm,
            });
        }
        catch (error) {
            console.error("Error updating recruitment status:", error);
            if (error.code === "P2025") {
                return res.status(404).json({ message: "Recruitment form not found" });
            }
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
}
exports.RecruitmentFormController = RecruitmentFormController;
