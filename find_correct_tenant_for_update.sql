-- Find the correct UserTenantAccess record to update
-- This shows which tenant ID belongs to which user and which record to update

-- Replace 'INVITED_USER_EMAIL' with the email of the user who was INVITED (accepted the invitation)
-- Replace 'INVITER_USER_EMAIL' with the email of the user who SENT the invitation (optional, for reference)

-- ============================================
-- STEP 1: See all tenant relationships
-- ============================================
-- This shows:
-- - The INVITED user's primary tenant (their own tenant)
-- - The INVITED user's access to the INVITER's tenant (via UserTenantAccess)
-- - Which record needs to be updated

WITH invited_user AS (
    SELECT id, email, "tenantId" as primary_tenant_id
    FROM "User"
    WHERE email = 'INVITED_USER_EMAIL'  -- ⬅️ CHANGE THIS: Email of the user who was invited
),
inviter_user AS (
    SELECT id, email, "tenantId" as inviter_tenant_id
    FROM "User"
    WHERE email = 'INVITER_USER_EMAIL'  -- ⬅️ CHANGE THIS: Email of the user who sent the invitation (optional)
)
SELECT 
    'INVITED USER INFO' as info_type,
    u.id as user_id,
    u.email as user_email,
    u."tenantId" as primary_tenant_id,
    t1.name as primary_tenant_name,
    'This is the invited user''s OWN tenant (their primary tenant)' as note
FROM "User" u
LEFT JOIN "Tenant" t1 ON u."tenantId" = t1.id
WHERE u.email = 'INVITED_USER_EMAIL'  -- ⬅️ CHANGE THIS

UNION ALL

SELECT 
    'INVITED USER ACCESS TO INVITER TENANT' as info_type,
    u.id as user_id,
    u.email as user_email,
    uta."tenantId" as access_tenant_id,
    t2.name as access_tenant_name,
    '⬅️ UPDATE THIS RECORD - This is the tenant the user was invited to' as note
FROM "User" u
JOIN "UserTenantAccess" uta ON u.id = uta."userId"
JOIN "Tenant" t2 ON uta."tenantId" = t2.id
WHERE u.email = 'INVITED_USER_EMAIL'  -- ⬅️ CHANGE THIS
  AND uta."invitationId" IS NOT NULL;  -- Only show records created via invitation

-- ============================================
-- STEP 2: Get the exact values needed for UPDATE
-- ============================================
-- This gives you the exact user_id and tenantId to use in the UPDATE query

SELECT 
    u.id as user_id_to_use,           -- ⬅️ Use this in UPDATE query
    uta."tenantId" as tenant_id_to_use, -- ⬅️ Use this in UPDATE query
    u.email as invited_user_email,
    t.name as tenant_name,
    uta."allowedSections" as current_allowed_sections,
    uta."invitationId",
    '⬅️ These are the values to use in UPDATE query' as note
FROM "User" u
JOIN "UserTenantAccess" uta ON u.id = uta."userId"
JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'INVITED_USER_EMAIL'  -- ⬅️ CHANGE THIS: Email of the user who was invited
  AND uta."invitationId" IS NOT NULL  -- Only the record created via invitation
ORDER BY uta."joinedAt" DESC
LIMIT 1;  -- Get the most recent invitation
