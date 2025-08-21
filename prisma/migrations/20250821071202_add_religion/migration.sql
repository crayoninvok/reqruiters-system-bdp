-- CreateEnum
CREATE TYPE "public"."Religion" AS ENUM ('ISLAM', 'PROTESTAN', 'KATHOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU');

-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "religion" "public"."Religion" NOT NULL DEFAULT 'ISLAM';
