-- Migration: Add allowedSections field to User and TenantInvitation tables
-- This allows fine-grained section access control for invited users

-- Add allowedSections to User table (stored as JSON text, null = full access)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

-- Add allowedSections to TenantInvitation table (stored as JSON text, null = full access)
ALTER TABLE "TenantInvitation" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "User_allowedSections_idx" ON "User"("allowedSections");
CREATE INDEX IF NOT EXISTS "TenantInvitation_allowedSections_idx" ON "TenantInvitation"("allowedSections");

-- Comments
COMMENT ON COLUMN "User"."allowedSections" IS 'JSON array of section names user can access. null = full access, [] = no access (only wrkboard)';
COMMENT ON COLUMN "TenantInvitation"."allowedSections" IS 'JSON array of section names to grant to invited user. null = full access, [] = no access';
