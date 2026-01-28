-- ============================================
-- Create Collaboration Tables
-- ============================================
-- This script creates the Collaboration table and related tables
-- Run this in Neon SQL Editor

-- Step 1: Create Enums (if they don't exist)
DO $$ BEGIN
    CREATE TYPE "CollaborationType" AS ENUM ('PROJECT', 'TASK', 'GENERAL', 'BRAINSTORM', 'REVIEW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CollaborationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CollaborationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SuggestionType" AS ENUM ('CHANGE', 'ADDITION', 'REMOVAL', 'GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create Collaboration table
CREATE TABLE IF NOT EXISTS "Collaboration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CollaborationType" NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'ACTIVE',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create CollaborationMember table
CREATE TABLE IF NOT EXISTS "CollaborationMember" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaborationRole" NOT NULL DEFAULT 'MEMBER',
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "CollaborationMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CollaborationMember_collaborationId_userId_key" UNIQUE ("collaborationId", "userId")
);

-- Step 4: Create CollaborationMessage table
CREATE TABLE IF NOT EXISTS "CollaborationMessage" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT[],
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reactions" JSONB,

    CONSTRAINT "CollaborationMessage_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create CollaborationFile table
CREATE TABLE IF NOT EXISTS "CollaborationFile" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationFile_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create CollaborationSuggestion table
CREATE TABLE IF NOT EXISTS "CollaborationSuggestion" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestionType" "SuggestionType" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "originalContent" TEXT,
    "suggestedContent" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "respondedById" TEXT,
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationSuggestion_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create Foreign Keys
DO $$ BEGIN
    -- Collaboration foreign keys
    ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    
    ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    -- Note: Project and Task foreign keys are optional (nullable)
    -- Add them only if Project and Task tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Project') THEN
        ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Task') THEN
        ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_taskId_fkey" 
            FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CollaborationMember foreign keys
DO $$ BEGIN
    ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_collaborationId_fkey" 
        FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationMember" ADD CONSTRAINT "CollaborationMember_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CollaborationMessage foreign keys
DO $$ BEGIN
    ALTER TABLE "CollaborationMessage" ADD CONSTRAINT "CollaborationMessage_collaborationId_fkey" 
        FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationMessage" ADD CONSTRAINT "CollaborationMessage_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationMessage" ADD CONSTRAINT "CollaborationMessage_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "CollaborationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CollaborationFile foreign keys
DO $$ BEGIN
    ALTER TABLE "CollaborationFile" ADD CONSTRAINT "CollaborationFile_collaborationId_fkey" 
        FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationFile" ADD CONSTRAINT "CollaborationFile_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CollaborationSuggestion foreign keys
DO $$ BEGIN
    ALTER TABLE "CollaborationSuggestion" ADD CONSTRAINT "CollaborationSuggestion_collaborationId_fkey" 
        FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationSuggestion" ADD CONSTRAINT "CollaborationSuggestion_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
    ALTER TABLE "CollaborationSuggestion" ADD CONSTRAINT "CollaborationSuggestion_respondedById_fkey" 
        FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 8: Create Indexes
CREATE INDEX IF NOT EXISTS "Collaboration_tenantId_idx" ON "Collaboration"("tenantId");
CREATE INDEX IF NOT EXISTS "Collaboration_projectId_idx" ON "Collaboration"("projectId");
CREATE INDEX IF NOT EXISTS "Collaboration_taskId_idx" ON "Collaboration"("taskId");
CREATE INDEX IF NOT EXISTS "Collaboration_createdById_idx" ON "Collaboration"("createdById");
CREATE INDEX IF NOT EXISTS "Collaboration_status_idx" ON "Collaboration"("status");

CREATE INDEX IF NOT EXISTS "CollaborationMember_collaborationId_idx" ON "CollaborationMember"("collaborationId");
CREATE INDEX IF NOT EXISTS "CollaborationMember_userId_idx" ON "CollaborationMember"("userId");

CREATE INDEX IF NOT EXISTS "CollaborationMessage_collaborationId_idx" ON "CollaborationMessage"("collaborationId");
CREATE INDEX IF NOT EXISTS "CollaborationMessage_userId_idx" ON "CollaborationMessage"("userId");
CREATE INDEX IF NOT EXISTS "CollaborationMessage_parentId_idx" ON "CollaborationMessage"("parentId");

CREATE INDEX IF NOT EXISTS "CollaborationFile_collaborationId_idx" ON "CollaborationFile"("collaborationId");
CREATE INDEX IF NOT EXISTS "CollaborationFile_userId_idx" ON "CollaborationFile"("userId");

CREATE INDEX IF NOT EXISTS "CollaborationSuggestion_collaborationId_idx" ON "CollaborationSuggestion"("collaborationId");
CREATE INDEX IF NOT EXISTS "CollaborationSuggestion_userId_idx" ON "CollaborationSuggestion"("userId");
CREATE INDEX IF NOT EXISTS "CollaborationSuggestion_status_idx" ON "CollaborationSuggestion"("status");

-- Step 9: Verify tables were created
SELECT 
    'Collaboration' as table_name,
    COUNT(*) as row_count
FROM "Collaboration"
UNION ALL
SELECT 
    'CollaborationMember' as table_name,
    COUNT(*) as row_count
FROM "CollaborationMember"
UNION ALL
SELECT 
    'CollaborationMessage' as table_name,
    COUNT(*) as row_count
FROM "CollaborationMessage"
UNION ALL
SELECT 
    'CollaborationFile' as table_name,
    COUNT(*) as row_count
FROM "CollaborationFile"
UNION ALL
SELECT 
    'CollaborationSuggestion' as table_name,
    COUNT(*) as row_count
FROM "CollaborationSuggestion";
