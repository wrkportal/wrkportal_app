-- ============================================
-- Add tenantId column to Task table
-- ============================================
-- This script adds the missing tenantId column to the Task table
-- Run this in Neon SQL Editor

-- Step 1: Check if tenantId column already exists
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Task' 
        AND column_name = 'tenantId'
    ) THEN
        -- Add tenantId column
        ALTER TABLE "Task" 
        ADD COLUMN "tenantId" TEXT;
        
        RAISE NOTICE 'Added tenantId column to Task table';
    ELSE
        RAISE NOTICE 'tenantId column already exists in Task table';
    END IF;
END $$;

-- Step 2: First, let's see what columns exist in the Task table
-- This will help us understand the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Task'
ORDER BY ordinal_position;

-- Step 2b: Update existing tasks with a default tenantId
-- This uses the tenantId from the user who created the task
-- We'll try different possible column names
DO $$ 
DECLARE
    has_created_by_id BOOLEAN;
    has_user_id BOOLEAN;
    has_assignee_id BOOLEAN;
    default_tenant_id TEXT;
BEGIN
    -- Check for createdById
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Task' 
        AND column_name = 'createdById'
    ) INTO has_created_by_id;
    
    -- Check for userId
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Task' 
        AND column_name = 'userId'
    ) INTO has_user_id;
    
    -- Check for assigneeId
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Task' 
        AND column_name = 'assigneeId'
    ) INTO has_assignee_id;
    
    -- Get a default tenant ID (first tenant in the system)
    SELECT id INTO default_tenant_id FROM "Tenant" LIMIT 1;
    
    -- Update existing tasks with tenantId based on available columns
    IF has_created_by_id THEN
        UPDATE "Task" t
        SET "tenantId" = COALESCE(u."tenantId", default_tenant_id)
        FROM "User" u
        WHERE t."createdById" = u.id
        AND t."tenantId" IS NULL;
        RAISE NOTICE 'Updated tasks using createdById column';
    ELSIF has_user_id THEN
        UPDATE "Task" t
        SET "tenantId" = COALESCE(u."tenantId", default_tenant_id)
        FROM "User" u
        WHERE t."userId" = u.id
        AND t."tenantId" IS NULL;
        RAISE NOTICE 'Updated tasks using userId column';
    ELSIF has_assignee_id THEN
        UPDATE "Task" t
        SET "tenantId" = COALESCE(u."tenantId", default_tenant_id)
        FROM "User" u
        WHERE t."assigneeId" = u.id
        AND t."tenantId" IS NULL;
        RAISE NOTICE 'Updated tasks using assigneeId column';
    ELSE
        -- If no user reference column exists, set all to default tenant
        UPDATE "Task"
        SET "tenantId" = default_tenant_id
        WHERE "tenantId" IS NULL;
        RAISE WARNING 'No user reference column found. Set all tasks to default tenant.';
    END IF;
    
    -- For any remaining NULL values, set to default tenant
    UPDATE "Task"
    SET "tenantId" = default_tenant_id
    WHERE "tenantId" IS NULL;
    
    RAISE NOTICE 'Completed updating tasks with tenantId';
END $$;

-- Step 3: Make tenantId NOT NULL (after setting values)
DO $$ 
BEGIN
    -- First check if there are any NULL values
    IF EXISTS (SELECT 1 FROM "Task" WHERE "tenantId" IS NULL) THEN
        RAISE WARNING 'Some tasks still have NULL tenantId. Please review and update manually.';
    ELSE
        -- Make column NOT NULL
        ALTER TABLE "Task" 
        ALTER COLUMN "tenantId" SET NOT NULL;
        
        RAISE NOTICE 'Set tenantId to NOT NULL';
    END IF;
END $$;

-- Step 4: Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'Task_tenantId_fkey'
        AND table_name = 'Task'
    ) THEN
        ALTER TABLE "Task" 
        ADD CONSTRAINT "Task_tenantId_fkey" 
        FOREIGN KEY ("tenantId") 
        REFERENCES "Tenant"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for tenantId';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 5: Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS "Task_tenantId_idx" ON "Task"("tenantId");

-- Step 6: Verify the changes
SELECT 
    'Task table' as table_name,
    COUNT(*) as total_tasks,
    COUNT("tenantId") as tasks_with_tenant,
    COUNT(*) FILTER (WHERE "tenantId" IS NULL) as tasks_without_tenant
FROM "Task";

-- Show sample of tasks with tenantId
SELECT 
    t.id,
    t.title,
    t."tenantId",
    tn.name as tenant_name
FROM "Task" t
LEFT JOIN "Tenant" tn ON t."tenantId" = tn.id
LIMIT 10;
