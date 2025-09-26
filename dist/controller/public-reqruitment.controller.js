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
            console.log('=== START RECRUITMENT FORM SUBMISSION ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
            const { fullName, birthPlace, birthDate, gender, ktp, kk, npwp, province, religion, heightCm, weightKg, shirtSize, safetyShoesSize, expectedSalary, pernahKerjaDiTambang, reffEmployeeName, reffConnection, pantsSize, address, whatsappNumber, certificate, education, schoolName, jurusan, workExperience, maritalStatus, appliedPosition, experienceLevel = "FRESH_GRADUATED", } = req.body;
            console.log('Step 1: Basic field validation');
            if (!fullName ||
                !birthPlace ||
                !gender ||
                !ktp ||
                !kk ||
                !birthDate ||
                !expectedSalary ||
                !pernahKerjaDiTambang ||
                !province ||
                !religion ||
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
                console.log('❌ Basic validation failed - missing required fields');
                return res.status(400).json({
                    message: "All required fields must be provided",
                    error: "MISSING_REQUIRED_FIELDS",
                    missingFields: {
                        fullName: !fullName,
                        birthPlace: !birthPlace,
                        gender: !gender,
                        ktp: !ktp,
                        kk: !kk,
                        birthDate: !birthDate,
                        province: !province,
                        religion: !religion,
                        heightCm: !heightCm,
                        weightKg: !weightKg,
                        shirtSize: !shirtSize,
                        safetyShoesSize: !safetyShoesSize,
                        expectedSalary: !expectedSalary,
                        pernahKerjaDiTambang: !pernahKerjaDiTambang,
                        pantsSize: !pantsSize,
                        address: !address,
                        whatsappNumber: !whatsappNumber,
                        education: !education,
                        schoolName: !schoolName,
                        maritalStatus: !maritalStatus,
                        appliedPosition: !appliedPosition,
                        experienceLevel: !experienceLevel
                    }
                });
            }
            console.log('✅ Basic validation passed');
            console.log('Step 2: Format validation');
            console.log('Validating KTP:', ktp);
            const ktpRegex = /^\d{16}$/;
            if (!ktpRegex.test(ktp.trim())) {
                console.log('❌ KTP format validation failed');
                return res.status(400).json({
                    message: "KTP harus standar 16 digits",
                    error: "INVALID_KTP_FORMAT",
                    received: ktp,
                    expectedFormat: "16 digits only"
                });
            }
            console.log('✅ KTP format valid');
            console.log('Validating KK:', kk);
            const kkRegex = /^\d{16}$/;
            if (!kkRegex.test(kk.trim())) {
                console.log('❌ KK format validation failed');
                return res.status(400).json({
                    message: "KK harus standar 16 digits",
                    error: "INVALID_KK_FORMAT",
                    received: kk,
                    expectedFormat: "16 digits only"
                });
            }
            console.log('✅ KK format valid');
            if (npwp && npwp.trim()) {
                console.log('Validating NPWP:', npwp);
                const npwpRegex = /^\d{15,16}$/;
                if (!npwpRegex.test(npwp.trim())) {
                    console.log('❌ NPWP format validation failed');
                    return res.status(400).json({
                        message: "NPWP harus 15 atau 16 digit",
                        error: "INVALID_NPWP_FORMAT",
                        received: npwp,
                        expectedFormat: "15 or 16 digits only"
                    });
                }
                console.log('✅ NPWP format valid');
            }
            console.log('Step 3: WhatsApp validation');
            console.log('Original WhatsApp:', whatsappNumber);
            let normalizedWhatsapp = whatsappNumber
                .replace(/\s+/g, "")
                .replace(/[-]/g, "");
            console.log('After cleanup:', normalizedWhatsapp);
            if (normalizedWhatsapp.startsWith("08")) {
                normalizedWhatsapp = "+62" + normalizedWhatsapp.substring(1);
            }
            else if (normalizedWhatsapp.startsWith("62") &&
                !normalizedWhatsapp.startsWith("+62")) {
                normalizedWhatsapp = "+" + normalizedWhatsapp;
            }
            else if (!normalizedWhatsapp.startsWith("+62")) {
                console.log('❌ WhatsApp format validation failed - wrong prefix');
                return res.status(400).json({
                    message: "WhatsApp number must start with +62, 62, or 08",
                    error: "INVALID_WHATSAPP_FORMAT",
                    received: whatsappNumber,
                    normalized: normalizedWhatsapp
                });
            }
            console.log('After normalization:', normalizedWhatsapp);
            const whatsappRegex = /^\+62[0-9]{9,13}$/;
            if (!whatsappRegex.test(normalizedWhatsapp)) {
                console.log('❌ WhatsApp regex validation failed');
                return res.status(400).json({
                    message: "Invalid WhatsApp number format. Must be +62 followed by 9-13 digits",
                    error: "INVALID_WHATSAPP_NUMBER",
                    received: whatsappNumber,
                    normalized: normalizedWhatsapp
                });
            }
            console.log('✅ WhatsApp format valid:', normalizedWhatsapp);
            console.log('Step 4: Database duplicate checks');
            try {
                console.log('Checking KTP duplicates...');
                const existingKtp = await prisma.recruitmentForm.findUnique({
                    where: { ktp: ktp.trim() },
                    select: { id: true, fullName: true },
                });
                if (existingKtp) {
                    console.log('❌ Duplicate KTP found:', existingKtp);
                    return res.status(409).json({
                        message: "Nomor KTP sudah terdaftar dalam sistem",
                        error: "DUPLICATE_KTP",
                        existingApplication: existingKtp
                    });
                }
                console.log('✅ KTP unique check passed');
                console.log('Checking KK duplicates...');
                const existingKk = await prisma.recruitmentForm.findUnique({
                    where: { kk: kk.trim() },
                    select: { id: true, fullName: true },
                });
                if (existingKk) {
                    console.log('❌ Duplicate KK found:', existingKk);
                    return res.status(409).json({
                        message: "Nomor KK sudah terdaftar dalam sistem",
                        error: "DUPLICATE_KK",
                        existingApplication: existingKk
                    });
                }
                console.log('✅ KK unique check passed');
                console.log('Checking WhatsApp duplicates...');
                const existingWhatsapp = await prisma.recruitmentForm.findFirst({
                    where: { whatsappNumber: normalizedWhatsapp },
                    select: { id: true, fullName: true },
                });
                if (existingWhatsapp) {
                    console.log('❌ Duplicate WhatsApp found:', existingWhatsapp);
                    return res.status(409).json({
                        message: "Nomor WhatsApp sudah terdaftar dalam sistem",
                        error: "DUPLICATE_WHATSAPP",
                        existingApplication: existingWhatsapp
                    });
                }
                console.log('✅ WhatsApp unique check passed');
                if (npwp && npwp.trim()) {
                    console.log('Checking NPWP duplicates...');
                    const existingNpwp = await prisma.recruitmentForm.findUnique({
                        where: { npwp: npwp.trim() },
                        select: { id: true, fullName: true },
                    });
                    if (existingNpwp) {
                        console.log('❌ Duplicate NPWP found:', existingNpwp);
                        return res.status(409).json({
                            message: "Nomor NPWP sudah terdaftar dalam sistem",
                            error: "DUPLICATE_NPWP",
                            existingApplication: existingNpwp
                        });
                    }
                    console.log('✅ NPWP unique check passed');
                }
            }
            catch (dbError) {
                console.error('❌ Database error during duplicate checks:', dbError);
                return res.status(500).json({
                    message: "Database error during validation",
                    error: "DATABASE_ERROR",
                    details: dbError instanceof Error ? dbError.message : 'Unknown database error'
                });
            }
            console.log('Step 5: Enum validations');
            const enumValidations = [
                { value: province, enum: client_1.Province, name: 'Province' },
                { value: gender, enum: client_1.Gender, name: 'Gender' },
                { value: religion, enum: client_1.Religion, name: 'Religion' },
                { value: shirtSize, enum: client_1.ShirtSize, name: 'ShirtSize' },
                { value: safetyShoesSize, enum: client_1.SafetyShoesSize, name: 'SafetyShoesSize' },
                { value: pantsSize, enum: client_1.PantsSize, name: 'PantsSize' },
                { value: education, enum: client_1.EducationLevel, name: 'EducationLevel' },
                { value: maritalStatus, enum: client_1.MaritalStatus, name: 'MaritalStatus' },
                { value: appliedPosition, enum: client_1.Position, name: 'Position' },
                { value: experienceLevel, enum: client_1.ExperienceLevel, name: 'ExperienceLevel' }
            ];
            for (const validation of enumValidations) {
                if (!Object.values(validation.enum).includes(validation.value)) {
                    console.log(`❌ Invalid ${validation.name}:`, validation.value);
                    return res.status(400).json({
                        message: `Invalid ${validation.name.toLowerCase()}`,
                        error: `INVALID_${validation.name.toUpperCase()}`,
                        received: validation.value,
                        allowedValues: Object.values(validation.enum)
                    });
                }
            }
            console.log('✅ All enum validations passed');
            console.log('Step 6: Certificate processing');
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
                        console.log('❌ Invalid certificate:', cert);
                        return res.status(400).json({
                            message: `Invalid certificate: ${cert}`,
                            error: "INVALID_CERTIFICATE",
                            received: cert,
                            allowedValues: Object.values(client_1.Certificate)
                        });
                    }
                }
            }
            console.log('✅ Certificate processing completed');
            console.log('Step 7: Numeric validations');
            const height = parseInt(heightCm);
            const weight = parseInt(weightKg);
            if (isNaN(height) || height < 100 || height > 250) {
                console.log('❌ Invalid height:', heightCm);
                return res.status(400).json({
                    message: "Tinggi harus diantara 100-250 cm",
                    error: "INVALID_HEIGHT",
                    received: heightCm,
                    parsed: height
                });
            }
            if (isNaN(weight) || weight < 30 || weight > 200) {
                console.log('❌ Invalid weight:', weightKg);
                return res.status(400).json({
                    message: "Weight must be between 30-200 kg",
                    error: "INVALID_WEIGHT",
                    received: weightKg,
                    parsed: weight
                });
            }
            console.log('✅ Numeric validations passed');
            console.log('Step 8: File processing');
            const files = req.files;
            const documentUrls = {};
            if (files) {
                console.log('Files to process:', Object.keys(files));
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
                console.log('Document URLs prepared:', Object.keys(documentUrls));
            }
            console.log('Step 9: Creating recruitment form in database');
            try {
                const newRecruitmentForm = await prisma.recruitmentForm.create({
                    data: {
                        fullName: fullName.trim(),
                        birthPlace: birthPlace.trim(),
                        birthDate: new Date(birthDate),
                        gender,
                        ktp: ktp.trim(),
                        kk: kk.trim(),
                        npwp: npwp?.trim() || null,
                        reffEmployeeName: reffEmployeeName?.trim() || null,
                        reffConnection: reffConnection?.trim() || null,
                        religion,
                        province,
                        heightCm: height,
                        weightKg: weight,
                        shirtSize,
                        safetyShoesSize,
                        expectedSalary: parseFloat(expectedSalary),
                        pernahKerjaDiTambang,
                        pantsSize,
                        address: address.trim(),
                        whatsappNumber: normalizedWhatsapp,
                        certificate: certificateArray,
                        education,
                        schoolName: schoolName.trim(),
                        jurusan: jurusan?.trim(),
                        workExperience: workExperience?.trim(),
                        maritalStatus,
                        status: client_1.RecruitmentStatus.PENDING,
                        appliedPosition,
                        experienceLevel,
                        ...documentUrls,
                    },
                });
                console.log('✅ Recruitment form created successfully:', newRecruitmentForm.id);
                console.log('=== END RECRUITMENT FORM SUBMISSION ===');
                return res.status(201).json({
                    message: "Recruitment form submitted successfully! We will review your application and contact you soon.",
                    success: true,
                    applicationId: newRecruitmentForm.id,
                    submittedAt: newRecruitmentForm.createdAt,
                });
            }
            catch (createError) {
                console.error('❌ Error creating recruitment form:', createError);
                if (req.files) {
                    const files = req.files;
                    await this.cleanupFiles(files);
                }
                return res.status(500).json({
                    message: "Failed to save recruitment form",
                    error: "DATABASE_CREATE_ERROR",
                    details: createError instanceof Error ? createError.message : 'Unknown create error'
                });
            }
        }
        catch (error) {
            console.error('❌ UNEXPECTED ERROR in recruitment form submission:', error);
            console.error('Error stack:', error.stack);
            if (req.files) {
                const files = req.files;
                await this.cleanupFiles(files);
            }
            return res.status(500).json({
                message: "Internal server error. Please try again later.",
                error: "INTERNAL_SERVER_ERROR",
                success: false,
                ...(process.env.NODE_ENV === 'development' && {
                    details: error.message,
                    stack: error.stack
                })
            });
        }
    }
    async getFormOptions(req, res) {
        try {
            return res.status(200).json({
                message: "Form options retrieved successfully",
                options: {
                    province: Object.values(client_1.Province),
                    gender: Object.values(client_1.Gender),
                    religion: Object.values(client_1.Religion),
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
                error: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async checkApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    message: "Application ID is required",
                    error: "MISSING_APPLICATION_ID",
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
                    error: "APPLICATION_NOT_FOUND",
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
                error: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async generateUploadSignature(req, res) {
        try {
            const { fieldName } = req.body;
            const allowedFields = [
                "documentPhoto",
                "documentCv",
                "documentKtp",
                "documentSkck",
                "documentVaccine",
                "supportingDocs",
            ];
            if (!allowedFields.includes(fieldName)) {
                return res.status(400).json({
                    message: "Invalid field name",
                    error: "INVALID_FIELD",
                });
            }
            const folder = fieldName === "documentPhoto" ? "rec_avatar" : "rec_docs";
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
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
                public_id: publicId,
            };
            if (!process.env.CLOUDINARY_API_SECRET) {
                throw new Error("CLOUDINARY_API_SECRET not configured");
            }
            const signature = cludinary_1.cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
            return res.status(200).json({
                signature,
                timestamp,
                api_key: process.env.CLOUDINARY_API_KEY,
                folder,
                public_id: publicId,
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            });
        }
        catch (error) {
            console.error("Error generating upload signature:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async submitWithUrls(req, res) {
        try {
            console.log('=== START RECRUITMENT FORM SUBMISSION WITH URLS ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            const { fullName, birthPlace, birthDate, province, religion, heightCm, weightKg, gender, ktp, kk, npwp, reffEmployeeName, reffConnection, shirtSize, safetyShoesSize, pantsSize, address, whatsappNumber, certificate, education, schoolName, jurusan, workExperience, expectedSalary, pernahKerjaDiTambang, maritalStatus, appliedPosition, experienceLevel = "FRESH_GRADUATED", documentPhotoUrl, documentCvUrl, documentKtpUrl, documentSkckUrl, documentVaccineUrl, supportingDocsUrl, } = req.body;
            console.log('Step 1: Basic field validation');
            if (!fullName ||
                !birthPlace ||
                !birthDate ||
                !gender ||
                !ktp ||
                !kk ||
                !religion ||
                !province ||
                !heightCm ||
                !weightKg ||
                !shirtSize ||
                !safetyShoesSize ||
                !pantsSize ||
                !address ||
                !whatsappNumber ||
                !education ||
                !expectedSalary ||
                !pernahKerjaDiTambang ||
                !schoolName ||
                !maritalStatus ||
                !appliedPosition ||
                !experienceLevel) {
                console.log('❌ Basic validation failed - missing required fields');
                return res.status(400).json({
                    message: "All required fields must be provided",
                    error: "MISSING_REQUIRED_FIELDS",
                    missingFields: {
                        fullName: !fullName,
                        birthPlace: !birthPlace,
                        birthDate: !birthDate,
                        gender: !gender,
                        ktp: !ktp,
                        kk: !kk,
                        religion: !religion,
                        province: !province,
                        heightCm: !heightCm,
                        weightKg: !weightKg,
                        shirtSize: !shirtSize,
                        safetyShoesSize: !safetyShoesSize,
                        pantsSize: !pantsSize,
                        address: !address,
                        whatsappNumber: !whatsappNumber,
                        education: !education,
                        schoolName: !schoolName,
                        maritalStatus: !maritalStatus,
                        appliedPosition: !appliedPosition,
                        experienceLevel: !experienceLevel,
                        pernahKerjaDiTambang: !pernahKerjaDiTambang,
                    }
                });
            }
            console.log('✅ Basic validation passed');
            console.log('Step 2: Format validation');
            console.log('Validating KTP:', ktp);
            const ktpRegex = /^\d{16}$/;
            if (!ktpRegex.test(ktp.trim())) {
                console.log('❌ KTP format validation failed');
                return res.status(400).json({
                    message: "KTP must be exactly 16 digits",
                    error: "INVALID_KTP_FORMAT",
                    received: ktp,
                    expectedFormat: "16 digits only"
                });
            }
            console.log('✅ KTP format valid');
            console.log('Validating KK:', kk);
            const kkRegex = /^\d{16}$/;
            if (!kkRegex.test(kk.trim())) {
                console.log('❌ KK format validation failed');
                return res.status(400).json({
                    message: "KK must be exactly 16 digits",
                    error: "INVALID_KK_FORMAT",
                    received: kk,
                    expectedFormat: "16 digits only"
                });
            }
            console.log('✅ KK format valid');
            if (npwp && npwp.trim()) {
                console.log('Validating NPWP:', npwp);
                const npwpRegex = /^\d{15,16}$/;
                if (!npwpRegex.test(npwp.trim())) {
                    console.log('❌ NPWP format validation failed');
                    return res.status(400).json({
                        message: "NPWP harus 15 atau 16 digits",
                        error: "INVALID_NPWP_FORMAT",
                        received: npwp,
                        expectedFormat: "15 or 16 digits only"
                    });
                }
                console.log('✅ NPWP format valid');
            }
            console.log('Step 3: WhatsApp validation');
            console.log('Original WhatsApp:', whatsappNumber);
            let normalizedWhatsapp = whatsappNumber
                .replace(/\s+/g, "")
                .replace(/[-]/g, "");
            console.log('After cleanup:', normalizedWhatsapp);
            if (normalizedWhatsapp.startsWith("08")) {
                normalizedWhatsapp = "+62" + normalizedWhatsapp.substring(1);
            }
            else if (normalizedWhatsapp.startsWith("62") &&
                !normalizedWhatsapp.startsWith("+62")) {
                normalizedWhatsapp = "+" + normalizedWhatsapp;
            }
            else if (!normalizedWhatsapp.startsWith("+62")) {
                console.log('❌ WhatsApp format validation failed - wrong prefix');
                return res.status(400).json({
                    message: "WhatsApp number must start with +62, 62, or 08",
                    error: "INVALID_WHATSAPP_FORMAT",
                    received: whatsappNumber,
                    normalized: normalizedWhatsapp
                });
            }
            console.log('After normalization:', normalizedWhatsapp);
            const whatsappRegex = /^\+62[0-9]{9,13}$/;
            if (!whatsappRegex.test(normalizedWhatsapp)) {
                console.log('❌ WhatsApp regex validation failed');
                return res.status(400).json({
                    message: "Invalid WhatsApp number format. Must be +62 followed by 9-13 digits",
                    error: "INVALID_WHATSAPP_NUMBER",
                    received: whatsappNumber,
                    normalized: normalizedWhatsapp
                });
            }
            console.log('✅ WhatsApp format valid:', normalizedWhatsapp);
            console.log('Step 4: Database duplicate checks');
            try {
                console.log('Checking KTP duplicates...');
                const existingKtp = await prisma.recruitmentForm.findUnique({
                    where: { ktp: ktp.trim() },
                    select: { id: true, fullName: true },
                });
                if (existingKtp) {
                    console.log('❌ Duplicate KTP found:', existingKtp);
                    return res.status(409).json({
                        message: "Nomor KTP sudah terdaftar dalam sistem",
                        error: "DUPLICATE_KTP",
                        existingApplication: existingKtp
                    });
                }
                console.log('✅ KTP unique check passed');
                console.log('Checking KK duplicates...');
                const existingKk = await prisma.recruitmentForm.findUnique({
                    where: { kk: kk.trim() },
                    select: { id: true, fullName: true },
                });
                if (existingKk) {
                    console.log('❌ Duplicate KK found:', existingKk);
                    return res.status(409).json({
                        message: "Nomor KK sudah terdaftar dalam sistem",
                        error: "DUPLICATE_KK",
                        existingApplication: existingKk
                    });
                }
                console.log('✅ KK unique check passed');
                console.log('Checking WhatsApp duplicates...');
                const existingWhatsapp = await prisma.recruitmentForm.findFirst({
                    where: { whatsappNumber: normalizedWhatsapp },
                    select: { id: true, fullName: true },
                });
                if (existingWhatsapp) {
                    console.log('❌ Duplicate WhatsApp found:', existingWhatsapp);
                    return res.status(409).json({
                        message: "Nomor WhatsApp sudah terdaftar dalam sistem",
                        error: "DUPLICATE_WHATSAPP",
                        existingApplication: existingWhatsapp
                    });
                }
                console.log('✅ WhatsApp unique check passed');
                if (npwp && npwp.trim()) {
                    console.log('Checking NPWP duplicates...');
                    const existingNpwp = await prisma.recruitmentForm.findUnique({
                        where: { npwp: npwp.trim() },
                        select: { id: true, fullName: true },
                    });
                    if (existingNpwp) {
                        console.log('❌ Duplicate NPWP found:', existingNpwp);
                        return res.status(409).json({
                            message: "Nomor NPWP sudah terdaftar dalam sistem",
                            error: "DUPLICATE_NPWP",
                            existingApplication: existingNpwp
                        });
                    }
                    console.log('✅ NPWP unique check passed');
                }
            }
            catch (dbError) {
                console.error('❌ Database error during duplicate checks:', dbError);
                return res.status(500).json({
                    message: "Database error during validation",
                    error: "DATABASE_ERROR",
                    details: dbError instanceof Error ? dbError.message : 'Unknown database error'
                });
            }
            console.log('Step 5: Enum validations');
            const enumValidations = [
                { value: province, enum: client_1.Province, name: 'Province' },
                { value: gender, enum: client_1.Gender, name: 'Gender' },
                { value: religion, enum: client_1.Religion, name: 'Religion' },
                { value: shirtSize, enum: client_1.ShirtSize, name: 'ShirtSize' },
                { value: safetyShoesSize, enum: client_1.SafetyShoesSize, name: 'SafetyShoesSize' },
                { value: pantsSize, enum: client_1.PantsSize, name: 'PantsSize' },
                { value: education, enum: client_1.EducationLevel, name: 'EducationLevel' },
                { value: maritalStatus, enum: client_1.MaritalStatus, name: 'MaritalStatus' },
                { value: appliedPosition, enum: client_1.Position, name: 'Position' },
                { value: experienceLevel, enum: client_1.ExperienceLevel, name: 'ExperienceLevel' },
                { value: pernahKerjaDiTambang, enum: client_1.PernahTidak, name: 'PernahKerjaDiTambang' }
            ];
            for (const validation of enumValidations) {
                if (!Object.values(validation.enum).includes(validation.value)) {
                    console.log(`❌ Invalid ${validation.name}:`, validation.value);
                    return res.status(400).json({
                        message: `Invalid ${validation.name.toLowerCase()}`,
                        error: `INVALID_${validation.name.toUpperCase()}`,
                        received: validation.value,
                        allowedValues: Object.values(validation.enum)
                    });
                }
            }
            console.log('✅ All enum validations passed');
            console.log('Step 6: Certificate processing');
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
                        console.log('❌ Invalid certificate:', cert);
                        return res.status(400).json({
                            message: `Invalid certificate: ${cert}`,
                            error: "INVALID_CERTIFICATE",
                            received: cert,
                            allowedValues: Object.values(client_1.Certificate)
                        });
                    }
                }
            }
            console.log('✅ Certificate processing completed');
            console.log('Step 7: Numeric validations');
            const height = parseInt(heightCm);
            const weight = parseInt(weightKg);
            if (isNaN(height) || height < 100 || height > 250) {
                console.log('❌ Invalid height:', heightCm);
                return res.status(400).json({
                    message: "Height must be between 100-250 cm",
                    error: "INVALID_HEIGHT",
                    received: heightCm,
                    parsed: height
                });
            }
            if (isNaN(weight) || weight < 30 || weight > 200) {
                console.log('❌ Invalid weight:', weightKg);
                return res.status(400).json({
                    message: "Weight must be between 30-200 kg",
                    error: "INVALID_WEIGHT",
                    received: weightKg,
                    parsed: weight
                });
            }
            console.log('✅ Numeric validations passed');
            console.log('Step 8: URL validations');
            const urlFields = [
                { name: 'documentPhotoUrl', value: documentPhotoUrl },
                { name: 'documentCvUrl', value: documentCvUrl },
                { name: 'documentKtpUrl', value: documentKtpUrl },
                { name: 'documentSkckUrl', value: documentSkckUrl },
                { name: 'documentVaccineUrl', value: documentVaccineUrl },
                { name: 'supportingDocsUrl', value: supportingDocsUrl }
            ];
            for (const urlField of urlFields) {
                if (urlField.value) {
                    try {
                        new URL(urlField.value);
                        console.log(`✅ ${urlField.name} URL valid`);
                    }
                    catch (urlError) {
                        console.log(`❌ Invalid ${urlField.name} URL:`, urlField.value);
                        return res.status(400).json({
                            message: `Invalid URL for ${urlField.name}`,
                            error: "INVALID_URL",
                            field: urlField.name,
                            received: urlField.value
                        });
                    }
                }
            }
            console.log('Step 9: Creating recruitment form in database with URLs');
            try {
                const createData = {
                    fullName: fullName.trim(),
                    birthPlace: birthPlace.trim(),
                    birthDate: new Date(birthDate),
                    province,
                    gender,
                    ktp: ktp.trim(),
                    kk: kk.trim(),
                    npwp: npwp?.trim() || null,
                    reffEmployeeName: reffEmployeeName?.trim() || null,
                    reffConnection: reffConnection?.trim() || null,
                    religion,
                    heightCm: height,
                    weightKg: weight,
                    shirtSize,
                    safetyShoesSize,
                    expectedSalary: parseFloat(expectedSalary),
                    pernahKerjaDiTambang,
                    pantsSize,
                    address: address.trim(),
                    whatsappNumber: normalizedWhatsapp,
                    certificate: certificateArray,
                    education,
                    schoolName: schoolName.trim(),
                    jurusan: jurusan?.trim(),
                    workExperience: workExperience?.trim(),
                    maritalStatus,
                    status: client_1.RecruitmentStatus.PENDING,
                    appliedPosition,
                    experienceLevel,
                    ...(documentPhotoUrl && { documentPhotoUrl }),
                    ...(documentCvUrl && { documentCvUrl }),
                    ...(documentKtpUrl && { documentKtpUrl }),
                    ...(documentSkckUrl && { documentSkckUrl }),
                    ...(documentVaccineUrl && { documentVaccineUrl }),
                    ...(supportingDocsUrl && { supportingDocsUrl }),
                };
                console.log('Data to be created:', JSON.stringify(createData, null, 2));
                const newRecruitmentForm = await prisma.recruitmentForm.create({
                    data: createData,
                });
                console.log('✅ Recruitment form created successfully:', newRecruitmentForm.id);
                console.log('=== END RECRUITMENT FORM SUBMISSION WITH URLS ===');
                return res.status(201).json({
                    message: "Recruitment form submitted successfully!",
                    success: true,
                    applicationId: newRecruitmentForm.id,
                    submittedAt: newRecruitmentForm.createdAt,
                });
            }
            catch (createError) {
                console.error('❌ Error creating recruitment form:', createError);
                return res.status(500).json({
                    message: "Failed to save recruitment form",
                    error: "DATABASE_CREATE_ERROR",
                    details: createError instanceof Error ? createError.message : 'Unknown create error'
                });
            }
        }
        catch (error) {
            console.error('❌ UNEXPECTED ERROR in recruitment form submission with URLs:', error);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                message: "Internal server error. Please try again later.",
                error: "INTERNAL_SERVER_ERROR",
                success: false,
                ...(process.env.NODE_ENV === 'development' && {
                    details: error.message,
                    stack: error.stack
                })
            });
        }
    }
}
exports.PublicRecruitmentController = PublicRecruitmentController;
