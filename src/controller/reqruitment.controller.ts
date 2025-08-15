import { Request, Response } from "express";
import {
  PrismaClient,
  User,
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

interface AuthenticatedRequest extends Request {
  user?: User;
  files?:
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[];
}

export class RecruitmentFormController {
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

  // Helper function to delete old file from Cloudinary
  private async deleteOldFile(
    oldUrl: string,
    fieldname: string
  ): Promise<void> {
    try {
      const urlParts = oldUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const publicId = fileName.split(".")[0];
      const folder = this.getCloudinaryFolder(fieldname);
      const fullPublicId = `${folder}/${publicId}`;
      await cloudinary.uploader.destroy(fullPublicId);
    } catch (deleteError) {
      console.error(`Error deleting old ${fieldname}:`, deleteError);
    }
  }

  // Helper function to delete all files from a recruitment form
  private async deleteAllFiles(existingForm: any): Promise<void> {
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

  // Create new recruitment form
  async createRecruitmentForm(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can create recruitment forms",
        });
      }

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
        appliedPosition, // Correct field name based on your Prisma schema
        status = RecruitmentStatus.PENDING,
        experienceLevel = "FRESH_GRADUATED", // Add experienceLevel with default value
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
        !experienceLevel // Add check for experienceLevel
      ) {
        return res.status(400).json({
          message: "All required fields must be provided",
        });
      }

      // Validate enum fields
      if (!Object.values(Province).includes(province)) {
        return res.status(400).json({ message: "Invalid province" });
      }
      if (!Object.values(ShirtSize).includes(shirtSize)) {
        return res.status(400).json({ message: "Invalid shirt size" });
      }
      if (!Object.values(SafetyShoesSize).includes(safetyShoesSize)) {
        return res.status(400).json({ message: "Invalid safety shoes size" });
      }
      if (!Object.values(PantsSize).includes(pantsSize)) {
        return res.status(400).json({ message: "Invalid pants size" });
      }
      if (!Object.values(EducationLevel).includes(education)) {
        return res.status(400).json({ message: "Invalid education level" });
      }
      if (!Object.values(MaritalStatus).includes(maritalStatus)) {
        return res.status(400).json({ message: "Invalid marital status" });
      }

      // Validate appliedPosition field
      if (!Object.values(Position).includes(appliedPosition)) {
        return res.status(400).json({ message: "Invalid applied position" });
      }

      // Validate experienceLevel field
      if (!Object.values(ExperienceLevel).includes(experienceLevel)) {
        return res.status(400).json({ message: "Invalid experience level" });
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
            return res
              .status(400)
              .json({ message: `Invalid certificate: ${cert}` });
          }
        }
      }

      // Validate numeric fields
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
          appliedPosition, // Apply the valid appliedPosition
          experienceLevel, // Add the experienceLevel field
          ...documentUrls,
        },
      });

      return res.status(201).json({
        message: "Recruitment form created successfully",
        recruitmentForm: newRecruitmentForm,
      });
    } catch (error: any) {
      console.error("Error creating recruitment form:", error);

      // Cleanup uploaded files on error
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        await this.cleanupFiles(files);
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get all recruitment forms with pagination and filtering
  async getRecruitmentForms(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message: "Access denied. Only HR or ADMIN can view recruitment forms",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const search = req.query.search as string;
      const status = req.query.status as string;
      const province = req.query.province as string;
      const education = req.query.education as string;
      const position = req.query.appliedPosition as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const whereClause: any = {};

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
      if (position && Object.values(Position).includes(position as Position)) {
        whereClause.appliedPosition = position;
      }
      if (
        status &&
        Object.values(RecruitmentStatus).includes(status as RecruitmentStatus)
      ) {
        whereClause.status = status;
      }

      if (province && Object.values(Province).includes(province as Province)) {
        whereClause.province = province;
      }

      if (
        education &&
        Object.values(EducationLevel).includes(education as EducationLevel)
      ) {
        whereClause.education = education;
      }

      // Get recruitment forms with pagination and filtering
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
    } catch (error) {
      console.error("Error getting recruitment forms:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get single recruitment form by ID
  async getRecruitmentFormById(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
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
    } catch (error) {
      console.error("Error getting recruitment form:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateRecruitmentForm(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can update recruitment forms",
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if recruitment form exists
      const existingForm = await prisma.recruitmentForm.findUnique({
        where: { id },
      });

      if (!existingForm) {
        return res.status(404).json({
          message: "Recruitment form not found",
        });
      }

      // Validate enum fields if being updated
      if (
        updateData.province &&
        !Object.values(Province).includes(updateData.province)
      ) {
        return res.status(400).json({ message: "Invalid province" });
      }
      if (
        updateData.shirtSize &&
        !Object.values(ShirtSize).includes(updateData.shirtSize)
      ) {
        return res.status(400).json({ message: "Invalid shirt size" });
      }
      if (
        updateData.safetyShoesSize &&
        !Object.values(SafetyShoesSize).includes(updateData.safetyShoesSize)
      ) {
        return res.status(400).json({ message: "Invalid safety shoes size" });
      }
      if (
        updateData.pantsSize &&
        !Object.values(PantsSize).includes(updateData.pantsSize)
      ) {
        return res.status(400).json({ message: "Invalid pants size" });
      }
      if (
        updateData.education &&
        !Object.values(EducationLevel).includes(updateData.education)
      ) {
        return res.status(400).json({ message: "Invalid education level" });
      }
      if (
        updateData.maritalStatus &&
        !Object.values(MaritalStatus).includes(updateData.maritalStatus)
      ) {
        return res.status(400).json({ message: "Invalid marital status" });
      }
      if (
        updateData.status &&
        !Object.values(RecruitmentStatus).includes(updateData.status)
      ) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Validate appliedPosition field if being updated
      if (
        updateData.appliedPosition &&
        !Object.values(Position).includes(updateData.appliedPosition)
      ) {
        return res.status(400).json({ message: "Invalid applied position" });
      }

      // Process certificate array if provided
      if (updateData.certificate) {
        let certificateArray: Certificate[];
        if (Array.isArray(updateData.certificate)) {
          certificateArray = updateData.certificate;
        } else {
          certificateArray = [updateData.certificate];
        }

        for (const cert of certificateArray) {
          if (!Object.values(Certificate).includes(cert)) {
            return res
              .status(400)
              .json({ message: `Invalid certificate: ${cert}` });
          }
        }
        updateData.certificate = certificateArray;
      }

      // Validate numeric fields if being updated
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

      // Handle birth date if being updated
      if (updateData.birthDate) {
        updateData.birthDate = new Date(updateData.birthDate);
      }

      // Trim string fields
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

      // Handle file uploads (replace existing files)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files) {
        // Delete old files from Cloudinary before updating
        const oldFileFields = [
          { field: "documentPhotoUrl", uploadField: "documentPhoto" },
          { field: "documentCvUrl", uploadField: "documentCv" },
          { field: "documentKtpUrl", uploadField: "documentKtp" },
          { field: "documentSkckUrl", uploadField: "documentSkck" },
          { field: "documentVaccineUrl", uploadField: "documentVaccine" },
          { field: "supportingDocsUrl", uploadField: "supportingDocs" },
        ];

        for (const { field, uploadField } of oldFileFields) {
          if (
            files[uploadField] &&
            existingForm[field as keyof typeof existingForm]
          ) {
            const oldUrl = existingForm[
              field as keyof typeof existingForm
            ] as string;
            await this.deleteOldFile(oldUrl, uploadField);
          }
        }

        // Set new file URLs
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

      // Update recruitment form
      const updatedForm = await prisma.recruitmentForm.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({
        message: "Recruitment form updated successfully",
        recruitmentForm: updatedForm,
      });
    } catch (error: any) {
      console.error("Error updating recruitment form:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Delete recruitment form
  async deleteRecruitmentForm(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can delete recruitment forms",
        });
      }

      const { id } = req.params;

      // Check if recruitment form exists
      const existingForm = await prisma.recruitmentForm.findUnique({
        where: { id },
      });

      if (!existingForm) {
        return res.status(404).json({
          message: "Recruitment form not found",
        });
      }

      // Delete associated files from Cloudinary
      await this.deleteAllFiles(existingForm);

      // Delete recruitment form
      await prisma.recruitmentForm.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Recruitment form deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting recruitment form:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get recruitment statistics
  async getRecruitmentStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can view recruitment statistics",
        });
      }

      const [
        totalForms,
        statusStats,
        provinceStats,
        educationStats,
        recentForms,
      ] = await Promise.all([
        // Total forms count
        prisma.recruitmentForm.count(),

        // Status breakdown
        prisma.recruitmentForm.groupBy({
          by: ["status"],
          _count: { status: true },
        }),

        // Province breakdown (top 5)
        prisma.recruitmentForm.groupBy({
          by: ["province"],
          _count: { province: true },
          orderBy: { _count: { province: "desc" } },
          take: 5,
        }),

        // Education breakdown
        prisma.recruitmentForm.groupBy({
          by: ["education"],
          _count: { education: true },
          orderBy: { _count: { education: "desc" } },
        }),

        // Forms created in last 30 days
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
    } catch (error) {
      console.error("Error getting recruitment statistics:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Update recruitment status
  async updateRecruitmentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is HR or ADMIN
      if (!req.user || (req.user.role !== "HR" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
          message:
            "Access denied. Only HR or ADMIN can update recruitment status",
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(RecruitmentStatus).includes(status)) {
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
    } catch (error: any) {
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
