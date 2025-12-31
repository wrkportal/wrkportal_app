-- SIMPLE SQL Query to Delete All Users Except sandeep200680@gmail.com
-- 
-- This is a simpler version that handles cascading deletes automatically
-- Run this in your PostgreSQL database (psql, pgAdmin, or any SQL client)
--
-- STEP 1: First check what users exist
SELECT id, email, "firstName", "lastName", "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- STEP 2: Delete all users except sandeep200680@gmail.com
-- This will cascade delete related data automatically due to foreign key constraints
DELETE FROM "User" 
WHERE email != 'sandeep200680@gmail.com';

-- STEP 3: Verify the result
SELECT 
    COUNT(*) as total_users,
    STRING_AGG(email, ', ') as remaining_users
FROM "User";

-- STEP 4: Show the remaining user details
SELECT id, email, "firstName", "lastName", role, "createdAt", "emailVerified"
FROM "User";

