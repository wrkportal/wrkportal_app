-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('SOFTWARE_DEVELOPMENT', 'PRODUCT_MANAGEMENT', 'MARKETING', 'HUMAN_RESOURCES', 'LEGAL', 'CUSTOMER_SERVICE', 'OPERATIONS', 'IT_SUPPORT', 'FINANCE', 'SALES', 'GENERAL');

-- CreateEnum
CREATE TYPE "MethodologyType" AS ENUM ('AGILE', 'SCRUM', 'KANBAN', 'WATERFALL', 'LEAN', 'HYBRID', 'NONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "primaryWorkflowType" "WorkflowType",
ADD COLUMN     "workflowSettings" JSONB;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "workflowType" "WorkflowType",
ADD COLUMN     "methodologyType" "MethodologyType";

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "workflowType" "WorkflowType" NOT NULL,
    "methodologyType" "MethodologyType",
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "fields" JSONB NOT NULL,
    "defaultStatus" "TaskStatus",
    "defaultPriority" "Priority",
    "workflowFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementTemplate" (
    "id" TEXT NOT NULL,
    "workflowType" "WorkflowType" NOT NULL,
    "methodologyType" "MethodologyType",
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkflowAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowType" "WorkflowType" NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserWorkflowAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplate_workflowType_methodologyType_idx" ON "TaskTemplate"("workflowType", "methodologyType");

-- CreateIndex
CREATE INDEX "RequirementTemplate_workflowType_methodologyType_idx" ON "RequirementTemplate"("workflowType", "methodologyType");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkflowAssignment_userId_workflowType_key" ON "UserWorkflowAssignment"("userId", "workflowType");

-- CreateIndex
CREATE INDEX "UserWorkflowAssignment_userId_idx" ON "UserWorkflowAssignment"("userId");

-- AddForeignKey
ALTER TABLE "UserWorkflowAssignment" ADD CONSTRAINT "UserWorkflowAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

