-- Check what sections were originally set in the invitation
-- This will show what the inviter intended to grant

-- Replace 'INVITED_USER_EMAIL' with the invited user's email
-- Replace 'INVITATION_ID' with the invitationId from the previous query (cmkxmfavj000404l88gplkn64)

-- ============================================
-- Check the original invitation record
-- ============================================
SELECT 
    ti.id as invitation_id,
    ti.email as invited_email,
    ti."tenantId",
    ti.role,
    ti."allowedSections" as invitation_allowed_sections,  -- ⬅️ This shows what was originally set
    ti.status,
    ti."invitedById",
    ti."createdAt",
    t.name as tenant_name,
    inviter.email as inviter_email,
    inviter.name as inviter_name
FROM "TenantInvitation" ti
JOIN "Tenant" t ON ti."tenantId" = t.id
LEFT JOIN "User" inviter ON ti."invitedById" = inviter.id
WHERE ti.email = 'chaturchidiya2025@gmail.com'  -- ⬅️ CHANGE THIS: Invited user's email
  AND ti.id = 'cmkxmfavj000404l88gplkn64'  -- ⬅️ CHANGE THIS: invitationId from previous query
ORDER BY ti."createdAt" DESC;

-- ============================================
-- Check what's currently in UserTenantAccess
-- ============================================
SELECT 
    uta."userId",
    uta."tenantId",
    uta."allowedSections" as current_uta_allowed_sections,
    uta."invitationId",
    ti."allowedSections" as invitation_allowed_sections,
    CASE 
        WHEN uta."allowedSections" = ti."allowedSections" THEN '✅ Match'
        WHEN uta."allowedSections" IS NULL AND ti."allowedSections" IS NULL THEN '✅ Both null'
        WHEN uta."allowedSections" = '[]' AND ti."allowedSections" IS NULL THEN '⚠️ UTA is empty, Invitation is null'
        WHEN uta."allowedSections" = '[]' AND ti."allowedSections" = '[]' THEN '⚠️ Both empty'
        ELSE '❌ Mismatch'
    END as comparison
FROM "UserTenantAccess" uta
JOIN "TenantInvitation" ti ON uta."invitationId" = ti.id
WHERE uta."userId" = 'cmkxmfnu9000504l8b57huaoo'  -- ⬅️ CHANGE THIS: user_id from previous query
  AND uta."invitationId" = 'cmkxmfavj000404l88gplkn64';  -- ⬅️ CHANGE THIS: invitationId
