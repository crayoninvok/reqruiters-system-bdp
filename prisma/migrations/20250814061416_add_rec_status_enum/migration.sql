-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'INTERVIEW';
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'PSIKOTEST';
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'USER_INTERVIEW';
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'MEDICAL_CHECKUP';
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'MEDICAL_FOLLOWUP';
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'REJECTED';
