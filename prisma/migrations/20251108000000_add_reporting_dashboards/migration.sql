-- CreateTable
CREATE TABLE "ReportingDashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configuration" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportingDashboard_createdBy_idx" ON "ReportingDashboard"("createdBy");

-- CreateIndex
CREATE INDEX "ReportingDashboard_updatedBy_idx" ON "ReportingDashboard"("updatedBy");

-- CreateIndex
CREATE INDEX "ReportingDashboard_createdAt_idx" ON "ReportingDashboard"("createdAt");

-- CreateIndex
CREATE INDEX "ReportingDashboard_deletedAt_idx" ON "ReportingDashboard"("deletedAt");

-- AddForeignKey
ALTER TABLE "ReportingDashboard" ADD CONSTRAINT "ReportingDashboard_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingDashboard" ADD CONSTRAINT "ReportingDashboard_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

