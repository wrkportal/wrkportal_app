-- Check invitation and UserTenantAccess records for a specific user
-- Replace 'USER_EMAIL_HERE' with the actual user email

-- 1. Check the invitation record
SELECT 
    ti.id,
    ti.email,
    ti."tenantId",
    ti.role,
    ti."allowedSections",
    ti.status,
    ti."invitedById",
    ti."createdAt",
    t.name as tenant_name
FROM "TenantInvitation" ti
JOIN "Tenant" t ON ti."tenantId" = t.id
WHERE ti.email = 'USER_EMAIL_HERE'
ORDER BY ti."createdAt" DESC
LIMIT 5;

-- 2. Check UserTenantAccess record
SELECT 
    uta."userId",
    uta."tenantId",
    uta.role,
    uta."allowedSections",
    uta."invitationId",
    uta."isActive",
    uta."joinedAt",
    u.email as user_email,
    t.name as tenant_name
FROM "UserTenantAccess" uta
JOIN "User" u ON uta."userId" = u.id
JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'USER_EMAIL_HERE';

-- 3. Check if user has multiple tenants
SELECT 
    u.id as user_id,
    u.email,
    u."tenantId" as primary_tenant_id,
    t1.name as primary_tenant_name,
    COUNT(DISTINCT uta."tenantId") as additional_tenants_count
FROM "User" u
LEFT JOIN "Tenant" t1 ON u."tenantId" = t1.id
LEFT JOIN "UserTenantAccess" uta ON u.id = uta."userId"
WHERE u.email = 'USER_EMAIL_HERE'
GROUP BY u.id, u.email, u."tenantId", t1.name;
