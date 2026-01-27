-- Create UserTenantAccess table for multi-tenant support
-- Allows users to belong to multiple tenants and switch between them

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTenantAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTenantAccess_userId_tenantId_key" ON "UserTenantAccess"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "UserTenantAccess_userId_idx" ON "UserTenantAccess"("userId");

-- CreateIndex
CREATE INDEX "UserTenantAccess_tenantId_idx" ON "UserTenantAccess"("tenantId");

-- CreateIndex
CREATE INDEX "UserTenantAccess_isActive_idx" ON "UserTenantAccess"("isActive");

-- AddForeignKey
ALTER TABLE "UserTenantAccess" ADD CONSTRAINT "UserTenantAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenantAccess" ADD CONSTRAINT "UserTenantAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenantAccess" ADD CONSTRAINT "UserTenantAccess_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenantAccess" ADD CONSTRAINT "UserTenantAccess_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "TenantInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
