-- CreateEnum
CREATE TYPE "public"."RecruitmentStatus" AS ENUM ('PENDING', 'ON_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "status" "public"."RecruitmentStatus" NOT NULL DEFAULT 'PENDING';
