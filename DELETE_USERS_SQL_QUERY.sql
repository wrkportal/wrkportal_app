-- ============================================
-- SQL QUERIES TO DELETE ALL USERS EXCEPT sandeep200680@gmail.com
-- ============================================
-- 
-- Run these queries in your PostgreSQL database
-- You can use: psql, pgAdmin, DBeaver, or any SQL client
--
-- WARNING: This will permanently delete all users except sandeep200680@gmail.com
-- ============================================

-- STEP 1: Check what users currently exist
SELECT 
    id, 
    email, 
    "firstName", 
    "lastName", 
    role,
    "createdAt"
FROM "User" 
ORDER BY "createdAt" DESC;

-- STEP 2: Count total users
SELECT COUNT(*) as total_users FROM "User";

-- STEP 3: Delete all users except sandeep200680@gmail.com
-- This will automatically cascade delete related data due to foreign key constraints
DELETE FROM "User" 
WHERE email != 'sandeep200680@gmail.com';

-- STEP 4: Verify the result - should show only 1 user
SELECT 
    COUNT(*) as total_users,
    STRING_AGG(email, ', ') as remaining_users
FROM "User";

-- STEP 5: Show the remaining user details
SELECT 
    id, 
    email, 
    "firstName", 
    "lastName", 
    role,
    "emailVerified",
    "createdAt"
FROM "User";

-- ============================================
-- ALTERNATIVE: If you get foreign key errors, 
-- run this more comprehensive version:
-- ============================================

-- First, delete related data manually, then delete users
-- (Only use if the simple DELETE above fails)

BEGIN;

-- Delete collaborations
DELETE FROM "Collaboration" 
WHERE "createdById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete tutorials
DELETE FROM "Tutorial" 
WHERE "createdById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete reminders
DELETE FROM "Reminder" 
WHERE "createdById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
) OR "userId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete default layouts
DELETE FROM "DefaultLayout" 
WHERE "createdById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete reporting files
DELETE FROM "ReportingFile" 
WHERE "uploadedBy" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete reporting dashboards
DELETE FROM "ReportingDashboard" 
WHERE "createdBy" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
) OR "updatedBy" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete approvals
DELETE FROM "Approval" 
WHERE "requestedById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete goals
DELETE FROM "Goal" 
WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete programs
DELETE FROM "Program" 
WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete projects
DELETE FROM "Project" 
WHERE "managerId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
) OR "createdById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete invitations
DELETE FROM "TenantInvitation" 
WHERE "invitedById" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete accounts (OAuth)
DELETE FROM "Account" 
WHERE "userId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete sessions
DELETE FROM "Session" 
WHERE "userId" IN (
    SELECT id FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Delete verification tokens
DELETE FROM "VerificationToken" 
WHERE identifier IN (
    SELECT email FROM "User" WHERE email != 'sandeep200680@gmail.com'
);

-- Finally, delete the users
DELETE FROM "User" 
WHERE email != 'sandeep200680@gmail.com';

-- Commit the transaction
COMMIT;

-- Verify
SELECT COUNT(*) as remaining_users FROM "User";
SELECT email, "firstName", "lastName" FROM "User";

