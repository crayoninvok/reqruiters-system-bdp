-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'HR', 'RECRUITER');

-- CreateEnum
CREATE TYPE "public"."Province" AS ENUM ('ACEH', 'SUMATERA_UTARA', 'SUMATERA_BARAT', 'RIAU', 'JAMBI', 'SUMATERA_SELATAN', 'BENGKULU', 'LAMPUNG', 'KEP_BANGKA_BELITUNG', 'KEP_RIAU', 'DKI_JAKARTA', 'JAWA_BARAT', 'JAWA_TENGAH', 'DI_YOGYAKARTA', 'JAWA_TIMUR', 'BANTEN', 'BALI', 'NUSA_TENGGARA_BARAT', 'NUSA_TENGGARA_TIMUR', 'KALIMANTAN_BARAT', 'KALIMANTAN_TENGAH', 'KALIMANTAN_SELATAN', 'KALIMANTAN_TIMUR', 'KALIMANTAN_UTARA', 'SULAWESI_UTARA', 'SULAWESI_TENGAH', 'SULAWESI_SELATAN', 'SULAWESI_TENGGARA', 'GORONTALO', 'SULAWESI_BARAT', 'MALUKU', 'MALUKU_UTARA', 'PAPUA', 'PAPUA_BARAT');

-- CreateEnum
CREATE TYPE "public"."ShirtSize" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');

-- CreateEnum
CREATE TYPE "public"."SafetyShoesSize" AS ENUM ('SIZE_38', 'SIZE_39', 'SIZE_40', 'SIZE_41', 'SIZE_42', 'SIZE_43', 'SIZE_44');

-- CreateEnum
CREATE TYPE "public"."PantsSize" AS ENUM ('SIZE_28', 'SIZE_29', 'SIZE_30', 'SIZE_31', 'SIZE_32', 'SIZE_33', 'SIZE_34', 'SIZE_35', 'SIZE_36');

-- CreateEnum
CREATE TYPE "public"."Certificate" AS ENUM ('AHLI_K3', 'OPERATOR_FORKLIFT', 'SERTIFIKAT_VAKSIN', 'NONE');

-- CreateEnum
CREATE TYPE "public"."EducationLevel" AS ENUM ('SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1', 'S2', 'S3');

-- CreateEnum
CREATE TYPE "public"."MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'HR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecruitmentForm" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "province" "public"."Province" NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" INTEGER NOT NULL,
    "shirtSize" "public"."ShirtSize" NOT NULL,
    "safetyShoesSize" "public"."SafetyShoesSize" NOT NULL,
    "pantsSize" "public"."PantsSize" NOT NULL,
    "address" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "certificate" "public"."Certificate"[],
    "education" "public"."EducationLevel" NOT NULL,
    "schoolName" TEXT NOT NULL,
    "workExperience" TEXT,
    "maritalStatus" "public"."MaritalStatus" NOT NULL,
    "documentPhotoUrl" TEXT,
    "documentCvUrl" TEXT,
    "documentKtpUrl" TEXT,
    "documentSkckUrl" TEXT,
    "documentVaccineUrl" TEXT,
    "supportingDocsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
