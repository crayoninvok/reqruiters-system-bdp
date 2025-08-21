/*
  Warnings:

  - The values [COMPLETED] on the enum `RecruitmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."Position" ADD VALUE 'GA_INFRASTRUCTURE';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."RecruitmentStatus_new" AS ENUM ('PENDING', 'ON_PROGRESS', 'INTERVIEW', 'PSIKOTEST', 'USER_INTERVIEW', 'MEDICAL_CHECKUP', 'MEDICAL_FOLLOWUP', 'REJECTED', 'HIRED');
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "status" TYPE "public"."RecruitmentStatus_new" USING ("status"::text::"public"."RecruitmentStatus_new");
ALTER TYPE "public"."RecruitmentStatus" RENAME TO "RecruitmentStatus_old";
ALTER TYPE "public"."RecruitmentStatus_new" RENAME TO "RecruitmentStatus";
DROP TYPE "public"."RecruitmentStatus_old";
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
