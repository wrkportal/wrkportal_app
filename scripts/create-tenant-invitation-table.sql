-- Create TenantInvitation table if it doesn't exist
-- This script creates the TenantInvitation table based on the Prisma schema

CREATE TABLE IF NOT EXISTS "TenantInvitation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEAM_MEMBER',
    "allowedSections" TEXT,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on token
CREATE UNIQUE INDEX IF NOT EXISTS "TenantInvitation_token_key" ON "TenantInvitation"("token");

-- Create unique constraint on tenantId and email combination
CREATE UNIQUE INDEX IF NOT EXISTS "TenantInvitation_tenantId_email_key" ON "TenantInvitation"("tenantId", "email");

-- Create indexes
CREATE INDEX IF NOT EXISTS "TenantInvitation_tenantId_idx" ON "TenantInvitation"("tenantId");
CREATE INDEX IF NOT EXISTS "TenantInvitation_email_idx" ON "TenantInvitation"("email");
CREATE INDEX IF NOT EXISTS "TenantInvitation_token_idx" ON "TenantInvitation"("token");
CREATE INDEX IF NOT EXISTS "TenantInvitation_status_idx" ON "TenantInvitation"("status");

-- Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'TenantInvitation_invitedById_fkey'
    ) THEN
        ALTER TABLE "TenantInvitation" 
        ADD CONSTRAINT "TenantInvitation_invitedById_fkey" 
        FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'TenantInvitation_tenantId_fkey'
    ) THEN
        ALTER TABLE "TenantInvitation" 
        ADD CONSTRAINT "TenantInvitation_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
