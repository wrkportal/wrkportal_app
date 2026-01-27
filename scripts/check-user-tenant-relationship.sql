-- Check User-Tenant relationship and identify potential issues
-- Run this in Neon SQL Editor

-- 1. Count users and tenants
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM "User"
UNION ALL
SELECT 
    'Total Tenants' as metric,
    COUNT(*) as count
FROM "Tenant";

-- 2. Check how many users belong to each tenant
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.type as tenant_type,
    COUNT(u.id) as user_count,
    STRING_AGG(u.email, ', ') as user_emails
FROM "Tenant" t
LEFT JOIN "User" u ON u."tenantId" = t.id
GROUP BY t.id, t.name, t.type
ORDER BY user_count DESC;

-- 3. Check for orphaned users (users with invalid tenantId)
SELECT 
    u.id,
    u.email,
    u."tenantId",
    CASE 
        WHEN t.id IS NULL THEN '❌ ORPHANED - tenantId does not exist'
        ELSE '✅ Valid tenant reference'
    END as status
FROM "User" u
LEFT JOIN "Tenant" t ON t.id = u."tenantId"
WHERE t.id IS NULL;

-- 4. Check for users with NULL tenantId
SELECT 
    COUNT(*) as users_with_null_tenant,
    STRING_AGG(email, ', ') as emails
FROM "User"
WHERE "tenantId" IS NULL;

-- 5. Check foreign key constraint (if it exists)
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'User'
    AND kcu.column_name = 'tenantId';
