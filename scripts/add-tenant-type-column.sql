-- Add Tenant.type column to Neon database
-- Run this in Neon SQL Editor

-- Step 1: Create WorkspaceType enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "WorkspaceType" AS ENUM ('ORGANIZATION', 'GROUP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add type column to Tenant table
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "type" "WorkspaceType" NOT NULL DEFAULT 'ORGANIZATION';

-- Step 3: Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Tenant' 
  AND column_name = 'type';
