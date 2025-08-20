/*
  Warnings:

  - The values [DRIVER_DT,PRODUCTION_DEPARTMENT_HEAD] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Certificate" ADD VALUE 'SURAT_IZIN_OPERATOR_FORKLIFT';
ALTER TYPE "public"."Certificate" ADD VALUE 'SERTIFIKASI_KONSTRUKSI';
ALTER TYPE "public"."Certificate" ADD VALUE 'KIMPER';
ALTER TYPE "public"."Certificate" ADD VALUE 'SIMPER';
ALTER TYPE "public"."Certificate" ADD VALUE 'PLB3';
ALTER TYPE "public"."Certificate" ADD VALUE 'RIGGER';
ALTER TYPE "public"."Certificate" ADD VALUE 'SMKP';
ALTER TYPE "public"."Certificate" ADD VALUE 'AHLI_K3_LISTRIK';
ALTER TYPE "public"."Certificate" ADD VALUE 'SURAT_TANDA_REGISTRASI';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Position_new" AS ENUM ('PROD_ENG_SPV', 'PRODUCTION_GROUP_LEADER', 'MOCO_LEADER', 'CCR_ADMIN', 'DRIVER_DOUBLE_TRAILER', 'WEIGHT_BRIDGE_ADMIN', 'SIDE_DUMP_SPOTTER', 'PLAN_SPV', 'LOGISTIC_SPV', 'PLANNER', 'PLANT_GROUP_LEADER', 'TYRE_GROUP_LEADER', 'LOGISTIC_GROUP_LEADER', 'MECHANIC_JR', 'MECHANIC_SR', 'WELDER', 'ELECTRICIAN', 'TYREMAN', 'FABRICATION', 'OPERATOR_FUEL_TRUCK', 'PLANT_ADMIN', 'TYRE_ADMIN', 'LOGISTIC_ADMIN', 'HSE_SPV', 'SAFETY_OFFICER', 'ENVIRONMENT_OFFICER', 'PARAMEDIC', 'HSE_ADMIN', 'HRGA_GROUP_LEADER', 'GA_GROUP_LEADER', 'PDCA_OFFICER', 'PURCHASING_SPV', 'IT_SUPPORT', 'DOCTOR', 'DEPT_HEAD_PRODUCTION_ENGINEERING', 'HRGA_SPV', 'MECHANIC_INSTRUCTOR', 'DEPT_HEAD_PLANT_LOGISTIC', 'OPERATOR_WATER_TRUCK', 'OPERATOR_CRANE_TRUCK', 'HRGA_ADMIN', 'CAMP_SERVICE_TECHNICIAN', 'CAMP_SERVICE_HELPER', 'DEPT_HEAD_HRGA', 'TRAINER_MECHANIC', 'TRAINER_DOUBLE_TRAILER');
ALTER TABLE "public"."RecruitmentForm" ALTER COLUMN "appliedPosition" TYPE "public"."Position_new" USING ("appliedPosition"::text::"public"."Position_new");
ALTER TYPE "public"."Position" RENAME TO "Position_old";
ALTER TYPE "public"."Position_new" RENAME TO "Position";
DROP TYPE "public"."Position_old";
COMMIT;
