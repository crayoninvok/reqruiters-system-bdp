-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('PRODUCTION_ENGINEERING', 'OPERATIONAL', 'PLANT', 'LOGISTIC', 'HUMAN_RESOURCES_GA', 'HEALTH_SAFETY_ENVIRONMENT', 'PURCHASING', 'INFORMATION_TECHNOLOGY', 'MEDICAL', 'TRAINING_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "public"."EmploymentStatus" AS ENUM ('PROBATION', 'PERMANENT', 'CONTRACT', 'TERMINATED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('PERMANENT', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "public"."ShiftPattern" AS ENUM ('DAY_SHIFT', 'NIGHT_SHIFT', 'ROTATING', 'FLEXIBLE');

-- AlterEnum
ALTER TYPE "public"."RecruitmentStatus" ADD VALUE 'COMPLETED';

-- CreateTable
CREATE TABLE "public"."HiredEmployee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "recruitmentFormId" TEXT NOT NULL,
    "hiredPosition" "public"."Position" NOT NULL,
    "department" "public"."Department" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "probationEndDate" TIMESTAMP(3),
    "employmentStatus" "public"."EmploymentStatus" NOT NULL DEFAULT 'PROBATION',
    "contractType" "public"."ContractType" NOT NULL DEFAULT 'PERMANENT',
    "basicSalary" DECIMAL(15,2),
    "allowances" JSONB,
    "supervisorId" TEXT,
    "processedById" TEXT NOT NULL,
    "hiredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workLocation" TEXT,
    "shiftPattern" "public"."ShiftPattern" NOT NULL DEFAULT 'DAY_SHIFT',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terminationDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiredEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HiredEmployee_employeeId_key" ON "public"."HiredEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HiredEmployee_recruitmentFormId_key" ON "public"."HiredEmployee"("recruitmentFormId");

-- CreateIndex
CREATE INDEX "HiredEmployee_employeeId_idx" ON "public"."HiredEmployee"("employeeId");

-- CreateIndex
CREATE INDEX "HiredEmployee_department_idx" ON "public"."HiredEmployee"("department");

-- CreateIndex
CREATE INDEX "HiredEmployee_employmentStatus_idx" ON "public"."HiredEmployee"("employmentStatus");

-- CreateIndex
CREATE INDEX "HiredEmployee_startDate_idx" ON "public"."HiredEmployee"("startDate");

-- AddForeignKey
ALTER TABLE "public"."HiredEmployee" ADD CONSTRAINT "HiredEmployee_recruitmentFormId_fkey" FOREIGN KEY ("recruitmentFormId") REFERENCES "public"."RecruitmentForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HiredEmployee" ADD CONSTRAINT "HiredEmployee_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."HiredEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HiredEmployee" ADD CONSTRAINT "HiredEmployee_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
