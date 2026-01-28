-- ============================================
-- STEP 1: Create the user's own tenant
-- ============================================
-- Run this first. It will return the new tenant ID.
-- Copy the 'id' value from the result for STEP 2.

INSERT INTO "Tenant" (id, name, domain, "type", "createdAt", "updatedAt")
VALUES (
    'cl' || EXTRACT(EPOCH FROM NOW())::bigint::text || substr(md5(random()::text), 1, 11),
    'Chatur Chidiya''s Organization',
    NULL,
    'ORGANIZATION',
    NOW(),
    NOW()
)
RETURNING id, name;

-- ============================================
-- STEP 2: Create UserTenantAccess record
-- ============================================
-- After running STEP 1, copy the 'id' from the result above
-- Replace 'NEW_TENANT_ID_FROM_STEP_1' below with that ID
-- Then run this query

INSERT INTO "UserTenantAccess" (
    id,
    "userId",
    "tenantId",
    role,
    "isActive",
    "joinedAt",
    "invitedById",
    "createdAt",
    "updatedAt"
)
VALUES (
    'cm' || substr(md5(random()::text || NOW()::text), 1, 25),  -- Auto-generate ID
    'cmkxmfnu9000504l8b57huaoo',  -- User ID (already filled)
    'NEW_TENANT_ID_FROM_STEP_1',  -- ⬅️ REPLACE THIS with the ID from STEP 1
    'ORG_ADMIN',
    false,  -- Not active (invited tenant is active)
    NOW(),  -- joinedAt
    'cmkxmfnu9000504l8b57huaoo',  -- User created their own tenant
    NOW(),  -- createdAt
    NOW()   -- updatedAt
)
RETURNING 
    id,
    "userId",
    "tenantId",
    role,
    "isActive";

-- ============================================
-- STEP 3: Verify both tenants are accessible
-- ============================================
-- Run this to confirm everything worked

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
