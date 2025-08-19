-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Certificate" ADD VALUE 'PENGAWAS_OPERASIONAL_PERTAMA';
ALTER TYPE "public"."Certificate" ADD VALUE 'PENGAWAS_OPERSAIONAL_MADYA';
ALTER TYPE "public"."Certificate" ADD VALUE 'BASIC_MECHANIC_COURSE';
ALTER TYPE "public"."Certificate" ADD VALUE 'TRAINING_OF_TRAINER';
