-- SQL Query to Delete All Users Except sandeep200680@gmail.com
-- 
-- WARNING: This will permanently delete all users except sandeep200680@gmail.com
-- Run this in your PostgreSQL database
--
-- Usage:
-- 1. Connect to your database
-- 2. Run this query
-- 3. Check the results

-- First, let's see what users exist
SELECT id, email, "firstName", "lastName", "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- Get the user ID we want to keep
DO $$
DECLARE
    keep_user_id TEXT;
    users_to_delete TEXT[];
BEGIN
    -- Find the user to keep
    SELECT id INTO keep_user_id
    FROM "User"
    WHERE email = 'sandeep200680@gmail.com';
    
    IF keep_user_id IS NULL THEN
        RAISE EXCEPTION 'User sandeep200680@gmail.com not found!';
    END IF;
    
    RAISE NOTICE 'Keeping user: %', keep_user_id;
    
    -- Get all user IDs to delete
    SELECT ARRAY_AGG(id) INTO users_to_delete
    FROM "User"
    WHERE id != keep_user_id;
    
    IF users_to_delete IS NULL OR array_length(users_to_delete, 1) IS NULL THEN
        RAISE NOTICE 'No users to delete';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % users to delete', array_length(users_to_delete, 1);
    
    -- Delete related data first (to avoid foreign key constraints)
    
    -- Delete collaborations
    DELETE FROM "Collaboration" 
    WHERE "createdById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted collaborations';
    
    -- Delete tutorials
    DELETE FROM "Tutorial" 
    WHERE "createdById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted tutorials';
    
    -- Delete reminders
    DELETE FROM "Reminder" 
    WHERE "createdById" = ANY(users_to_delete) 
       OR "userId" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted reminders';
    
    -- Delete default layouts
    DELETE FROM "DefaultLayout" 
    WHERE "createdById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted default layouts';
    
    -- Delete reporting files
    DELETE FROM "ReportingFile" 
    WHERE "uploadedBy" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted reporting files';
    
    -- Delete reporting dashboards
    DELETE FROM "ReportingDashboard" 
    WHERE "createdBy" = ANY(users_to_delete) 
       OR "updatedBy" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted reporting dashboards';
    
    -- Delete approvals
    DELETE FROM "Approval" 
    WHERE "requestedById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted approvals';
    
    -- Delete goals
    DELETE FROM "Goal" 
    WHERE "ownerId" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted goals';
    
    -- Delete programs
    DELETE FROM "Program" 
    WHERE "ownerId" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted programs';
    
    -- Delete projects
    DELETE FROM "Project" 
    WHERE "managerId" = ANY(users_to_delete) 
       OR "createdById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted projects';
    
    -- Delete invitations
    DELETE FROM "TenantInvitation" 
    WHERE "invitedById" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted invitations';
    
    -- Delete accounts (OAuth accounts)
    DELETE FROM "Account" 
    WHERE "userId" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted accounts';
    
    -- Delete sessions
    DELETE FROM "Session" 
    WHERE "userId" = ANY(users_to_delete);
    RAISE NOTICE 'Deleted sessions';
    
    -- Delete verification tokens
    DELETE FROM "VerificationToken" 
    WHERE identifier IN (SELECT email FROM "User" WHERE id = ANY(users_to_delete));
    RAISE NOTICE 'Deleted verification tokens';
    
    -- Finally, delete the users
    DELETE FROM "User" 
    WHERE id = ANY(users_to_delete);
    RAISE NOTICE 'Deleted % users', array_length(users_to_delete, 1);
    
    RAISE NOTICE '✅ Deletion complete!';
END $$;

-- Verify the result
SELECT 
    COUNT(*) as total_users,
    STRING_AGG(email, ', ') as remaining_users
FROM "User";

-- Show the remaining user details
SELECT id, email, "firstName", "lastName", role, "createdAt"
FROM "User";

