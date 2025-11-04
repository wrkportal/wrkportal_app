-- Update sandeep200680@gmail.com to PLATFORM_OWNER role

UPDATE "User"
SET role = 'PLATFORM_OWNER'
WHERE email = 'sandeep200680@gmail.com';

-- Verify the update
SELECT id, email, role, "tenantId", status
FROM "User"
WHERE email = 'sandeep200680@gmail.com';

