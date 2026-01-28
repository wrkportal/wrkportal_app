-- Query to check how many tenants a user has access to
-- Replace 'USER_EMAIL_HERE' with the actual user email

-- 1. Get user's primary tenant (from User table)
SELECT 
    u.id as user_id,
    u.email,
    u."tenantId" as primary_tenant_id,
    t.name as primary_tenant_name,
    'PRIMARY' as access_type
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id
WHERE u.email = 'USER_EMAIL_HERE';

-- 2. Get additional tenants from UserTenantAccess table
SELECT 
    uta."userId",
    uta."tenantId",
    t.name as tenant_name,
    uta.role,
    uta."invitationId",
    uta."isActive",
    uta."joinedAt",
    'ADDITIONAL' as access_type
FROM "UserTenantAccess" uta
JOIN "User" u ON uta."userId" = u.id
LEFT JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'USER_EMAIL_HERE';

-- 3. Combined query: Get all tenants a user has access to (primary + additional)
WITH primary_tenant AS (
    SELECT 
        u.id as user_id,
        u.email,
        u."tenantId" as tenant_id,
        t.name as tenant_name,
        u.role,
        NULL::text as invitation_id,
        true as is_active,
        u."createdAt" as joined_at,
        'PRIMARY' as access_type
    FROM "User" u
    LEFT JOIN "Tenant" t ON u."tenantId" = t.id
    WHERE u.email = 'USER_EMAIL_HERE'
),
additional_tenants AS (
    SELECT 
        uta."userId" as user_id,
        u.email,
        uta."tenantId" as tenant_id,
        t.name as tenant_name,
        uta.role,
        uta."invitationId"::text as invitation_id,
        uta."isActive" as is_active,
        uta."joinedAt" as joined_at,
        'ADDITIONAL' as access_type
    FROM "UserTenantAccess" uta
    JOIN "User" u ON uta."userId" = u.id
    LEFT JOIN "Tenant" t ON uta."tenantId" = t.id
    WHERE u.email = 'USER_EMAIL_HERE'
)
SELECT 
    COALESCE(pt.tenant_id, at.tenant_id) as tenant_id,
    COALESCE(pt.tenant_name, at.tenant_name) as tenant_name,
    COALESCE(pt.role, at.role) as role,
    COALESCE(pt.invitation_id, at.invitation_id) as invitation_id,
    COALESCE(pt.is_active, at.is_active) as is_active,
    COALESCE(pt.joined_at, at.joined_at) as joined_at,
    COALESCE(pt.access_type, at.access_type) as access_type
FROM primary_tenant pt
FULL OUTER JOIN additional_tenants at ON pt.tenant_id = at.tenant_id
ORDER BY 
    CASE WHEN COALESCE(pt.access_type, at.access_type) = 'PRIMARY' THEN 1 ELSE 2 END,
    COALESCE(pt.joined_at, at.joined_at) DESC;

-- 4. Count total tenants for a user
SELECT 
    u.email,
    COUNT(DISTINCT COALESCE(uta."tenantId", u."tenantId")) as total_tenants,
    COUNT(DISTINCT CASE WHEN uta."tenantId" IS NOT NULL THEN uta."tenantId" END) as additional_tenants_count
FROM "User" u
LEFT JOIN "UserTenantAccess" uta ON u.id = uta."userId"
WHERE u.email = 'USER_EMAIL_HERE'
GROUP BY u.email, u."tenantId";
