-- CreateEnum
CREATE TYPE "TutorialType" AS ENUM ('VIDEO', 'TEXT', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "TutorialLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TutorialSection" AS ENUM ('PROJECT_MANAGEMENT', 'TOOLS_WORKINGS');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'TUTORIAL';

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TutorialType" NOT NULL,
    "duration" TEXT NOT NULL,
    "level" "TutorialLevel" NOT NULL,
    "category" TEXT NOT NULL,
    "section" "TutorialSection" NOT NULL,
    "videoUrl" TEXT,
    "contentText" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "thumbnail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tutorial_tenantId_idx" ON "Tutorial"("tenantId");

-- CreateIndex
CREATE INDEX "Tutorial_section_category_idx" ON "Tutorial"("section", "category");

-- CreateIndex
CREATE INDEX "Tutorial_isPublished_idx" ON "Tutorial"("isPublished");

-- CreateIndex
CREATE INDEX "Tutorial_order_idx" ON "Tutorial"("order");

-- AddForeignKey
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

