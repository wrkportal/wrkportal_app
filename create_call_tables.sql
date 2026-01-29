-- Create Call and related tables
-- This script creates the Call, CallParticipant, and CallRecording tables

-- Create CallType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "CallType" AS ENUM ('ONE_ON_ONE', 'GROUP', 'SCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CallStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'ACTIVE', 'ENDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ParticipantRole enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'PARTICIPANT', 'MODERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Call table
CREATE TABLE IF NOT EXISTS "Call" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" "CallType" NOT NULL DEFAULT 'ONE_ON_ONE',
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdById" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- Create CallParticipant table
CREATE TABLE IF NOT EXISTS "CallParticipant" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isVideoOn" BOOLEAN NOT NULL DEFAULT true,
    "isScreenSharing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CallParticipant_pkey" PRIMARY KEY ("id")
);

-- Create CallRecording table
CREATE TABLE IF NOT EXISTS "CallRecording" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRecording_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Call_tenantId_idx" ON "Call"("tenantId");
CREATE INDEX IF NOT EXISTS "Call_createdById_idx" ON "Call"("createdById");
CREATE INDEX IF NOT EXISTS "Call_status_idx" ON "Call"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Call_roomId_key" ON "Call"("roomId");
CREATE INDEX IF NOT EXISTS "Call_scheduledAt_idx" ON "Call"("scheduledAt");

CREATE INDEX IF NOT EXISTS "CallParticipant_callId_idx" ON "CallParticipant"("callId");
CREATE INDEX IF NOT EXISTS "CallParticipant_userId_idx" ON "CallParticipant"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CallParticipant_callId_userId_key" ON "CallParticipant"("callId", "userId");

CREATE INDEX IF NOT EXISTS "CallRecording_callId_idx" ON "CallRecording"("callId");
CREATE INDEX IF NOT EXISTS "CallRecording_recordedBy_idx" ON "CallRecording"("recordedBy");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "Call" ADD CONSTRAINT "Call_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Call" ADD CONSTRAINT "Call_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CallParticipant" ADD CONSTRAINT "CallParticipant_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CallParticipant" ADD CONSTRAINT "CallParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CallRecording" ADD CONSTRAINT "CallRecording_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
