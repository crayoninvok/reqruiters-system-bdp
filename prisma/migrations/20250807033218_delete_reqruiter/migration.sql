/*
  Warnings:

  - The values [RECRUITER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('ADMIN', 'HR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'HR';
COMMIT;

-- CreateTable
CREATE TABLE "public"."RecruiterData" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "department" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3),
    "employeeId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterData_email_key" ON "public"."RecruiterData"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterData_employeeId_key" ON "public"."RecruiterData"("employeeId");

-- CreateIndex
CREATE INDEX "RecruiterData_department_idx" ON "public"."RecruiterData"("department");

-- CreateIndex
CREATE INDEX "RecruiterData_employeeId_idx" ON "public"."RecruiterData"("employeeId");

-- AddForeignKey
ALTER TABLE "public"."RecruiterData" ADD CONSTRAINT "RecruiterData_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
