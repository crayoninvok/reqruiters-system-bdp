/*
  Warnings:

  - The values [SINGLE,MARRIED,DIVORCED,WIDOWED] on the enum `MaritalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MaritalStatus_new" AS ENUM ('TK0', 'TK1', 'TK2', 'TK3', 'K0', 'K1', 'K2', 'K3', 'K_I_0', 'K_I_1', 'K_I_2', 'K_I_3');
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "maritalStatus" TYPE "public"."MaritalStatus_new" USING ("maritalStatus"::text::"public"."MaritalStatus_new");
ALTER TYPE "public"."MaritalStatus" RENAME TO "MaritalStatus_old";
ALTER TYPE "public"."MaritalStatus_new" RENAME TO "MaritalStatus";
DROP TYPE "public"."MaritalStatus_old";
COMMIT;
