/*
  Warnings:

  - You are about to drop the `RecruiterData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RecruiterData" DROP CONSTRAINT "RecruiterData_createdById_fkey";

-- DropTable
DROP TABLE "public"."RecruiterData";
