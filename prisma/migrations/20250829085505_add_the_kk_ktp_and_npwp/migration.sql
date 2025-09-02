/*
  Warnings:

  - A unique constraint covering the columns `[ktp]` on the table `RecruitmentForm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kk]` on the table `RecruitmentForm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[npwp]` on the table `RecruitmentForm` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "kk" TEXT,
ADD COLUMN     "ktp" TEXT,
ADD COLUMN     "npwp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentForm_ktp_key" ON "public"."RecruitmentForm"("ktp");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentForm_kk_key" ON "public"."RecruitmentForm"("kk");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentForm_npwp_key" ON "public"."RecruitmentForm"("npwp");
