-- CreateEnum
CREATE TYPE "public"."ExperienceLevel" AS ENUM ('FRESH_GRADUATED', 'EXPERIENCED');

-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "experienceLevel" "public"."ExperienceLevel" NOT NULL DEFAULT 'FRESH_GRADUATED';
