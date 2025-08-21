-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "gender" "public"."Gender" NOT NULL DEFAULT 'MALE';
