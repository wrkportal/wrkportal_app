-- Migration script to add missing columns to User table
-- Run this in your Neon production database

-- Create enum types if they don't exist
DO $$
BEGIN
    -- Create GroupRole enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupRole') THEN
        CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');
    END IF;

    -- Create WorkflowType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowType') THEN
        CREATE TYPE "WorkflowType" AS ENUM (
            'SOFTWARE_DEVELOPMENT', 
            'PRODUCT_MANAGEMENT', 
            'MARKETING', 
            'HUMAN_RESOURCES', 
            'LEGAL', 
            'CUSTOMER_SERVICE', 
            'OPERATIONS', 
            'IT_SUPPORT', 
            'FINANCE', 
            'SALES', 
            'GENERAL'
        );
    END IF;
END $$;

-- Add missing columns one by one (with IF NOT EXISTS check)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN directly
-- So we'll use DO blocks to check first

DO $$
BEGIN
    -- location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'location') THEN
        ALTER TABLE "User" ADD COLUMN "location" TEXT;
    END IF;

    -- department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'department') THEN
        ALTER TABLE "User" ADD COLUMN "department" TEXT;
    END IF;

    -- reportsToId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'reportsToId') THEN
        ALTER TABLE "User" ADD COLUMN "reportsToId" TEXT;
    END IF;

    -- resetToken
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'resetToken') THEN
        ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
    END IF;

    -- resetTokenExpiry
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'resetTokenExpiry') THEN
        ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
    END IF;

    -- stripeCustomerId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'stripeCustomerId') THEN
        ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
    END IF;

    -- stripeSubscriptionId
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'stripeSubscriptionId') THEN
        ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
    END IF;

    -- subscriptionStatus
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'subscriptionStatus') THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT;
    END IF;

    -- subscriptionTier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'subscriptionTier') THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT;
    END IF;

    -- subscriptionStartDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'subscriptionStartDate') THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionStartDate" TIMESTAMP(3);
    END IF;

    -- subscriptionEndDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'subscriptionEndDate') THEN
        ALTER TABLE "User" ADD COLUMN "subscriptionEndDate" TIMESTAMP(3);
    END IF;

    -- groupRole (using GroupRole enum type)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'groupRole') THEN
        ALTER TABLE "User" ADD COLUMN "groupRole" "GroupRole";
    END IF;

    -- primaryWorkflowType (using WorkflowType enum type)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'primaryWorkflowType') THEN
        ALTER TABLE "User" ADD COLUMN "primaryWorkflowType" "WorkflowType";
    END IF;

    -- workflowSettings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'workflowSettings') THEN
        ALTER TABLE "User" ADD COLUMN "workflowSettings" JSONB;
    END IF;

    -- assistantName
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'assistantName') THEN
        ALTER TABLE "User" ADD COLUMN "assistantName" TEXT;
    END IF;

    -- voiceSampleUrl
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'voiceSampleUrl') THEN
        ALTER TABLE "User" ADD COLUMN "voiceSampleUrl" TEXT;
    END IF;
END $$;

-- Add foreign key constraint for reportsToId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'User_reportsToId_fkey'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT "User_reportsToId_fkey" 
        FOREIGN KEY ("reportsToId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for reportsToId if it doesn't exist
CREATE INDEX IF NOT EXISTS "User_reportsToId_idx" ON "User"("reportsToId");
