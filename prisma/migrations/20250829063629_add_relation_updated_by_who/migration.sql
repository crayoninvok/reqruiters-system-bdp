-- AlterTable
ALTER TABLE "public"."RecruitmentForm" ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."RecruitmentForm" ADD CONSTRAINT "RecruitmentForm_statusUpdatedById_fkey" FOREIGN KEY ("statusUpdatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
