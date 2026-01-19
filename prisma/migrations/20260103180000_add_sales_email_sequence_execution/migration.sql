-- CreateTable
CREATE TABLE IF NOT EXISTS "SalesEmailSequenceExecution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextStepDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesEmailSequenceExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_tenantId_idx" ON "SalesEmailSequenceExecution"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_sequenceId_idx" ON "SalesEmailSequenceExecution"("sequenceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_entityType_entityId_idx" ON "SalesEmailSequenceExecution"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_completed_idx" ON "SalesEmailSequenceExecution"("completed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_paused_idx" ON "SalesEmailSequenceExecution"("paused");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalesEmailSequenceExecution_nextStepDate_idx" ON "SalesEmailSequenceExecution"("nextStepDate");

-- AddForeignKey
ALTER TABLE "SalesEmailSequenceExecution" ADD CONSTRAINT "SalesEmailSequenceExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesEmailSequenceExecution" ADD CONSTRAINT "SalesEmailSequenceExecution_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "SalesEmailSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

