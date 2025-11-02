-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "auditLogRetentionDays" INTEGER NOT NULL DEFAULT 2555,
ADD COLUMN     "notificationRetentionDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "projectRetentionDays" INTEGER NOT NULL DEFAULT 1825,
ADD COLUMN     "taskRetentionDays" INTEGER NOT NULL DEFAULT 1825;
