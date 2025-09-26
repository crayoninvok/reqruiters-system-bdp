-- CreateEnum
CREATE TYPE "public"."PernahTidak" AS ENUM ('PERNAH', 'TIDAK_PERNAH');

-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "expectedSalary" DECIMAL(15,2),
ADD COLUMN     "pernahKerjaDiTamabang" "public"."PernahTidak",
ADD COLUMN     "reffConnection" TEXT,
ADD COLUMN     "reffEmployeeName" TEXT;
