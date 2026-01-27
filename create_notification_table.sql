-- SQL Script to Create Notification Table
-- Run this in your Neon SQL Editor

-- Step 1: Create Enums (if they don't exist)
DO $$ 
BEGIN
    -- Create NotificationType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        CREATE TYPE "NotificationType" AS ENUM (
            'MENTION',
            'ASSIGNMENT',
            'APPROVAL',
            'DEADLINE',
            'STATUS_CHANGE',
            'COMMENT',
            'MESSAGE',
            'TASK_COMPLETED',
            'PROJECT_UPDATE',
            'OVERDUE_TASK'
        );
    END IF;

    -- Create NotificationPriority enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationPriority') THEN
        CREATE TYPE "NotificationPriority" AS ENUM (
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT'
        );
    END IF;
END $$;

-- Step 2: Create Notification Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create Indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_idx" ON "Notification"("tenantId");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- Step 4: Create Foreign Keys (if they don't exist)
DO $$ 
BEGIN
    -- Foreign key to User table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Notification_userId_fkey'
    ) THEN
        ALTER TABLE "Notification" 
        ADD CONSTRAINT "Notification_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;

    -- Foreign key to Tenant table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Notification_tenantId_fkey'
    ) THEN
        ALTER TABLE "Notification" 
        ADD CONSTRAINT "Notification_tenantId_fkey" 
        FOREIGN KEY ("tenantId") 
        REFERENCES "Tenant"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the table was created
SELECT 
    'Notification table created successfully!' as status,
    COUNT(*) as existing_records
FROM "Notification";
