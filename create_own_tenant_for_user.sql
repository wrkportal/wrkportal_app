-- Create a UserTenantAccess record for the user's "own" tenant
-- This allows Gmail users who accepted invitations to see both workspaces:
-- 1. Their own workspace (new tenant created here)
-- 2. The invited workspace (already exists)

-- ============================================
-- STEP 1: Check current situation
-- ============================================
SELECT 
    u.id as user_id,
    u.email,
    u."tenantId" as current_primary_tenant_id,
    t1.name as current_primary_tenant_name,
    COUNT(DISTINCT uta."tenantId") as additional_tenant_count
FROM "User" u
LEFT JOIN "Tenant" t1 ON u."tenantId" = t1.id
LEFT JOIN "UserTenantAccess" uta ON u.id = uta."userId"
WHERE u.email = 'chaturchidiya2025@gmail.com'
GROUP BY u.id, u.email, u."tenantId", t1.name;

-- ============================================
-- STEP 2: Create a new "own" tenant for the user
-- ============================================
-- This creates a separate tenant that represents the user's own workspace
-- Only run this if the user doesn't already have their own tenant

-- First, create the tenant
INSERT INTO "Tenant" (id, name, domain, "type", "createdAt", "updatedAt")
VALUES (
    'cl' || EXTRACT(EPOCH FROM NOW())::bigint || substr(md5(random()::text), 1, 11),  -- Generate unique ID
    'Chatur Chidiya''s Organization',  -- User's own organization name
    NULL,  -- NULL domain for Gmail users (individual tenant)
    'ORGANIZATION',
    NOW(),
    NOW()
)
RETURNING id, name;

-- ============================================
-- STEP 3: Create UserTenantAccess for the "own" tenant
-- ============================================
-- After running STEP 2, copy the tenant ID from the RETURNING clause
-- Then run this to create the access record

-- Replace 'NEW_TENANT_ID_FROM_STEP_2' with the ID returned from STEP 2
-- Replace 'USER_ID' with the user_id from STEP 1

INSERT INTO "UserTenantAccess" (
    id,  -- ⬅️ Generate unique ID
    "userId",
    "tenantId",
    role,
    "groupRole",
    "allowedSections",
    "isActive",
    "joinedAt",
    "invitedById",
    "invitationId"
)
VALUES (
    'cm' || substr(md5(random()::text || NOW()::text), 1, 25),  -- Generate unique ID (cuid format)
    'cmkxmfnu9000504l8b57huaoo',  -- ⬅️ user_id from STEP 1
    'NEW_TENANT_ID_FROM_STEP_2',  -- ⬅️ tenant ID from STEP 2 RETURNING clause
    'ORG_ADMIN',  -- User is admin of their own tenant
    NULL,
    NULL,  -- Full access to own tenant
    false,  -- Not the active tenant (invited tenant is active)
    NOW(),
    'cmkxmfnu9000504l8b57huaoo',  -- User invited themselves (created their own tenant)
    NULL  -- Not from an invitation
)
RETURNING *;

-- ============================================
-- STEP 4: Verify both tenants are now accessible
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
