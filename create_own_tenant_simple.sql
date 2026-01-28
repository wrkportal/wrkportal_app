-- Simplified version: Create own tenant for user in one go
-- This creates both the tenant and UserTenantAccess record

-- ============================================
-- STEP 1: Create the user's own tenant and get the ID
-- ============================================
WITH new_tenant AS (
    INSERT INTO "Tenant" (id, name, domain, "type", "createdAt", "updatedAt")
    VALUES (
        'cl' || EXTRACT(EPOCH FROM NOW())::bigint::text || substr(md5(random()::text), 1, 11),
        'Chatur Chidiya''s Organization',
        NULL,
        'ORGANIZATION',
        NOW(),
        NOW()
    )
    RETURNING id, name
)
-- STEP 2: Create UserTenantAccess record using the new tenant ID
INSERT INTO "UserTenantAccess" (
    id,
    "userId",
    "tenantId",
    role,
    "isActive",
    "joinedAt",
    "invitedById"
)
SELECT 
    'cm' || substr(md5(random()::text || NOW()::text), 1, 25),  -- Generate unique ID
    'cmkxmfnu9000504l8b57huaoo',  -- User ID
    nt.id,  -- New tenant ID from CTE
    'ORG_ADMIN',
    false,  -- Not active (invited tenant is active)
    NOW(),
    'cmkxmfnu9000504l8b57huaoo'   -- User created their own tenant
FROM new_tenant nt
RETURNING 
    "userId",
    "tenantId",
    role,
    "isActive";

-- ============================================
-- STEP 3: Verify both tenants are now accessible
-- ============================================
SELECT 
    u.email,
    u."tenantId" as primary_tenant_id,
    t1.name as primary_tenant_name,
    uta."tenantId" as additional_tenant_id,
    t2.name as additional_tenant_name,
    uta."isActive",
    CASE 
        WHEN uta."invitationId" IS NOT NULL THEN 'Invited tenant'
        ELSE 'Own tenant'
    END as tenant_type
FROM "User" u
LEFT JOIN "Tenant" t1 ON u."tenantId" = t1.id
LEFT JOIN "UserTenantAccess" uta ON u.id = uta."userId"
LEFT JOIN "Tenant" t2 ON uta."tenantId" = t2.id
WHERE u.email = 'chaturchidiya2025@gmail.com'
ORDER BY uta."joinedAt" DESC;
