-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('DAILY_ATTENDANCE', 'WEEKLY_ATTENDANCE', 'MONTHLY_ATTENDANCE', 'EMPLOYEE_LIST', 'DEVICE_STATUS', 'GUEST_VISITS', 'SECURITY_AUDIT', 'CUSTOM_QUERY');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('CSV', 'PDF', 'EXCEL', 'JSON');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "format" "public"."ReportFormat" NOT NULL DEFAULT 'CSV',
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "recordCount" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_organizationId_type_status_idx" ON "public"."Report"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "Report_createdByUserId_createdAt_idx" ON "public"."Report"("createdByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
