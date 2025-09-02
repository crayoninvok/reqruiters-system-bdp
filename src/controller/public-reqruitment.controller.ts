import { Request, Response } from "express";
import {
  PrismaClient,
  Province,
  Gender,
  Religion,
  ShirtSize,
  SafetyShoesSize,
  PantsSize,
  Certificate,
  EducationLevel,
  MaritalStatus,
  RecruitmentStatus,
  Position,
  ExperienceLevel,
} from "@prisma/client";
import { upload, cloudinary } from "../services/cludinary";

const prisma = new PrismaClient();

interface PublicRequest extends Request {
  files?:
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[];
}

export class PublicRecruitmentController {
  // Helper function to get the correct Cloudinary folder for file deletion
  private getCloudinaryFolder(fieldname: string): string {
    if (fieldname === "documentPhoto") {
      return "rec_avatar";
    }
    if (
      [
        "documentCv",
        "documentKtp",
        "documentSkck",
        "documentVaccine",
        "supportingDocs",
      ].includes(fieldname)
    ) {
      return "rec_docs";
    }
    return "general_uploads";
  }

  // Helper function to cleanup files on error
  private async cleanupFiles(files: {
    [fieldname: string]: Express.Multer.File[];
  }): Promise<void> {
    for (const [fieldname, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        try {
          const urlParts = file.path.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const publicId = fileName.split(".")[0];
          const folder = this.getCloudinaryFolder(fieldname);
          const fullPublicId = `${folder}/${publicId}`;
          await cloudinary.uploader.destroy(fullPublicId);
        } catch (cleanupError) {
          console.error(`Error cleaning up file ${fieldname}:`, cleanupError);
        }
      }
    }
  }

