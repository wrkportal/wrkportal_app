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

-- Step 2: Update existing tasks with a default tenantId
-- This uses the tenantId from the user who created the task
DO $$ 
BEGIN
    UPDATE "Task" t
    SET "tenantId" = u."tenantId"
    FROM "User" u
    WHERE t."createdById" = u.id
    AND t."tenantId" IS NULL;
    
    RAISE NOTICE 'Updated existing tasks with tenantId from creator';
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
    tn.name as tenant_name,
    u.email as created_by
FROM "Task" t
LEFT JOIN "Tenant" tn ON t."tenantId" = tn.id
LEFT JOIN "User" u ON t."createdById" = u.id
LIMIT 10;
