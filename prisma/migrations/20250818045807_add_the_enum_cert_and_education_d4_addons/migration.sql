-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Certificate" ADD VALUE 'SIM_A';
ALTER TYPE "public"."Certificate" ADD VALUE 'SIM_B_I';
ALTER TYPE "public"."Certificate" ADD VALUE 'SIM_B_II';
ALTER TYPE "public"."Certificate" ADD VALUE 'SIM_C';
ALTER TYPE "public"."Certificate" ADD VALUE 'SIM_D';
ALTER TYPE "public"."Certificate" ADD VALUE 'OPERATOR_CRANE';
ALTER TYPE "public"."Certificate" ADD VALUE 'OPERATOR_FUEL_TRUCK';
ALTER TYPE "public"."Certificate" ADD VALUE 'SERTIFIKAT_LAINNYA';

-- AlterEnum
ALTER TYPE "public"."EducationLevel" ADD VALUE 'D4';