  // Public endpoint to submit recruitment form (no authentication required)
 // Improved error handling with detailed logging
async submitRecruitmentForm(req: PublicRequest, res: Response) {
  try {
    console.log('=== START RECRUITMENT FORM SUBMISSION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');

    const {
      fullName,
      birthPlace,
      birthDate,
      gender,
      ktp,
      kk,
      npwp,
      province,
      religion,
      heightCm,
      weightKg,
      shirtSize,
      safetyShoesSize,
      pantsSize,
      address,
      whatsappNumber,
      certificate,
      education,
      schoolName,
      jurusan,
      workExperience,
      maritalStatus,
      appliedPosition,
      experienceLevel = "FRESH_GRADUATED",
    } = req.body;

    // Step 1: Basic validation logging
    console.log('Step 1: Basic field validation');
    if (
      !fullName ||
      !birthPlace ||
      !gender ||
      !ktp ||
      !kk ||
      !birthDate ||
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
      !experienceLevel
    ) {
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

    // Step 2: Format validation with detailed logging
    console.log('Step 2: Format validation');
    
    // KTP validation
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

    // KK validation
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

    // NPWP validation (optional)
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

    // Step 3: WhatsApp validation with detailed logging
    console.log('Step 3: WhatsApp validation');
    console.log('Original WhatsApp:', whatsappNumber);
    
    let normalizedWhatsapp = whatsappNumber
      .replace(/\s+/g, "")
      .replace(/[-]/g, "");
    console.log('After cleanup:', normalizedWhatsapp);

    if (normalizedWhatsapp.startsWith("08")) {
      normalizedWhatsapp = "+62" + normalizedWhatsapp.substring(1);
    } else if (
      normalizedWhatsapp.startsWith("62") &&
      !normalizedWhatsapp.startsWith("+62")
    ) {
      normalizedWhatsapp = "+" + normalizedWhatsapp;
    } else if (!normalizedWhatsapp.startsWith("+62")) {
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

    // Step 4: Database duplicate checks with detailed logging
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

      // NPWP duplicate check
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
    } catch (dbError) {
      console.error('❌ Database error during duplicate checks:', dbError);
      return res.status(500).json({
        message: "Database error during validation",
        error: "DATABASE_ERROR",
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }

    // Step 5: Enum validations with detailed logging
    console.log('Step 5: Enum validations');
    
    const enumValidations = [
      { value: province, enum: Province, name: 'Province' },
      { value: gender, enum: Gender, name: 'Gender' },
      { value: religion, enum: Religion, name: 'Religion' },
      { value: shirtSize, enum: ShirtSize, name: 'ShirtSize' },
      { value: safetyShoesSize, enum: SafetyShoesSize, name: 'SafetyShoesSize' },
      { value: pantsSize, enum: PantsSize, name: 'PantsSize' },
      { value: education, enum: EducationLevel, name: 'EducationLevel' },
      { value: maritalStatus, enum: MaritalStatus, name: 'MaritalStatus' },
      { value: appliedPosition, enum: Position, name: 'Position' },
      { value: experienceLevel, enum: ExperienceLevel, name: 'ExperienceLevel' }
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

    // Step 6: Certificate processing
    console.log('Step 6: Certificate processing');
    let certificateArray: Certificate[] = [];
    if (certificate) {
      if (Array.isArray(certificate)) {
        certificateArray = certificate;
      } else {
        certificateArray = [certificate];
      }

      for (const cert of certificateArray) {
        if (!Object.values(Certificate).includes(cert)) {
          console.log('❌ Invalid certificate:', cert);
          return res.status(400).json({
            message: `Invalid certificate: ${cert}`,
            error: "INVALID_CERTIFICATE",
            received: cert,
            allowedValues: Object.values(Certificate)
          });
        }
      }
    }
    console.log('✅ Certificate processing completed');

    // Step 7: Numeric validations
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

    // Step 8: File processing
    console.log('Step 8: File processing');
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentUrls: any = {};

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

    // Step 9: Database creation
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
          religion,
          province,
          heightCm: height,
          weightKg: weight,
          shirtSize,
          safetyShoesSize,
          pantsSize,
          address: address.trim(),
          whatsappNumber: normalizedWhatsapp,
          certificate: certificateArray,
          education,
          schoolName: schoolName.trim(),
          jurusan: jurusan?.trim(),
          workExperience: workExperience?.trim(),
          maritalStatus,
          status: RecruitmentStatus.PENDING,
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
      
    } catch (createError) {
      console.error('❌ Error creating recruitment form:', createError);
      
      // Cleanup uploaded files on database error
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        await this.cleanupFiles(files);
      }
      
      return res.status(500).json({
        message: "Failed to save recruitment form",
        error: "DATABASE_CREATE_ERROR",
        details: createError instanceof Error ? createError.message : 'Unknown create error'
      });
    }

  } catch (error: any) {
    console.error('❌ UNEXPECTED ERROR in recruitment form submission:', error);
    console.error('Error stack:', error.stack);

    // Cleanup uploaded files on any error
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      await this.cleanupFiles(files);
    }

    return res.status(500).json({
      message: "Internal server error. Please try again later.",
      error: "INTERNAL_SERVER_ERROR",
      success: false,
      // Include more details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
}

  // Get available options for form fields (public endpoint)
  async getFormOptions(req: Request, res: Response) {
    try {
      return res.status(200).json({
        message: "Form options retrieved successfully",
        options: {
          province: Object.values(Province),
          gender: Object.values(Gender),
          religion: Object.values(Religion),
          shirtSizes: Object.values(ShirtSize),
          safetyShoeSizes: Object.values(SafetyShoesSize),
          pantsSizes: Object.values(PantsSize),
          certificates: Object.values(Certificate),
          educationLevels: Object.values(EducationLevel),
          maritalStatuses: Object.values(MaritalStatus),
          positions: Object.values(Position),
          experienceLevels: Object.values(ExperienceLevel),
        },
      });
    } catch (error) {
      console.error("Error getting form options:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Check application status by ID (public endpoint)
  async checkApplicationStatus(req: Request, res: Response) {
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
    } catch (error) {
      console.error("Error checking application status:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async generateUploadSignature(req: Request, res: Response) {
    try {
      const { fieldName } = req.body;

      // Validate field name
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

      // Determine folder
      const folder = fieldName === "documentPhoto" ? "rec_avatar" : "rec_docs";

      // Generate unique public_id
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const publicId = `${fieldName}-${uniqueSuffix}`;

      // Create upload parameters - FIXED: Include all required params
      const timestamp = Math.round(new Date().getTime() / 1000);
      const uploadParams = {
        timestamp: timestamp,
        folder: folder,
        public_id: publicId,
        // Add these missing parameters that Cloudinary requires
        upload_preset: undefined, // Explicitly undefined since we're using signature
        // Remove resource_type if not needed, or ensure it's properly included in signature
      };

      // CRITICAL FIX: Generate signature with exact parameters that will be sent
      const paramsToSign = {
        timestamp: timestamp,
        folder: folder,
        public_id: publicId,
      };

      // Generate signature - ensure API_SECRET exists
      if (!process.env.CLOUDINARY_API_SECRET) {
        throw new Error("CLOUDINARY_API_SECRET not configured");
      }

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
      );

      return res.status(200).json({
        signature,
        timestamp,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder,
        public_id: publicId,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      });
    } catch (error) {
      console.error("Error generating upload signature:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Method 2: Submit form with pre-uploaded URLs (no file upload)
  // Method 2: Submit form with pre-uploaded URLs (no file upload) - IMPROVED
async submitWithUrls(req: Request, res: Response) {
  try {
    console.log('=== START RECRUITMENT FORM SUBMISSION WITH URLS ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      fullName,
      birthPlace,
      birthDate,
      province,
      religion,
      heightCm,
      weightKg,
      gender,
      ktp,
      kk,
      npwp,
      shirtSize,
      safetyShoesSize,
      pantsSize,
      address,
      whatsappNumber,
      certificate,
      education,
      schoolName,
      jurusan,
      workExperience,
      maritalStatus,
      appliedPosition,
      experienceLevel = "FRESH_GRADUATED",
      // File URLs (already uploaded to Cloudinary)
      documentPhotoUrl,
      documentCvUrl,
      documentKtpUrl,
      documentSkckUrl,
      documentVaccineUrl,
      supportingDocsUrl,
    } = req.body;

    // Step 1: Basic validation logging
    console.log('Step 1: Basic field validation');
    if (
      !fullName ||
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
      !schoolName ||
      !maritalStatus ||
      !appliedPosition ||
      !experienceLevel
    ) {
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
          experienceLevel: !experienceLevel
        }
      });
    }
    console.log('✅ Basic validation passed');

    // Step 2: Format validation with detailed logging
    console.log('Step 2: Format validation');
    
    // KTP validation
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

    // KK validation
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

    // NPWP validation (optional)
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

    // Step 3: WhatsApp validation with detailed logging
    console.log('Step 3: WhatsApp validation');
    console.log('Original WhatsApp:', whatsappNumber);
    
    let normalizedWhatsapp = whatsappNumber
      .replace(/\s+/g, "")
      .replace(/[-]/g, "");
    console.log('After cleanup:', normalizedWhatsapp);

    if (normalizedWhatsapp.startsWith("08")) {
      normalizedWhatsapp = "+62" + normalizedWhatsapp.substring(1);
    } else if (
      normalizedWhatsapp.startsWith("62") &&
      !normalizedWhatsapp.startsWith("+62")
    ) {
      normalizedWhatsapp = "+" + normalizedWhatsapp;
    } else if (!normalizedWhatsapp.startsWith("+62")) {
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

    // Step 4: Database duplicate checks with detailed logging
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

      // NPWP duplicate check
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
    } catch (dbError) {
      console.error('❌ Database error during duplicate checks:', dbError);
      return res.status(500).json({
        message: "Database error during validation",
        error: "DATABASE_ERROR",
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }

    // Step 5: Enum validations with detailed logging
    console.log('Step 5: Enum validations');
    
    const enumValidations = [
      { value: province, enum: Province, name: 'Province' },
      { value: gender, enum: Gender, name: 'Gender' },
      { value: religion, enum: Religion, name: 'Religion' },
      { value: shirtSize, enum: ShirtSize, name: 'ShirtSize' },
      { value: safetyShoesSize, enum: SafetyShoesSize, name: 'SafetyShoesSize' },
      { value: pantsSize, enum: PantsSize, name: 'PantsSize' },
      { value: education, enum: EducationLevel, name: 'EducationLevel' },
      { value: maritalStatus, enum: MaritalStatus, name: 'MaritalStatus' },
      { value: appliedPosition, enum: Position, name: 'Position' },
      { value: experienceLevel, enum: ExperienceLevel, name: 'ExperienceLevel' }
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

    // Step 6: Certificate processing
    console.log('Step 6: Certificate processing');
    let certificateArray: Certificate[] = [];
    if (certificate) {
      if (Array.isArray(certificate)) {
        certificateArray = certificate;
      } else {
        certificateArray = [certificate];
      }

      for (const cert of certificateArray) {
        if (!Object.values(Certificate).includes(cert)) {
          console.log('❌ Invalid certificate:', cert);
          return res.status(400).json({
            message: `Invalid certificate: ${cert}`,
            error: "INVALID_CERTIFICATE",
            received: cert,
            allowedValues: Object.values(Certificate)
          });
        }
      }
    }
    console.log('✅ Certificate processing completed');

    // Step 7: Numeric validations
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

    // Step 8: URL validations (optional but good practice)
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
        } catch (urlError) {
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

    // Step 9: Database creation
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
        religion,
        heightCm: height,
        weightKg: weight,
        shirtSize,
        safetyShoesSize,
        pantsSize,
        address: address.trim(),
        whatsappNumber: normalizedWhatsapp, // Use normalized WhatsApp
        certificate: certificateArray,
        education,
        schoolName: schoolName.trim(),
        jurusan: jurusan?.trim(),
        workExperience: workExperience?.trim(),
        maritalStatus,
        status: RecruitmentStatus.PENDING,
        appliedPosition,
        experienceLevel,
        // Add URLs if provided
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
      
    } catch (createError) {
      console.error('❌ Error creating recruitment form:', createError);
      
      return res.status(500).json({
        message: "Failed to save recruitment form",
        error: "DATABASE_CREATE_ERROR",
        details: createError instanceof Error ? createError.message : 'Unknown create error'
      });
    }

  } catch (error: any) {
    console.error('❌ UNEXPECTED ERROR in recruitment form submission with URLs:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      message: "Internal server error. Please try again later.",
      error: "INTERNAL_SERVER_ERROR",
      success: false,
      // Include more details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
}
}
