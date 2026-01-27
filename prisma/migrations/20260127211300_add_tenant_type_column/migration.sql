-- CreateEnum (if not exists)
DO $$ BEGIN
 CREATE TYPE "WorkspaceType" AS ENUM ('ORGANIZATION', 'GROUP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "type" "WorkspaceType" NOT NULL DEFAULT 'ORGANIZATION';
