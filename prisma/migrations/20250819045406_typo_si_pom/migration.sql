/*
  Warnings:

  - The values [PENGAWAS_OPERSAIONAL_MADYA] on the enum `Certificate` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Certificate_new" AS ENUM ('AHLI_K3', 'SIM_A', 'SIM_B_I', 'SIM_B_II', 'SIM_C', 'SIM_D', 'PENGAWAS_OPERASIONAL_PERTAMA', 'PENGAWAS_OPERASIONAL_MADYA', 'PENGAWAS_OPERASIONAL_UTAMA', 'BASIC_MECHANIC_COURSE', 'TRAINING_OF_TRAINER', 'OPERATOR_FORKLIFT', 'OPERATOR_CRANE', 'OPERATOR_FUEL_TRUCK', 'SERTIFIKAT_VAKSIN', 'SERTIFIKAT_LAINNYA', 'NONE');
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "certificate" TYPE "public"."Certificate_new"[] USING ("certificate"::text::"public"."Certificate_new"[]);
ALTER TYPE "public"."Certificate" RENAME TO "Certificate_old";
ALTER TYPE "public"."Certificate_new" RENAME TO "Certificate";
DROP TYPE "public"."Certificate_old";
COMMIT;
