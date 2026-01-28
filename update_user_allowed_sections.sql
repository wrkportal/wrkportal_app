-- Update UserTenantAccess record with allowed sections
-- INSTRUCTIONS:
-- 1. Replace 'USER_EMAIL_HERE' with the invited user's email (e.g., 'user@example.com')
-- 2. Replace the allowedSections array with the sections you want to grant
-- 3. Run each query one by one

-- ============================================
-- STEP 1: Find the user and their UserTenantAccess record
-- ============================================
-- Replace 'USER_EMAIL_HERE' with the actual email
SELECT 
    u.id as user_id,
    u.email,
    uta.id as uta_id,
    uta."tenantId",
    uta."allowedSections",
    uta."invitationId",
    t.name as tenant_name
FROM "User" u
JOIN "UserTenantAccess" uta ON u.id = uta."userId"
JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'USER_EMAIL_HERE';

-- ============================================
-- STEP 2: Update the allowedSections
-- ============================================
-- IMPORTANT: Use the tenantId from the UserTenantAccess record (the tenant the user was invited to)
-- NOT the user's primary tenantId!
--
-- From STEP 1, look for the row with note: "⬅️ UPDATE THIS RECORD"
-- That row shows the correct tenantId to use
--
-- Copy the user_id and tenantId from STEP 1 results
-- Update the allowedSections JSON array below with the sections you want to grant
-- 
-- Available section names (use exact names):
-- - "Finance"
-- - "Sales"  
-- - "Operations"
-- - "Developer"
-- - "IT Services"
-- - "Customer Service"
-- - "Projects"
-- - "Recruitment"
--
-- Examples:
--   Full access to Finance and Sales: '["Finance", "Sales"]'
--   Only Finance: '["Finance"]'
--   Finance, Sales, and Operations: '["Finance", "Sales", "Operations"]'
--
-- IMPORTANT: Keep the single quotes around the JSON array!

-- Use the exact values from your query results:
-- user_id_to_use: cmkxmfnu9000504l8b57huaoo
-- tenant_id_to_use: cl1769580275016ed55i0zrp

UPDATE "UserTenantAccess"
SET "allowedSections" = '["Finance", "Sales"]'  -- ⬅️ CHANGE THIS: Replace with your desired sections
WHERE "userId" = 'cmkxmfnu9000504l8b57huaoo'     -- ⬅️ Already filled from your query
  AND "tenantId" = 'cl1769580275016ed55i0zrp';   -- ⬅️ Already filled from your query

-- ============================================
-- STEP 3: Verify the update worked
-- ============================================
SELECT 
    u.email,
    uta."allowedSections",
    t.name as tenant_name,
    uta."isActive"
FROM "UserTenantAccess" uta
JOIN "User" u ON uta."userId" = u.id
JOIN "Tenant" t ON uta."tenantId" = t.id
WHERE u.email = 'USER_EMAIL_HERE';  -- ⬅️ CHANGE THIS: Same email as STEP 1
