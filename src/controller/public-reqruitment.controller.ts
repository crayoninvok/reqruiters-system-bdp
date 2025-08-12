import { Request, Response } from "express";
import {
  PrismaClient,
  Province,
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
  async submitRecruitmentForm(req: PublicRequest, res: Response) {
    try {
      const {
        fullName,
        birthPlace,
        birthDate,
        province,
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
        workExperience,
        maritalStatus,
        appliedPosition,
        experienceLevel = "FRESH_GRADUATED", // Default value
      } = req.body;

      // Validate required fields
      if (
        !fullName ||
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
        !experienceLevel
      ) {
        return res.status(400).json({
          message: "All required fields must be provided",
          error: "MISSING_REQUIRED_FIELDS"
        });
      }

      // Validate enum fields
      if (!Object.values(Province).includes(province)) {
        return res.status(400).json({ 
          message: "Invalid province", 
          error: "INVALID_PROVINCE" 
        });
      }
      if (!Object.values(ShirtSize).includes(shirtSize)) {
        return res.status(400).json({ 
          message: "Invalid shirt size", 
          error: "INVALID_SHIRT_SIZE" 
        });
      }
      if (!Object.values(SafetyShoesSize).includes(safetyShoesSize)) {
        return res.status(400).json({ 
          message: "Invalid safety shoes size", 
          error: "INVALID_SAFETY_SHOES_SIZE" 
        });
      }
      if (!Object.values(PantsSize).includes(pantsSize)) {
        return res.status(400).json({ 
          message: "Invalid pants size", 
          error: "INVALID_PANTS_SIZE" 
        });
      }
      if (!Object.values(EducationLevel).includes(education)) {
        return res.status(400).json({ 
          message: "Invalid education level", 
          error: "INVALID_EDUCATION_LEVEL" 
        });
      }
      if (!Object.values(MaritalStatus).includes(maritalStatus)) {
        return res.status(400).json({ 
          message: "Invalid marital status", 
          error: "INVALID_MARITAL_STATUS" 
        });
      }
      if (!Object.values(Position).includes(appliedPosition)) {
        return res.status(400).json({ 
          message: "Invalid applied position", 
          error: "INVALID_APPLIED_POSITION" 
        });
      }
      if (!Object.values(ExperienceLevel).includes(experienceLevel)) {
        return res.status(400).json({ 
          message: "Invalid experience level", 
          error: "INVALID_EXPERIENCE_LEVEL" 
        });
      }

      // Process certificate array
      let certificateArray: Certificate[] = [];
      if (certificate) {
        if (Array.isArray(certificate)) {
          certificateArray = certificate;
        } else {
          certificateArray = [certificate];
        }

        for (const cert of certificateArray) {
          if (!Object.values(Certificate).includes(cert)) {
            return res.status(400).json({ 
              message: `Invalid certificate: ${cert}`, 
              error: "INVALID_CERTIFICATE" 
            });
          }
        }
      }

      // Validate numeric fields
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

      // Validate WhatsApp number format (basic validation)
      const whatsappRegex = /^(\+62|62|0)[0-9]{8,13}$/;
      if (!whatsappRegex.test(whatsappNumber.replace(/\s+/g, ''))) {
        return res.status(400).json({
          message: "Invalid WhatsApp number format",
          error: "INVALID_WHATSAPP_NUMBER"
        });
      }

      // Process file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const documentUrls: any = {};

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

      // Create recruitment form with PENDING status (default)
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
          whatsappNumber: whatsappNumber.replace(/\s+/g, ''), // Remove spaces
          certificate: certificateArray,
          education,
          schoolName: schoolName.trim(),
          workExperience: workExperience?.trim(),
          maritalStatus,
          status: RecruitmentStatus.PENDING, // Always set to PENDING for public submissions
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
    } catch (error: any) {
      console.error("Error submitting recruitment form:", error);

      // Cleanup uploaded files on error
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        await this.cleanupFiles(files);
      }

      return res.status(500).json({
        message: "Internal server error. Please try again later.",
        error: "INTERNAL_SERVER_ERROR",
        success: false
      });
    }
  }

  // Get available options for form fields (public endpoint)
  async getFormOptions(req: Request, res: Response) {
    try {
      return res.status(200).json({
        message: "Form options retrieved successfully",
        options: {
          provinces: Object.values(Province),
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
        error: "INTERNAL_SERVER_ERROR"
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
    } catch (error) {
      console.error("Error checking application status:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR"
      });
    }
  }
}