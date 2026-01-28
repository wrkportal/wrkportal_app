-- Check all tenants the user should have access to
-- This will help identify why the dropdown isn't showing

-- Replace 'chaturchidiya2025@gmail.com' with the user's email

-- ============================================
-- STEP 1: Check user's primary tenant
-- ============================================
SELECT 
    'PRIMARY TENANT' as tenant_type,
    u.id as user_id,
    u.email,
    u."tenantId" as tenant_id,
    t.name as tenant_name,
    t.domain,
    u."createdAt" as user_created_at
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id
WHERE u.email = 'chaturchidiya2025@gmail.com';

-- ============================================
-- STEP 2: Check all UserTenantAccess records
-- ============================================
SELECT 
    'ADDITIONAL TENANT ACCESS' as tenant_type,
    u.id as user_id,
    u.email,
    uta."tenantId" as tenant_id,
    t.name as tenant_name,
    uta."invitationId",
    uta."isActive",
    uta."joinedAt",
    CASE 
        WHEN uta."tenantId" = u."tenantId" THEN 'Same as primary tenant'
        ELSE 'Different from primary tenant'
    END as comparison
FROM "User" u
JOIN "UserTenantAccess" uta ON u.id = uta."userId"
JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'chaturchidiya2025@gmail.com';

-- ============================================
-- STEP 3: Count total unique tenants
-- ============================================
SELECT 
    u.email,
    COUNT(DISTINCT u."tenantId") as primary_tenant_count,
    COUNT(DISTINCT uta."tenantId") as additional_tenant_count,
    COUNT(DISTINCT COALESCE(uta."tenantId", u."tenantId")) as total_unique_tenants,
    -- List all tenant IDs
    ARRAY_AGG(DISTINCT u."tenantId") as primary_tenant_ids,
    ARRAY_AGG(DISTINCT uta."tenantId") FILTER (WHERE uta."tenantId IS NOT NULL) as additional_tenant_ids,
    -- List all tenant names
    STRING_AGG(DISTINCT t1.name, ', ') as primary_tenant_names,
    STRING_AGG(DISTINCT t2.name, ', ') FILTER (WHERE t2.name IS NOT NULL) as additional_tenant_names
FROM "User" u
LEFT JOIN "Tenant" t1 ON u."tenantId" = t1.id
LEFT JOIN "UserTenantAccess" uta ON u.id = uta."userId"
LEFT JOIN "Tenant" t2 ON uta."tenantId" = t2.id
WHERE u.email = 'chaturchidiya2025@gmail.com'
GROUP BY u.email, u."tenantId";

-- ============================================
-- STEP 4: Check if user has their own separate tenant
-- ============================================
-- This checks if the user created their own tenant before accepting the invitation
-- Look for tenants where the user is the creator (first user in that tenant)

SELECT 
    'POTENTIAL OWN TENANT' as tenant_type,
    t.id as tenant_id,
    t.name as tenant_name,
    t.domain,
    t."createdAt" as tenant_created_at,
    COUNT(DISTINCT u2.id) as total_users_in_tenant,
    MIN(u2."createdAt") as first_user_created_at,
    CASE 
        WHEN MIN(u2."createdAt") = (SELECT MIN("createdAt") FROM "User" WHERE "tenantId" = t.id) 
             AND u.email = (SELECT email FROM "User" WHERE "tenantId" = t.id ORDER BY "createdAt" ASC LIMIT 1)
        THEN 'User might be creator of this tenant'
        ELSE 'User is not the creator'
    END as is_creator
FROM "User" u
JOIN "Tenant" t ON u."tenantId" = t.id
LEFT JOIN "User" u2 ON u2."tenantId" = t.id
WHERE u.email = 'chaturchidiya2025@gmail.com'
GROUP BY t.id, t.name, t.domain, t."createdAt", u.email;
