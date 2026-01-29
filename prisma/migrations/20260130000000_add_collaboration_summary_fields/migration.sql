-- Add notes and summary fields to Collaboration table
-- This migration adds support for manual notes and AI-generated summaries in collaborations

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN IF NOT EXISTS "summaryGeneratedAt" TIMESTAMP(3);
