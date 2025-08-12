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
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (search) {
                whereClause.OR = [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { whatsappNumber: { contains: search } },
                    { address: { contains: search, mode: "insensitive" } },
                ];
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
            });
            if (!existingForm) {
                return res.status(404).json({
                    message: "Recruitment form not found",
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
            const updatedForm = await prisma.recruitmentForm.update({
                where: { id },
                data: updateData,
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
                data: { status },
                select: {
                    id: true,
                    fullName: true,
                    status: true,
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
