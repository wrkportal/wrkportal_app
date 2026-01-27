-- SQL Script to Create UserTenantAccess Table
-- Run this in your Neon SQL Editor to enable multi-tenant workspace switching

-- Step 1: Create GroupRole enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupRole') THEN
        CREATE TYPE "GroupRole" AS ENUM (
            'OWNER',
            'ADMIN',
            'MEMBER'
        );
    END IF;
END $$;

-- Step 2: Create UserTenantAccess Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "UserTenantAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEAM_MEMBER',
    "groupRole" "GroupRole",
    "allowedSections" TEXT, -- JSON array of allowed section names, null = full access
    "isActive" BOOLEAN NOT NULL DEFAULT true, -- Primary tenant for the user
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,
    "invitationId" TEXT, -- Reference to TenantInvitation if joined via invitation
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTenantAccess_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create Indexes (if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "UserTenantAccess_userId_tenantId_key" ON "UserTenantAccess"("userId", "tenantId");
CREATE INDEX IF NOT EXISTS "UserTenantAccess_userId_idx" ON "UserTenantAccess"("userId");
CREATE INDEX IF NOT EXISTS "UserTenantAccess_tenantId_idx" ON "UserTenantAccess"("tenantId");
CREATE INDEX IF NOT EXISTS "UserTenantAccess_isActive_idx" ON "UserTenantAccess"("isActive");

-- Step 4: Create Foreign Keys (if they don't exist)
DO $$ 
BEGIN
    -- Foreign key to User table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTenantAccess_userId_fkey'
    ) THEN
        ALTER TABLE "UserTenantAccess" 
        ADD CONSTRAINT "UserTenantAccess_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;

    -- Foreign key to Tenant table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTenantAccess_tenantId_fkey'
    ) THEN
        ALTER TABLE "UserTenantAccess" 
        ADD CONSTRAINT "UserTenantAccess_tenantId_fkey" 
        FOREIGN KEY ("tenantId") 
        REFERENCES "Tenant"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;

    -- Foreign key to User (invitedBy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTenantAccess_invitedById_fkey'
    ) THEN
        ALTER TABLE "UserTenantAccess" 
        ADD CONSTRAINT "UserTenantAccess_invitedById_fkey" 
        FOREIGN KEY ("invitedById") 
        REFERENCES "User"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;

    -- Foreign key to TenantInvitation
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTenantAccess_invitationId_fkey'
    ) THEN
        ALTER TABLE "UserTenantAccess" 
        ADD CONSTRAINT "UserTenantAccess_invitationId_fkey" 
        FOREIGN KEY ("invitationId") 
        REFERENCES "TenantInvitation"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the table was created
SELECT 
    'UserTenantAccess table created successfully!' as status,
    COUNT(*) as existing_records
FROM "UserTenantAccess";
