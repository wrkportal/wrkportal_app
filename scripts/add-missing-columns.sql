-- Script to add missing columns to Neon database
-- Run this in Neon SQL Editor if columns are missing

-- Check and add groupRole to User table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'User' 
          AND column_name = 'groupRole'
    ) THEN
        -- Check if GroupRole enum exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'GroupRole'
        ) THEN
            CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
        END IF;
        
        ALTER TABLE "User" ADD COLUMN "groupRole" "GroupRole";
        RAISE NOTICE 'Added groupRole column to User table';
    ELSE
        RAISE NOTICE 'groupRole column already exists in User table';
    END IF;
END $$;

-- Check and add type to Tenant table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'Tenant' 
          AND column_name = 'type'
    ) THEN
        -- Check if WorkspaceType enum exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'WorkspaceType'
        ) THEN
            CREATE TYPE "WorkspaceType" AS ENUM ('ORGANIZATION', 'GROUP');
        END IF;
        
        ALTER TABLE "Tenant" ADD COLUMN "type" "WorkspaceType" DEFAULT 'ORGANIZATION';
        RAISE NOTICE 'Added type column to Tenant table';
    ELSE
        RAISE NOTICE 'type column already exists in Tenant table';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    'User.groupRole' as column_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'User' 
          AND column_name = 'groupRole'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'Tenant.type' as column_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'Tenant' 
          AND column_name = 'type'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
