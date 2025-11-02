-- Add sourceType and sourceId columns to Task table for WBS sync tracking
ALTER TABLE "Task" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "Task" ADD COLUMN "sourceId" TEXT;

