"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRecruitmentController = void 0;
const client_1 = require("@prisma/client");
const cludinary_1 = require("../services/cludinary");
const prisma = new client_1.PrismaClient();
class PublicRecruitmentController {
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
    async submitRecruitmentForm(req, res) {
        try {
            const { fullName, birthPlace, birthDate, province, heightCm, weightKg, shirtSize, safetyShoesSize, pantsSize, address, whatsappNumber, certificate, education, schoolName, workExperience, maritalStatus, appliedPosition, experienceLevel = "FRESH_GRADUATED", } = req.body;
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
                    error: "MISSING_REQUIRED_FIELDS"
                });
            }
            if (!Object.values(client_1.Province).includes(province)) {
                return res.status(400).json({
                    message: "Invalid province",
                    error: "INVALID_PROVINCE"
                });
            }
            if (!Object.values(client_1.ShirtSize).includes(shirtSize)) {
                return res.status(400).json({
                    message: "Invalid shirt size",
                    error: "INVALID_SHIRT_SIZE"
                });
            }
            if (!Object.values(client_1.SafetyShoesSize).includes(safetyShoesSize)) {
                return res.status(400).json({
                    message: "Invalid safety shoes size",
                    error: "INVALID_SAFETY_SHOES_SIZE"
                });
            }
            if (!Object.values(client_1.PantsSize).includes(pantsSize)) {
                return res.status(400).json({
                    message: "Invalid pants size",
                    error: "INVALID_PANTS_SIZE"
                });
            }
            if (!Object.values(client_1.EducationLevel).includes(education)) {
                return res.status(400).json({
                    message: "Invalid education level",
                    error: "INVALID_EDUCATION_LEVEL"
                });
            }
            if (!Object.values(client_1.MaritalStatus).includes(maritalStatus)) {
                return res.status(400).json({
                    message: "Invalid marital status",
                    error: "INVALID_MARITAL_STATUS"
                });
            }
            if (!Object.values(client_1.Position).includes(appliedPosition)) {
                return res.status(400).json({
                    message: "Invalid applied position",
                    error: "INVALID_APPLIED_POSITION"
                });
            }
            if (!Object.values(client_1.ExperienceLevel).includes(experienceLevel)) {
                return res.status(400).json({
                    message: "Invalid experience level",
                    error: "INVALID_EXPERIENCE_LEVEL"
                });
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
                        return res.status(400).json({
                            message: `Invalid certificate: ${cert}`,
                            error: "INVALID_CERTIFICATE"
                        });
                    }
                }
            }
            const height = parseInt(heightCm);
            const weight = parseInt(weightKg);
            if (isNaN(height) || height < 100 || height > 250) {
                return res.status(400).json({
                    message: "Height must be between 100-250 cm",
                    error: "INVALID_HEIGHT"
                });
            }
            if (isNaN(weight) || weight < 30 || weight > 200) {
                return res.status(400).json({
                    message: "Weight must be between 30-200 kg",
                    error: "INVALID_WEIGHT"
                });
            }
            const whatsappRegex = /^(\+62|62|0)[0-9]{8,13}$/;
            if (!whatsappRegex.test(whatsappNumber.replace(/\s+/g, ''))) {
                return res.status(400).json({
                    message: "Invalid WhatsApp number format",
                    error: "INVALID_WHATSAPP_NUMBER"
                });
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
                    whatsappNumber: whatsappNumber.replace(/\s+/g, ''),
                    certificate: certificateArray,
                    education,
                    schoolName: schoolName.trim(),
                    workExperience: workExperience?.trim(),
                    maritalStatus,
                    status: client_1.RecruitmentStatus.PENDING,
                    appliedPosition,
                    experienceLevel,
                    ...documentUrls,
                },
            });
            return res.status(201).json({
                message: "Recruitment form submitted successfully! We will review your application and contact you soon.",
                success: true,
                applicationId: newRecruitmentForm.id,
                submittedAt: newRecruitmentForm.createdAt,
            });
        }
        catch (error) {
            console.error("Error submitting recruitment form:", error);
            if (req.files) {
                const files = req.files;
                await this.cleanupFiles(files);
            }
            return res.status(500).json({
                message: "Internal server error. Please try again later.",
                error: "INTERNAL_SERVER_ERROR",
                success: false
            });
        }
    }
    async getFormOptions(req, res) {
        try {
            return res.status(200).json({
                message: "Form options retrieved successfully",
                options: {
                    provinces: Object.values(client_1.Province),
                    shirtSizes: Object.values(client_1.ShirtSize),
                    safetyShoeSizes: Object.values(client_1.SafetyShoesSize),
                    pantsSizes: Object.values(client_1.PantsSize),
                    certificates: Object.values(client_1.Certificate),
                    educationLevels: Object.values(client_1.EducationLevel),
                    maritalStatuses: Object.values(client_1.MaritalStatus),
                    positions: Object.values(client_1.Position),
                    experienceLevels: Object.values(client_1.ExperienceLevel),
                },
            });
        }
        catch (error) {
            console.error("Error getting form options:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async checkApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    message: "Application ID is required",
                    error: "MISSING_APPLICATION_ID"
                });
            }
            const application = await prisma.recruitmentForm.findUnique({
                where: { id },
                select: {
                    id: true,
                    fullName: true,
                    appliedPosition: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!application) {
                return res.status(404).json({
                    message: "Application not found",
                    error: "APPLICATION_NOT_FOUND"
                });
            }
            return res.status(200).json({
                message: "Application status retrieved successfully",
                application: {
                    id: application.id,
                    applicantName: application.fullName,
                    position: application.appliedPosition,
                    status: application.status,
                    submittedAt: application.createdAt,
                    lastUpdated: application.updatedAt,
                },
            });
        }
        catch (error) {
            console.error("Error checking application status:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    async generateUploadSignature(req, res) {
        try {
            const { fieldName } = req.body;
            const allowedFields = [
                'documentPhoto', 'documentCv', 'documentKtp',
                'documentSkck', 'documentVaccine', 'supportingDocs'
            ];
            if (!allowedFields.includes(fieldName)) {
                return res.status(400).json({
                    message: 'Invalid field name',
                    error: 'INVALID_FIELD'
                });
            }
            const folder = fieldName === 'documentPhoto' ? 'rec_avatar' : 'rec_docs';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const publicId = `${fieldName}-${uniqueSuffix}`;
            const timestamp = Math.round(new Date().getTime() / 1000);
            const uploadParams = {
                timestamp: timestamp,
                folder: folder,
                public_id: publicId,
                upload_preset: undefined,
            };
            const paramsToSign = {
                timestamp: timestamp,
                folder: folder,
                public_id: publicId
            };
            if (!process.env.CLOUDINARY_API_SECRET) {
                throw new Error('CLOUDINARY_API_SECRET not configured');
            }
            const signature = cludinary_1.cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
            return res.status(200).json({
                signature,
                timestamp,
                api_key: process.env.CLOUDINARY_API_KEY,
                folder,
                public_id: publicId,
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME
            });
        }
        catch (error) {
            console.error('Error generating upload signature:', error);
            return res.status(500).json({
                message: 'Internal server error',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
    async submitWithUrls(req, res) {
        try {
            const { fullName, birthPlace, birthDate, province, heightCm, weightKg, shirtSize, safetyShoesSize, pantsSize, address, whatsappNumber, certificate, education, schoolName, workExperience, maritalStatus, appliedPosition, experienceLevel = "FRESH_GRADUATED", documentPhotoUrl, documentCvUrl, documentKtpUrl, documentSkckUrl, documentVaccineUrl, supportingDocsUrl } = req.body;
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
                    error: "MISSING_REQUIRED_FIELDS"
                });
            }
            let certificateArray = [];
            if (certificate) {
                if (Array.isArray(certificate)) {
                    certificateArray = certificate;
                }
                else {
                    certificateArray = [certificate];
                }
            }
            const height = parseInt(heightCm);
            const weight = parseInt(weightKg);
            if (isNaN(height) || height < 100 || height > 250) {
                return res.status(400).json({
                    message: "Height must be between 100-250 cm",
                    error: "INVALID_HEIGHT"
                });
            }
            if (isNaN(weight) || weight < 30 || weight > 200) {
                return res.status(400).json({
                    message: "Weight must be between 30-200 kg",
                    error: "INVALID_WEIGHT"
                });
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
                    whatsappNumber: whatsappNumber.replace(/\s+/g, ''),
                    certificate: certificateArray,
                    education,
                    schoolName: schoolName.trim(),
                    workExperience: workExperience?.trim(),
                    maritalStatus,
                    status: client_1.RecruitmentStatus.PENDING,
                    appliedPosition,
                    experienceLevel,
                    documentPhotoUrl,
                    documentCvUrl,
                    documentKtpUrl,
                    documentSkckUrl,
                    documentVaccineUrl,
                    supportingDocsUrl,
                },
            });
            return res.status(201).json({
                message: "Recruitment form submitted successfully!",
                success: true,
                applicationId: newRecruitmentForm.id,
                submittedAt: newRecruitmentForm.createdAt,
            });
        }
        catch (error) {
            console.error("Error submitting recruitment form:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR",
                success: false
            });
        }
    }
}
exports.PublicRecruitmentController = PublicRecruitmentController;
