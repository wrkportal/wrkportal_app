-- Script to check for missing columns in Neon database
-- Run this in Neon SQL Editor to see what columns exist vs what Prisma expects

-- Check User table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'User'
ORDER BY ordinal_position;

-- Check Tenant table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Tenant'
ORDER BY ordinal_position;

-- Check if TenantInvitation table exists and its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'TenantInvitation'
ORDER BY ordinal_position;

-- Check for specific columns that might be missing
SELECT 
    'User.groupRole' as column_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'User' 
          AND column_name = 'groupRole'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Tenant.type' as column_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'Tenant' 
          AND column_name = 'type'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'TenantInvitation table' as column_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'TenantInvitation'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;
