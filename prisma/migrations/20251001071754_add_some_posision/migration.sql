-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Position" ADD VALUE 'PETUGAS_B3';
ALTER TYPE "public"."Position" ADD VALUE 'TRAINER_K3';
ALTER TYPE "public"."Position" ADD VALUE 'OPERATOR_GARBAGE_CAR';
