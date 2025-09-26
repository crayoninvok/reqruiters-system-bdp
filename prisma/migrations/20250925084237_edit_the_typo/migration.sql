/*
  Warnings:

  - You are about to drop the column `pernahKerjaDiTamabang` on the `RecruitmentForm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."RecruitmentForm" DROP COLUMN "pernahKerjaDiTamabang",
ADD COLUMN     "pernahKerjaDiTambang" "public"."PernahTidak";
